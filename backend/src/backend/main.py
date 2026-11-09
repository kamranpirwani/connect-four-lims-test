from collections.abc import Iterator
from contextlib import asynccontextmanager
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from .database import Database, is_busy
from .models.game import Board, InvalidBoard
from .schemas import (
    CreateGame,
    CreateUser,
    EvaluateBoard,
    GameResponse,
    GameSummary,
    StatusResponse,
    SubmitMove,
    UserResponse,
)
from .services import Conflict, GameService, NotFound


def get_service(request: Request) -> Iterator[GameService]:
    with request.app.state.database.sessions() as session:
        yield GameService(session)


Service = Annotated[GameService, Depends(get_service)]
api = APIRouter(prefix="/api")


@api.post("/users", response_model=UserResponse, status_code=201)
def create_user(body: CreateUser, response: Response, service: Service) -> UserResponse:
    user, created = service.create_user(body.name)
    response.status_code = 201 if created else 200
    response.headers["Location"] = f"/api/users/{user.id}"
    return user


@api.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: UUID, service: Service) -> UserResponse:
    return service.user(str(user_id))


@api.get("/users/{user_id}/games", response_model=list[GameSummary])
def list_games(user_id: UUID, service: Service) -> list[GameSummary]:
    return service.list_games(str(user_id))


@api.post("/games", response_model=GameResponse, status_code=201)
def create_game(body: CreateGame, response: Response, service: Service) -> GameResponse:
    game = service.create_game(str(body.user_id))
    response.headers["Location"] = f"/api/games/{game.id}"
    return game


@api.get("/games/{game_id}", response_model=GameResponse)
def get_game(game_id: UUID, service: Service) -> GameResponse:
    return service.get_game(str(game_id))


@api.post("/games/{game_id}/moves", response_model=GameResponse, status_code=201)
def submit_move(game_id: UUID, body: SubmitMove, service: Service) -> GameResponse:
    return service.move(str(game_id), body)


@api.delete("/games/{game_id}", status_code=204)
def delete_game(game_id: UUID, service: Service) -> Response:
    service.delete_game(str(game_id))
    return Response(status_code=204)


def create_app(database_url: str | None = None) -> FastAPI:
    database = Database(database_url)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        database.initialize()
        try:
            yield
        finally:
            database.close()

    app = FastAPI(title="Connect Four", version="0.2.0", lifespan=lifespan)
    app.state.database = database
    app.include_router(api)

    @app.exception_handler(NotFound)
    @app.exception_handler(Conflict)
    @app.exception_handler(InvalidBoard)
    async def handle_domain_error(_request: Request, error: Exception) -> JSONResponse:
        code, status = (
            ("not_found", 404)
            if isinstance(error, NotFound)
            else (("invalid_board", 422) if isinstance(error, InvalidBoard) else ("conflict", 409))
        )
        return JSONResponse(
            status_code=status, content={"error": {"code": code, "message": str(error)}}
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation(_request: Request, error: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "invalid_request",
                    "message": "Check the request fields.",
                    "details": [
                        {"field": ".".join(map(str, item["loc"])), "message": item["msg"]}
                        for item in error.errors()
                    ],
                }
            },
        )

    @app.exception_handler(OperationalError)
    async def handle_database_busy(_request: Request, error: OperationalError) -> JSONResponse:
        if not is_busy(error):
            raise error
        return JSONResponse(
            status_code=409,
            content={
                "error": {
                    "code": "conflict",
                    "message": "The game is being updated. Refresh its state and try again.",
                }
            },
        )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/evaluate_board_state")
    def evaluate_board_state(body: EvaluateBoard) -> dict[str, StatusResponse]:
        """Stateless exercise compatibility; cannot modify any saved game."""
        board = Board.from_rows(body.board)
        board.validate_history()
        return {"board": StatusResponse.model_validate(board.get_status())}

    return app


app = create_app()

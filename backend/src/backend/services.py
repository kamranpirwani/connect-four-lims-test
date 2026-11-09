from sqlalchemy.orm import Session

from .models.game import Board, InvalidMove
from .records import GameRecord, now
from .repository import Repository
from .schemas import (
    GameResponse,
    GameSummary,
    MoveResponse,
    StatusResponse,
    SubmitMove,
    UserResponse,
)


class NotFound(Exception):
    pass


class Conflict(Exception):
    pass


class GameService:
    def __init__(self, session: Session):
        self.session = session
        self.repository = Repository(session)

    def user(self, user_id: str) -> UserResponse:
        user = self.repository.find_user(user_id)
        if user is None:
            raise NotFound("Profile not found. Enter your name to continue.")
        return UserResponse.model_validate(user)

    def create_user(self, name: str) -> tuple[UserResponse, bool]:
        with self.session.begin():
            user, created = self.repository.create_or_resume_user(name)
            result = UserResponse.model_validate(user)
        return result, created

    def _game(self, game_id: str) -> GameRecord:
        game = self.repository.find_game(game_id)
        if game is None:
            raise NotFound("Game not found. It may have been deleted.")
        return game

    def _summary(self, game: GameRecord) -> GameSummary:
        status = StatusResponse.model_validate(Board.from_rows(game.board).get_status())
        return GameSummary(
            id=game.id,
            user_id=game.user_id,
            board=game.board,
            version=game.version,
            created_at=game.created_at,
            updated_at=game.updated_at,
            **status.model_dump(),
        )

    def _response(self, game: GameRecord) -> GameResponse:
        return GameResponse(
            **self._summary(game).model_dump(),
            moves=[
                MoveResponse.model_validate(move) for move in self.repository.list_moves(game.id)
            ],
        )

    def list_games(self, user_id: str) -> list[GameSummary]:
        self.user(user_id)
        return [self._summary(game) for game in self.repository.list_games(user_id)]

    def create_game(self, user_id: str) -> GameResponse:
        with self.session.begin():
            self.user(user_id)
            result = self._response(self.repository.create_game(user_id))
        return result

    def get_game(self, game_id: str) -> GameResponse:
        return self._response(self._game(game_id))

    def move(self, game_id: str, request: SubmitMove) -> GameResponse:
        with self.session.begin():
            game = self._game(game_id)
            if game.version != request.expected_version:
                raise Conflict(
                    "The game has changed. Refresh its state before making another move."
                )
            try:
                board, move = Board.from_rows(game.board).drop(request.column, request.player)
            except InvalidMove as error:
                raise Conflict(str(error)) from error
            if not self.repository.apply_move(
                game_id, request.expected_version, board, move, now()
            ):
                raise Conflict(
                    "The game has changed. Refresh its state before making another move."
                )
            self.session.expire(game)
            result = self._response(game)
        return result

    def delete_game(self, game_id: str) -> None:
        with self.session.begin():
            self._game(game_id)
            self.repository.delete_game(game_id)

from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models.game import COLS, ROWS, GameState, Player


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CreateUser(RequestModel):
    name: str = Field(strict=True, min_length=1, max_length=80)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value: object) -> object:
        return " ".join(value.split()) if isinstance(value, str) else value


class CreateGame(RequestModel):
    user_id: UUID


class SubmitMove(RequestModel):
    column: int = Field(strict=True, ge=0, lt=COLS)
    expected_version: int = Field(strict=True, ge=0, le=ROWS * COLS)
    player: Player | None = None

    @field_validator("player", mode="before")
    @classmethod
    def strict_player(cls, value: object) -> object:
        if value is not None and (type(value) is not int or value not in (1, 2)):
            raise ValueError("Player must be 1 (blue) or 2 (red).")
        return value


type BoardCell = Annotated[int, Field(strict=True, ge=0, le=2)]
type BoardRow = Annotated[list[BoardCell], Field(min_length=COLS, max_length=COLS)]


class EvaluateBoard(RequestModel):
    board: list[BoardRow] = Field(min_length=ROWS, max_length=ROWS)


class ResponseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @field_validator("*", mode="after")
    @classmethod
    def utc_dates(cls, value: object) -> object:
        if isinstance(value, datetime) and value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value


class UserResponse(ResponseModel):
    id: UUID
    name: str
    created_at: datetime


class PositionResponse(ResponseModel):
    row: int
    column: int


class StatusResponse(ResponseModel):
    state: GameState
    next_player: Player | None
    winner: Player | None
    winning_cells: tuple[PositionResponse, ...]


class MoveResponse(PositionResponse):
    number: int
    player: Player
    created_at: datetime


class GameSummary(StatusResponse):
    id: UUID
    user_id: UUID
    board: list[list[int]]
    version: int
    created_at: datetime
    updated_at: datetime


class GameResponse(GameSummary):
    moves: list[MoveResponse]

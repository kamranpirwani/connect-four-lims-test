from datetime import datetime
from uuid import uuid4

from sqlalchemy import delete, select, update
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session

from .models.game import Board, Move
from .records import GameRecord, MoveRecord, UserRecord, now


class Repository:
    def __init__(self, session: Session):
        self.session = session

    def find_user(self, user_id: str) -> UserRecord | None:
        return self.session.get(UserRecord, user_id)

    def create_or_resume_user(self, name: str) -> tuple[UserRecord, bool]:
        result = self.session.execute(
            insert(UserRecord)
            .values(id=str(uuid4()), name=name, name_key=name.casefold(), created_at=now())
            .on_conflict_do_nothing(index_elements=[UserRecord.name_key])
        )
        user = self.session.scalars(
            select(UserRecord).where(UserRecord.name_key == name.casefold())
        ).one()
        return user, result.rowcount == 1

    def find_game(self, game_id: str) -> GameRecord | None:
        return self.session.get(GameRecord, game_id)

    def list_games(self, user_id: str) -> list[GameRecord]:
        return list(
            self.session.scalars(
                select(GameRecord)
                .where(GameRecord.user_id == user_id)
                .order_by(GameRecord.updated_at.desc(), GameRecord.id)
            )
        )

    def create_game(self, user_id: str) -> GameRecord:
        game = GameRecord(user_id=user_id, board=Board().to_rows())
        self.session.add(game)
        self.session.flush()
        return game

    def list_moves(self, game_id: str) -> list[MoveRecord]:
        return list(
            self.session.scalars(
                select(MoveRecord).where(MoveRecord.game_id == game_id).order_by(MoveRecord.number)
            )
        )

    def apply_move(
        self, game_id: str, version: int, board: Board, move: Move, at: datetime
    ) -> bool:
        # The version predicate is enforced by the database, not just Python.
        result = self.session.execute(
            update(GameRecord)
            .where(GameRecord.id == game_id, GameRecord.version == version)
            .values(board=board.to_rows(), version=version + 1, updated_at=at)
            .execution_options(synchronize_session=False)
        )
        if result.rowcount != 1:
            return False
        self.session.add(
            MoveRecord(
                game_id=game_id,
                number=version + 1,
                row=move.row,
                column=move.column,
                player=int(move.player),
                created_at=at,
            )
        )
        self.session.flush()
        return True

    def delete_game(self, game_id: str) -> None:
        self.session.execute(delete(GameRecord).where(GameRecord.id == game_id))

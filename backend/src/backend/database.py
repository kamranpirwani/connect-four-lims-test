import os
import sqlite3
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from .records import Base

DEFAULT_DB = Path(__file__).resolve().parents[2] / "data" / "connect-four.sqlite3"


class Database:
    def __init__(self, url: str | None = None):
        self.url = url or os.environ.get("DATABASE_URL") or f"sqlite:///{DEFAULT_DB}"
        if not self.url.startswith("sqlite:///"):
            raise ValueError("This exercise supports SQLite URLs (sqlite:///path/to/file).")
        self.engine = create_engine(
            self.url,
            connect_args={"check_same_thread": False, "autocommit": False, "timeout": 5},
        )
        event.listen(self.engine, "connect", self._configure_connection)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)

    @staticmethod
    def _configure_connection(connection: sqlite3.Connection, _record: object) -> None:
        # SQLite ignores foreign_keys inside a transaction. Set it before BEGIN.
        previous = connection.autocommit
        connection.autocommit = True
        connection.execute("PRAGMA foreign_keys=ON")
        connection.autocommit = previous

    def initialize(self) -> None:
        path = self.engine.url.database
        if path and path != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        Base.metadata.create_all(self.engine)

    def close(self) -> None:
        self.engine.dispose()


def is_busy(error: Exception) -> bool:
    original = getattr(error, "orig", None)
    code = getattr(original, "sqlite_errorcode", 0)
    return (code & 0xFF) in (sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED)

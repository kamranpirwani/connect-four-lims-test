"""Connect Four rules, independent of HTTP and persistence."""

from dataclasses import dataclass
from enum import IntEnum, StrEnum
from functools import lru_cache
from typing import Literal

ROWS, COLS, WIN_STREAK = 6, 7, 4
type Cell = Literal[0, 1, 2]


class Player(IntEnum):
    blue = 1
    red = 2

    @property
    def opponent(self) -> "Player":
        return Player.red if self == Player.blue else Player.blue


class GameState(StrEnum):
    not_started = "not_started"
    in_progress = "in_progress"
    complete = "complete"
    draw = "draw"


class InvalidBoard(ValueError):
    pass


class InvalidMove(ValueError):
    pass


@dataclass(frozen=True)
class Position:
    row: int
    column: int


@dataclass(frozen=True)
class Move:
    row: int
    column: int
    player: Player


@dataclass(frozen=True)
class BoardStatus:
    state: GameState
    next_player: Player | None
    winner: Player | None
    winning_cells: tuple[Position, ...] = ()


@dataclass(frozen=True)
class Board:
    board: tuple[tuple[Cell, ...], ...] = tuple(tuple(0 for _ in range(COLS)) for _ in range(ROWS))

    def __post_init__(self) -> None:
        if len(self.board) != ROWS or any(len(row) != COLS for row in self.board):
            raise InvalidBoard("The board must have 6 rows and 7 columns.")
        if any(
            type(cell) is not int or cell not in (0, 1, 2) for row in self.board for cell in row
        ):
            raise InvalidBoard("Cells must be integers: 0, 1, or 2.")
        for row in range(ROWS - 1):
            for column in range(COLS):
                if self.board[row][column] and not self.board[row + 1][column]:
                    raise InvalidBoard("A chip cannot float above an empty cell.")

    @classmethod
    def from_rows(cls, rows: list[list[int]]) -> "Board":
        return cls(tuple(tuple(row) for row in rows))

    def to_rows(self) -> list[list[int]]:
        return [list(row) for row in self.board]

    def _winning_cells(self, player: Player) -> tuple[Position, ...]:
        cells: set[tuple[int, int]] = set()
        for row in range(ROWS):
            for column in range(COLS):
                for dr, dc in ((0, 1), (1, 0), (1, 1), (-1, 1)):
                    line = [(row + i * dr, column + i * dc) for i in range(WIN_STREAK)]
                    if all(
                        0 <= r < ROWS and 0 <= c < COLS and self.board[r][c] == player
                        for r, c in line
                    ):
                        cells.update(line)
        return tuple(Position(row, column) for row, column in sorted(cells))

    def get_status(self) -> BoardStatus:
        blue = sum(cell == Player.blue for row in self.board for cell in row)
        red = sum(cell == Player.red for row in self.board for cell in row)
        if blue not in (red, red + 1):
            raise InvalidBoard("Blue must go first, then players must alternate.")
        next_player = Player.blue if blue == red else Player.red
        blue_win, red_win = self._winning_cells(Player.blue), self._winning_cells(Player.red)
        if blue_win and red_win:
            raise InvalidBoard("Both players cannot win.")
        winner = Player.blue if blue_win else Player.red if red_win else None
        if winner:
            if winner == next_player:
                raise InvalidBoard("The winning player must have made the last move.")
            return BoardStatus(GameState.complete, None, winner, blue_win or red_win)
        if blue + red == ROWS * COLS:
            return BoardStatus(GameState.draw, None, None)
        state = GameState.in_progress if blue + red else GameState.not_started
        return BoardStatus(state, next_player, None)

    def drop(self, column: int, player: Player | None = None) -> tuple["Board", Move]:
        if type(column) is not int or not 0 <= column < COLS:
            raise InvalidMove("Choose a column from 0 to 6.")
        status = self.get_status()
        if status.next_player is None:
            raise InvalidMove("This game is over. Create a new game to play again.")
        if player is not None and player != status.next_player:
            raise InvalidMove("It is the other player's turn.")
        row = next((r for r in range(ROWS - 1, -1, -1) if self.board[r][column] == 0), None)
        if row is None:
            raise InvalidMove("That column is full. Choose another column.")
        rows = self.to_rows()
        rows[row][column] = int(status.next_player)
        return Board.from_rows(rows), Move(row, column, status.next_player)

    def validate_history(self) -> None:
        """Reject unreachable external boards, including play after a win.

        Reverse top-of-column moves with memoized heights. For a win, first
        remove a possible final chip that eliminates every winning line.
        Saved games originate only from drop(), so don't need this search.
        """
        status = self.get_status()
        columns = tuple(
            tuple(self.board[r][c] for r in range(ROWS - 1, -1, -1) if self.board[r][c])
            for c in range(COLS)
        )
        heights = tuple(len(column) for column in columns)

        @lru_cache(maxsize=None)
        def reachable(remaining: tuple[int, ...]) -> bool:
            count = sum(remaining)
            if count == 0:
                return True
            last = Player.blue if count % 2 else Player.red
            for column, height in enumerate(remaining):
                if height and columns[column][height - 1] == last:
                    before = remaining[:column] + (height - 1,) + remaining[column + 1 :]
                    if reachable(before):
                        return True
            return False

        if status.winner is None:
            if reachable(heights):
                return
        else:
            for column, height in enumerate(heights):
                if not height or columns[column][height - 1] != status.winner:
                    continue
                rows = self.to_rows()
                rows[ROWS - height][column] = 0
                before = Board.from_rows(rows)
                if not before._winning_cells(status.winner) and reachable(
                    heights[:column] + (height - 1,) + heights[column + 1 :]
                ):
                    return
        raise InvalidBoard(
            "This board cannot be reached by legal moves that stop when a player wins."
        )

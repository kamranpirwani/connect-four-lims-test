from pydantic import BaseModel, Field
from enum import IntEnum, Enum

ROWS, COLS = (6, 7)
WIN_STREAK = 4

class Move(BaseModel):
    row: int = Field(ge=0, lt=ROWS)
    col: int = Field(ge=0, lt=COLS)

class GameState(str, Enum):
    not_started = 'not_started' 
    in_progress = 'in_progress'
    draw = 'draw'
    complete = 'complete'

class Player(IntEnum):
    none = 0
    blue = 1
    red = 2

class Board(BaseModel):
    board: list[list[int]]

    def get_winner(self, next_player: Player) -> Player | None:
        blue_won = self.is_game_over(Player.blue.value)
        red_won = self.is_game_over(Player.red.value)

        if blue_won and red_won:
            raise ValueError("Only one player can win")

        if blue_won:
            if next_player != Player.red.value:
                raise ValueError("If blue won, must be reds turn now technically")
            return Player.blue.value
        if red_won:
                    if next_player != Player.blue.value:
                        raise ValueError("If red won, must be reds turn now technically")
                    return Player.red.value

        return None

    def is_game_over(self, player: Player) -> bool:
        # horizontal
        for row in range(ROWS):
            for col in range(COLS - WIN_STREAK + 1):
                if all(self.board[row][col + i] == player for i in range(WIN_STREAK)):
                    return True

        # vertical
        for row in range(3):
            for col in range(COLS):
                if all(self.board[row + i][col] == player for i in range(WIN_STREAK)):
                    return True

        # diagonal
        # down right
        for row in range(3):
            for col in range(4):
                if all(self.board[row + i][col + i] == player for i in range(WIN_STREAK)):
                    return True
        # upright
        for row in range(WIN_STREAK - 1, ROWS):
                    for col in range(COLS - WIN_STREAK + 1):
                        if all(self.board[row - i][col + i] == player for i in range(WIN_STREAK)):
                            return True

        return False

    def validate_gravity(self) -> None:
        # -1 here bec of bottom
        for row in range(ROWS - 1):
            for column in range(COLS):
                cell = self.board[row][column]
                under = self.board[row + 1][column]

                if cell != 0 and under == 0:
                    raise ValueError("Chips have to be placed in their lowest possible position")


    def get_game_state(self, winner: Player | None) -> GameState: 
        if winner is not None:
            return GameState.complete
        
        has_started = False
        is_full = True

        for row in range(ROWS):
            for column in range(COLS):
                cell = self.board[row][column]
                if cell != Player.none.value:
                    has_started = True
                else:
                    is_full = False

        if has_started is False:
            return GameState.not_started

        if is_full:
            return GameState.draw

        
    def get_status(self) -> dict:
        self.validate_gravity()

        next_turn = self.get_next_players_turn()
        winner = self.get_winner(next_turn)
        state = self.get_game_state(winner)

        return {
            "next_player": next_turn,
            "state": state,
            "winner": winner
        }

    def get_next_players_turn(self) -> Player:
        red_count = 0
        blue_count = 0 

        for row in self.board:
            for cell in row:
                if cell == Player.blue.value:
                    blue_count += 1
                elif cell == Player.red.value:
                    red_count += 1

        if blue_count == red_count:
            return Player.blue

        if blue_count == red_count + 1:
            return Player.red

        # raise inconsistency
        raise ValueError('Move ordering is incorrect, blue needs to go first and then alternate until the game has been completed')
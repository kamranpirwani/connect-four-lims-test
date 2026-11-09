import pytest

from backend.models.game import Board, GameState, InvalidBoard, InvalidMove, Player


def play(columns):
    board = Board()
    for column in columns:
        board, _ = board.drop(column)
    return board


def test_empty_and_in_progress():
    board = Board()
    assert board.get_status().state == GameState.not_started
    assert board.get_status().next_player == Player.blue
    moved, move = board.drop(3)
    assert (move.row, move.column, move.player) == (5, 3, Player.blue)
    assert moved.get_status().state == GameState.in_progress
    assert moved.get_status().next_player == Player.red
    assert board.board[5][3] == 0  # Applying a move doesn't mutate the old snapshot.


def test_gravity_stacks_chips():
    board = Board()
    for expected_row in range(5, -1, -1):
        board, move = board.drop(4)
        assert move.row == expected_row
    with pytest.raises(InvalidMove, match="full"):
        board.drop(4)


@pytest.mark.parametrize("column", [-1, 7, True, "3", 1.0])
def test_rejects_invalid_columns(column):
    with pytest.raises(InvalidMove):
        Board().drop(column)


def test_rejects_wrong_player():
    with pytest.raises(InvalidMove, match="turn"):
        Board().drop(0, Player.red)


BLUE_DIAGONAL = [0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 5, 3, 3]
WINNING_GAMES = [
    ([0, 6, 1, 6, 2, 5, 3], Player.blue),
    ([6, 0, 6, 1, 5, 2, 5, 3], Player.red),
    ([0, 1, 0, 1, 0, 1, 0], Player.blue),
    ([1, 0, 1, 0, 2, 0, 2, 0], Player.red),
    (BLUE_DIAGONAL, Player.blue),
    ([6 - c for c in BLUE_DIAGONAL], Player.blue),
    ([6] + BLUE_DIAGONAL, Player.red),
    ([0] + [6 - c for c in BLUE_DIAGONAL], Player.red),
]


@pytest.mark.parametrize(("columns", "winner"), WINNING_GAMES)
def test_wins_in_every_direction_for_each_player(columns, winner):
    board = play(columns)
    status = board.get_status()
    assert status.state == GameState.complete
    assert status.winner == winner
    assert status.next_player is None
    assert len(status.winning_cells) == 4
    assert all(board.board[p.row][p.column] == winner for p in status.winning_cells)
    board.validate_history()
    with pytest.raises(InvalidMove, match="over"):
        board.drop(6)


def test_five_in_a_row_returns_all_winning_cells():
    rows = Board().to_rows()
    rows[5] = [1, 1, 0, 1, 1, 2, 2]
    rows[4] = [0, 0, 0, 0, 0, 2, 2]
    board, _ = Board.from_rows(rows).drop(2)
    assert [(p.row, p.column) for p in board.get_status().winning_cells] == [
        (5, c) for c in range(5)
    ]


DRAW = [
    [1, 1, 2, 2, 1, 1, 2],
    [2, 2, 1, 1, 2, 2, 1],
    [1, 1, 2, 2, 1, 1, 2],
    [2, 2, 1, 1, 2, 2, 1],
    [1, 1, 2, 2, 1, 1, 2],
    [2, 2, 1, 1, 2, 2, 1],
]


def test_draw():
    board = Board.from_rows(DRAW)
    status = board.get_status()
    assert status.state == GameState.draw
    assert status.winner is None
    assert status.next_player is None
    assert status.winning_cells == ()
    board.validate_history()
    with pytest.raises(InvalidMove):
        board.drop(0)


def test_one_move_can_complete_two_diagonals_and_all_cells_are_reported():
    board = play(
        [
            1,
            2,
            5,
            5,
            6,
            6,
            6,
            4,
            0,
            4,
            6,
            2,
            5,
            2,
            2,
            0,
            0,
            6,
            5,
            4,
            4,
            6,
            0,
            2,
            2,
            1,
            3,
            1,
            5,
            5,
            0,
            4,
            1,
            0,
            3,
            4,
            3,
            3,
        ]
    )
    status = board.get_status()
    assert status.winner == Player.red
    assert [(p.row, p.column) for p in status.winning_cells] == [
        (0, 5),
        (1, 2),
        (1, 4),
        (2, 3),
        (3, 2),
        (3, 4),
        (4, 1),
        (4, 5),
    ]
    board.validate_history()


def test_a_win_on_the_last_empty_cell_takes_precedence_over_a_draw():
    board = play(
        [
            5,
            6,
            0,
            3,
            4,
            2,
            2,
            3,
            0,
            3,
            3,
            5,
            3,
            3,
            0,
            4,
            2,
            2,
            1,
            2,
            2,
            4,
            5,
            1,
            1,
            1,
            6,
            6,
            6,
            6,
            1,
            0,
            5,
            4,
            0,
            1,
            0,
            6,
            4,
            4,
            5,
            5,
        ]
    )
    assert all(cell != 0 for row in board.board for cell in row)
    status = board.get_status()
    assert status.state == GameState.complete
    assert status.winner == Player.red
    assert status.next_player is None
    assert [(p.row, p.column) for p in status.winning_cells] == [(0, c) for c in range(3, 7)]
    board.validate_history()


def test_external_board_cannot_have_red_play_first_even_when_counts_match():
    rows = Board().to_rows()
    rows[5][0], rows[4][0] = 2, 1
    with pytest.raises(InvalidBoard, match="legal moves"):
        Board.from_rows(rows).validate_history()


def test_external_board_rejects_play_after_win():
    rows = Board().to_rows()
    rows[5] = [1, 1, 1, 1, 2, 2, 2]
    rows[4] = [1, 1, 1, 1, 2, 2, 2]
    rows[3][6] = 2
    with pytest.raises(InvalidBoard, match="legal moves"):
        Board.from_rows(rows).validate_history()


def test_rejects_floating_chip():
    rows = Board().to_rows()
    rows[4][0] = 1
    with pytest.raises(InvalidBoard, match="float"):
        Board.from_rows(rows)


def test_rejects_wrong_turn_counts():
    rows = Board().to_rows()
    rows[5] = [1, 1, 0, 0, 0, 0, 0]
    with pytest.raises(InvalidBoard, match="alternate"):
        Board.from_rows(rows).get_status()

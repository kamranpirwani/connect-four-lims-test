from fastapi.testclient import TestClient

from .main import app

client = TestClient(app)

ROWS, COLS = (6, 7)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def empty_board():
    return [[0 for i in range(COLS)] for j in range(ROWS)]


def test_blue_goes_first():
    response = client.post("/evaluate_board_state", json={"board": empty_board()})

    assert response.status_code == 200
    assert response.json()["board"]["next_player"] == 1


def test_red_goes_next():
    board = empty_board()
    board[ROWS - 1][COLS - 1] = 1
    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200
    assert response.json()["board"]["next_player"] == 2


def test_blue_goes_after_red():
    board = empty_board()
    board[ROWS - 1][COLS - 1] = 1
    board[ROWS - 1][COLS - 2] = 2
    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200
    assert response.json()["board"]["next_player"] == 1


# check this later
def test_rejects_floating_chips():
    board = empty_board()
    board[ROWS - 2][COLS - 2] = 1
    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 422


def test_blue_wins_horizontally():
    board = empty_board()
    board[5] = [1, 1, 1, 1, 2, 2, 2]
    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200, response.json
    assert response.json()["board"]["winner"] == 1


def test_blue_wins_vertically():
    board = empty_board()

    for row in range(2, 6):
        board[row][0] = 1

    for row in range(3, 6):
        board[row][1] = 2

    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200, response.json
    assert response.json()["board"]["winner"] == 1


def test_red_wins_vertically():
    board = empty_board()

    for row in range(2, 6):
        board[row][0] = 2

    for row in range(3, 6):
        board[row][1] = 1

    board[5][2] = 1

    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200, response.json
    assert response.json()["board"]["winner"] == 2


def test_blue_wins_diagonal_upright():
    board = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 2, 2, 0, 0],
        [1, 1, 2, 2, 1, 0, 0],
        [1, 2, 2, 2, 1, 1, 0],
    ]
    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200, response.json
    assert response.json()["board"]["winner"] == 1


def test_blue_wins_diagonal_downright():
    board = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 2, 1, 0, 0],
        [0, 0, 1, 2, 2, 1, 0],
        [0, 1, 1, 2, 2, 2, 1],
    ]
    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200, response.json
    assert response.json()["board"]["winner"] == 1


def test_must_have_four_to_win():
    board = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 2, 1, 0, 0],
        [0, 0, 1, 2, 2, 1, 2],
        [0, 1, 1, 2, 2, 2, 1],
    ]
    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200, response.json
    assert response.json()["board"]["winner"] is None


def test_only_one_can_win():
    board = empty_board()
    board[5] = [1, 1, 1, 1, 0, 0, 0]
    board[4] = [2, 2, 2, 2, 0, 0, 0]

    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 422, response.text


def test_board_is_a_draw():
    board = empty_board()
    board = [
        [1, 1, 2, 2, 1, 1, 2],
        [2, 2, 1, 1, 2, 2, 1],
        [1, 1, 2, 2, 1, 1, 2],
        [2, 2, 1, 1, 2, 2, 1],
        [1, 1, 2, 2, 1, 1, 2],
        [2, 2, 1, 1, 2, 2, 1],
    ]

    response = client.post("/evaluate_board_state", json={"board": board})

    assert response.status_code == 200, response.json
    assert response.json()["board"]["winner"] is None
    assert response.json()["board"]["state"] == "draw"

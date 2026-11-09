from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from backend.main import create_app
from backend.models.game import Board
from backend.records import MoveRecord
from backend.repository import Repository


def submit(client, game, selected_column, **overrides):
    body = {"column": selected_column, "expected_version": game["version"], **overrides}
    return client.post(f"/api/games/{game['id']}/moves", json=body)


def test_profile_create_resume_and_lookup(client, user):
    UUID(user["id"])
    resumed = client.post("/api/users", json={"name": "  ADA  "})
    assert resumed.status_code == 200
    assert resumed.json() == user
    assert client.get(f"/api/users/{user['id']}").json() == user


@pytest.mark.parametrize("name", ["", "   ", "a" * 81, 42, None, True])
def test_invalid_names(client, name):
    assert client.post("/api/users", json={"name": name}).status_code == 422


def test_create_game_returns_location_and_initial_state(client, user, game):
    UUID(game["id"])
    assert game["user_id"] == user["id"]
    assert game["board"] == Board().to_rows()
    assert game["state"] == "not_started"
    assert game["next_player"] == 1
    assert game["winner"] is None
    assert game["version"] == 0
    assert game["moves"] == []
    assert game["created_at"].endswith("Z")


def test_server_chooses_landing_row_and_persists_history(client, game):
    first = submit(client, game, 3, player=1)
    assert first.status_code == 201
    current = first.json()
    assert current["board"][5][3] == 1
    assert current["next_player"] == 2
    assert current["state"] == "in_progress"
    assert current["version"] == 1
    assert current["moves"][0]["row"] == 5
    second = submit(client, current, 3).json()
    assert second["board"][4][3] == 2
    assert second["moves"][1]["number"] == 2
    assert second["moves"][1]["row"] == 4
    assert client.get(f"/api/games/{game['id']}").json() == second


@pytest.mark.parametrize(
    "fields",
    [
        {"column": -1},
        {"column": 7},
        {"column": True},
        {"column": "1"},
        {"column": 1.0},
        {"player": 0},
        {"player": True},
        {"player": "1"},
        {"expected_version": -1},
        {"expected_version": True},
        {"expected_version": "0"},
        {"board": [[1]]},
        {"row": 0},
        {"unexpected": "field"},
    ],
)
def test_invalid_move_input_cannot_change_game(client, game, fields):
    response = submit(client, game, 0, **fields)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "invalid_request"
    assert client.get(f"/api/games/{game['id']}").json() == game


def test_missing_version_rejected(client, game):
    assert client.post(f"/api/games/{game['id']}/moves", json={"column": 0}).status_code == 422


def test_wrong_turn_and_stale_version_are_conflicts(client, game):
    assert submit(client, game, 0, player=2).status_code == 409
    accepted = submit(client, game, 0).json()
    assert submit(client, game, 1).status_code == 409
    assert client.get(f"/api/games/{game['id']}").json() == accepted


def test_full_column_rejected_without_a_new_move(client, game):
    current = game
    for _ in range(6):
        current = submit(client, current, 0).json()
    assert submit(client, current, 0).status_code == 409
    assert client.get(f"/api/games/{game['id']}").json() == current


def test_win_is_saved_and_terminal_game_rejects_moves(client, game):
    current = game
    for column in [0, 6, 1, 6, 2, 5, 3]:
        response = submit(client, current, column)
        assert response.status_code == 201
        current = response.json()
    assert current["state"] == "complete"
    assert current["winner"] == 1
    assert current["next_player"] is None
    assert current["winning_cells"] == [{"row": 5, "column": c} for c in range(4)]
    assert submit(client, current, 4).status_code == 409
    assert client.get(f"/api/games/{game['id']}").json() == current


def test_user_lists_are_independent_and_multiple_games_stay_open(client, user, game):
    second = client.post("/api/games", json={"user_id": user["id"]}).json()
    other_user = client.post("/api/users", json={"name": "Grace"}).json()
    other_game = client.post("/api/games", json={"user_id": other_user["id"]}).json()
    submit(client, game, 0)
    own = client.get(f"/api/users/{user['id']}/games").json()
    assert {item["id"] for item in own} == {game["id"], second["id"]}
    assert client.get(f"/api/users/{other_user['id']}/games").json()[0]["id"] == other_game["id"]
    assert client.get(f"/api/games/{second['id']}").json()["version"] == 0


def test_delete_cascades_moves_but_keeps_profile_and_other_games(client, user, game):
    submit(client, game, 0)
    other = client.post("/api/games", json={"user_id": user["id"]}).json()
    response = client.delete(f"/api/games/{game['id']}")
    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/api/games/{game['id']}").status_code == 404
    assert client.delete(f"/api/games/{game['id']}").status_code == 404
    assert client.get(f"/api/users/{user['id']}").status_code == 200
    assert [g["id"] for g in client.get(f"/api/users/{user['id']}/games").json()] == [other["id"]]
    with client.app.state.database.sessions() as session:
        assert session.scalar(select(func.count()).select_from(MoveRecord)) == 0


@pytest.mark.parametrize(
    "route",
    [
        "/api/users/{id}",
        "/api/users/{id}/games",
        "/api/games/{id}",
    ],
)
def test_unknown_resource(client, route):
    assert client.get(route.format(id=uuid4())).status_code == 404


def test_unknown_game_and_user_in_writes(client):
    missing = str(uuid4())
    assert client.post("/api/games", json={"user_id": missing}).status_code == 404
    assert (
        client.post(
            f"/api/games/{missing}/moves", json={"column": 0, "expected_version": 0}
        ).status_code
        == 404
    )
    assert client.get("/api/games/not-a-uuid").status_code == 422


def test_restart_retains_profile_board_and_moves(tmp_path):
    url = f"sqlite:///{tmp_path / 'persistent.sqlite3'}"
    with TestClient(create_app(url)) as first:
        user = first.post("/api/users", json={"name": "Persistent"}).json()
        game = first.post("/api/games", json={"user_id": user["id"]}).json()
        saved = submit(first, game, 2).json()
    with TestClient(create_app(url)) as restarted:
        assert restarted.get(f"/api/users/{user['id']}").json() == user
        assert restarted.get(f"/api/games/{game['id']}").json() == saved


def test_failed_move_rolls_back_board_and_history(client, game, monkeypatch):
    original = Repository.apply_move

    def fail_after_writing(self, *args, **kwargs):
        assert original(self, *args, **kwargs)
        raise RuntimeError("Simulated failure before commit")

    with monkeypatch.context() as patch:
        patch.setattr(Repository, "apply_move", fail_after_writing)
        failing_client = TestClient(client.app, raise_server_exceptions=False)
        assert submit(failing_client, game, 0).status_code == 500
    assert client.get(f"/api/games/{game['id']}").json() == game


def test_simultaneous_moves_accept_exactly_one(client, game, monkeypatch):
    barrier = Barrier(2)
    original = Repository.find_game

    def synchronized_read(self, game_id):
        value = original(self, game_id)
        barrier.wait(timeout=5)
        return value

    with monkeypatch.context() as patch:
        patch.setattr(Repository, "find_game", synchronized_read)
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda column: submit(client, game, column), [0, 1]))
    assert sorted(response.status_code for response in responses) == [201, 409]
    saved = client.get(f"/api/games/{game['id']}").json()
    assert saved["version"] == 1
    assert len(saved["moves"]) == 1


@pytest.mark.parametrize(
    "board",
    [
        [],
        [[0] * 7] * 5,
        [[0] * 8] * 6,
        [[True] * 7] * 6,
        [[3] * 7] * 6,
        [["0"] * 7] * 6,
    ],
)
def test_legacy_endpoint_validates_board_shape_and_cells(client, board):
    assert client.post("/evaluate_board_state", json={"board": board}).status_code == 422


def test_legacy_evaluation_does_not_modify_saved_games(client, game):
    assert (
        client.post("/evaluate_board_state", json={"board": Board().to_rows()}).status_code == 200
    )
    assert client.get(f"/api/games/{game['id']}").json() == game

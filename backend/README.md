# Connect Four backend

## Environment and startup

Python **3.15.2** is the current stable version targeted by this project.
`.python-version`, `.tool-versions`, and `pyproject.toml` agree on the
3.15 series. Dependencies are defined in `pyproject.toml`; `uv.lock` pins
the tested resolution, and `requirements.txt` installs the same project with
its test dependencies.

From this directory, the preferred setup is:

```sh
uv sync --extra test
uv run uvicorn main:app --port 8080
```

The environment lives in this directory's `.venv`. uv selects/downloads
Python 3.15.2 and replaces an incompatible project environment. This avoids
depending on whichever Python a global pyenv/asdf shim happens to select.

If Python 3.15 is already installed and you prefer standard Python tooling:

```sh
python3.15 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --port 8080
```

On Windows, use `.venv\\Scripts\\python.exe` instead of `.venv/bin/python`.
If an existing environment uses an older Python, recreate that project
environment with 3.15 before installing dependencies.

The exercise's `uvicorn main:app --port 8080` command also works after
installation and environment activation. `main.py` is a small entry point
for the package under `src/backend/`.

## Tests

```sh
uv run --extra test pytest
uv run --extra test ruff check .
uv run --extra test ruff format --check .
```

With the standard environment installed above:

```sh
.venv/bin/python -m pytest
```

To run one area:

```sh
uv run --extra test pytest tests/test_game.py
uv run --extra test pytest tests/test_api.py
uv run --extra test pytest src/backend/test_main.py
```

Tests cover both players' wins in all directions, gravity, draws, terminal
states, strict request validation, profile/game isolation, ordered history,
deletion cascades, restart persistence, rollback, and simultaneous moves.
The original board-evaluation tests are retained. Each API test gets a temporary
SQLite file; production data is not touched.

## Persistence

The default file is `backend/data/connect-four.sqlite3`, resolved relative
to the package rather than the process working directory. Parent directories
and the initial schema are created at startup. The only tables are:

- `users`: UUID, display name, normalized unique name, creation time.
- `games`: UUID, owning user, current board, version, timestamps.
- `moves`: game, sequence number, actual row/column, player, timestamp.

Result/turn information is derived by the domain model from the saved board,
rather than duplicated in independently mutable columns. Move numbers are
unique per game. SQLite foreign keys and deletion cascades are enabled on
every connection.

Set `DATABASE_URL=sqlite:////absolute/path/to/games.sqlite3` to use another
file. SQLite is deliberately the only supported database for this exercise.
Schema creation handles a fresh database; changes to existing schemas will need
migrations before the data model is extended.

## Requests

Create or resume a profile:

```http
POST /api/users
Content-Type: application/json

{"name": "Ada"}
```

Returns `201` for a new profile or `200` for the existing case-insensitive
name. Both responses contain `id`, `name`, and `created_at`.

Create a game:

```http
POST /api/games
Content-Type: application/json

{"user_id": "<UUID returned above>"}
```

Returns `201`, a `Location` header, and the complete initial game.

Submit a move:

```http
POST /api/games/<game_id>/moves
Content-Type: application/json

{"column": 3, "player": 1, "expected_version": 0}
```

Columns are zero-based, from 0 through 6. The server computes the landing row,
where row 0 is the top and row 5 the bottom. `player` is optional: when
provided it must match the current turn. It identifies a color, not a user.
`expected_version` is required and must match the saved version.

The body accepts no board or row override. Coordinates and versions must be
actual JSON integers; booleans and numeric strings are rejected.

A successful move returns `201` with the updated game:

- `id`, `user_id`, `created_at`, and `updated_at`.
- `board`: 6 by 7 integers; 0 empty, 1 blue, 2 red.
- `state`: `not_started`, `in_progress`, `complete` (won), or `draw`.
- `next_player`: 1 or 2 during play; null after a win/draw.
- `winner`: 1 or 2 for a win; otherwise null.
- `winning_cells`: every cell in the winning runs, including runs longer
  than four and simultaneous winning lines.
- `version`: incremented for every accepted move.
- `moves`: ordered records with `number`, `row`, `column`, `player`,
  and `created_at`.

Read the same representation with `GET /api/games/{game_id}`.
`GET /api/users/{user_id}/games` returns summaries without move history.
`DELETE /api/games/{game_id}` returns `204` and deletes its moves in the
same transaction. A missing resource returns `404`.

## Errors and concurrency

Errors use `{"error": {"code": "...", "message": "..."}}`; request validation
also includes field details.

- `422 invalid_request`: wrong shape, type, bounds, UUID, or extra fields.
- `422 invalid_board`: an impossible external compatibility board.
- `404 not_found`: unknown user or game.
- `409 conflict`: wrong turn, full column, completed game, stale version,
  or a competing SQLite write. Fetch current state before trying again.

A move loads the saved board, applies domain rules, then conditionally updates
the game using both ID and version. The update, move insert, and commit form one
transaction. A failed write rolls back both the board and history. Two moves
using the same version cannot both commit.

A lost response is ambiguous: it may have committed. Clients must fetch current
state instead of automatically retrying the POST.

## Separation of concerns

- `models/game.py`: immutable Board, Move, Player, game states and rules;
  no database or web framework imports.
- `schemas.py`: strict request parsing and typed response contracts.
- `main.py`: routes, dependencies, response codes and error translation.
- `services.py`: use cases, domain operations and transaction boundaries.
- `repository.py`: SQLAlchemy queries and conditional writes.
- `records.py` and `database.py`: tables, connections and initial schema.

The compatibility evaluator additionally checks whether an external board can
be reached through alternating legal moves ending at the first win. This
validation never changes saved games.

Profiles intentionally have no authentication. Names and UUIDs provide demo
identity and organization, not permission checks.

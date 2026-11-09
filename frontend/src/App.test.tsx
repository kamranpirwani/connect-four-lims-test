import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";
import { api } from "./api";
import type { Game, User } from "./api";
import { createQueryClient, queryKeys } from "./queryClient";

const user: User = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Ada",
  created_at: "2026-11-09T12:00:00Z",
};
const blank: Game = {
  id: "22222222-2222-4222-8222-222222222222",
  user_id: user.id,
  board: Array.from({ length: 6 }, () => Array<0>(7).fill(0)),
  state: "not_started",
  next_player: 1,
  winner: null,
  winning_cells: [],
  version: 0,
  created_at: "2026-11-09T12:00:00Z",
  updated_at: "2026-11-09T12:00:00Z",
  moves: [],
};
function afterMove(column = 2, initial = blank): Game {
  const board = initial.board.map((row) => [...row]);
  board[5][column] = 1;
  return {
    ...initial,
    board,
    state: "in_progress",
    next_player: 2,
    version: 1,
    moves: [
      { number: 1, row: 5, column, player: 1, created_at: blank.created_at },
    ],
  };
}
function json(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let serverGame: Game;
let serverGames: Game[];
let moveHandler: (() => Promise<Response>) | null;
let failRecovery = false;
let fetchedDetail = false;
let createdGames = 0;
let loseCreateResponse = false;
let client = createQueryClient();
const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  serverGame = structuredClone(blank);
  serverGames = [serverGame];
  moveHandler = null;
  failRecovery = false;
  fetchedDetail = false;
  createdGames = 0;
  loseCreateResponse = false;
  client = createQueryClient();
  client.setDefaultOptions({
    ...client.getDefaultOptions(),
    queries: { ...client.getDefaultOptions().queries, retry: false, gcTime: 0 },
  });
  fetchMock.mockReset();
  fetchMock.mockImplementation(
    async (path: string, options: RequestInit = {}) => {
      const method = options.method ?? "GET";
      if (path === "/api/users" && method === "POST") return json(user, 201);
      if (path === "/api/users/" + user.id) return json(user);
      if (path === "/api/users/" + user.id + "/games") return json(serverGames);
      if (path === "/api/games" && method === "POST") {
        serverGame = {
          ...structuredClone(blank),
          id:
            createdGames++ === 0
              ? "33333333-3333-4333-8333-333333333333"
              : "44444444-4444-4444-8444-444444444444",
          created_at: "2026-11-09T1" + (2 + createdGames) + ":00:00Z",
        };
        serverGames = [serverGame, ...serverGames];
        if (loseCreateResponse) {
          loseCreateResponse = false;
          throw new TypeError("Lost create response");
        }
        return json(serverGame, 201);
      }
      if (path.endsWith("/moves") && method === "POST" && moveHandler)
        return moveHandler();
      if (path.startsWith("/api/games/") && method === "DELETE") {
        serverGames = [];
        return json(undefined, 204);
      }
      if (path.startsWith("/api/games/") && method === "GET") {
        if (fetchedDetail && failRecovery)
          throw new TypeError("Network unavailable");
        fetchedDetail = true;
        const saved = serverGames.find(
          (game) => path === "/api/games/" + game.id,
        );
        return saved
          ? json(saved)
          : json({ error: { message: "Game not found." } }, 404);
      }
      throw new Error("Unexpected request: " + method + " " + path);
    },
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mount(strict = false) {
  return render(
    <QueryClientProvider client={client}>
      {strict ? (
        <StrictMode>
          <App />
        </StrictMode>
      ) : (
        <App />
      )}
    </QueryClientProvider>,
  );
}
function saveSession() {
  localStorage.setItem("connect-four:user-id", user.id);
  localStorage.setItem("connect-four:last-game:" + user.id, blank.id);
}
async function restored() {
  saveSession();
  mount();
  await screen.findByRole("heading", { name: "Ready to play" });
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Drop chip in column 3" }),
    ).toBeEnabled(),
  );
}
function moveCalls() {
  return fetchMock.mock.calls.filter(
    ([url, options]) =>
      String(url).endsWith("/moves") && options?.method === "POST",
  );
}

test("name entry opens a profile and persists its identifier", async () => {
  mount();
  expect(
    screen.getByRole("heading", { name: "Connect Four" }),
  ).toBeInTheDocument();
  fireEvent.change(await screen.findByLabelText("Your name"), {
    target: { value: "Ada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
  await screen.findByRole("heading", { name: "Your games" });
  expect(localStorage.getItem("connect-four:user-id")).toBe(user.id);
  expect(
    screen.getByRole("button", { name: "Open profile for Ada" }),
  ).toHaveTextContent("Ada");
});

test("refresh restores the server board, profile, and game history", async () => {
  serverGame = afterMove();
  serverGames = [serverGame];
  saveSession();
  mount();
  await screen.findByRole("heading", { name: "Red to play" });
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: Blue" }),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("list", { name: "Move history" })).getByRole(
      "button",
      {
        name: "Move 1, Blue, column 3, row 6",
      },
    ),
  ).toBeInTheDocument();
});

test("a pending move leaves the board unchanged, then displays the server landing row", async () => {
  let resolve!: (response: Response) => void;
  moveHandler = () =>
    new Promise<Response>((done) => {
      resolve = done;
    });
  await restored();
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await waitFor(() => expect(moveCalls()).toHaveLength(1));
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: empty" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  ).toBeDisabled();
  expect(JSON.parse(moveCalls()[0][1].body)).toEqual({
    column: 2,
    player: 1,
    expected_version: 0,
  });
  serverGame = afterMove();
  serverGames = [serverGame];
  resolve(json(serverGame, 201));
  await screen.findByRole("heading", { name: "Red to play" });
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: Blue" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: "Row 1, column 3: empty" }),
  ).toBeInTheDocument();
});

test("a read started during a move cannot overwrite the accepted board", async () => {
  let resolveMove!: (response: Response) => void;
  let resolveRead!: (game: Game) => void;
  moveHandler = () =>
    new Promise<Response>((resolve) => {
      resolveMove = resolve;
    });
  await restored();
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await waitFor(() => expect(moveCalls()).toHaveLength(1));
  vi.spyOn(api, "game").mockImplementationOnce(
    () =>
      new Promise<Game>((resolve) => {
        resolveRead = resolve;
      }),
  );
  let pendingRead!: Promise<Game | undefined>;
  act(() => {
    pendingRead = client
      .fetchQuery({
        queryKey: queryKeys.game(blank.id),
        queryFn: ({ signal }) => api.game(blank.id, signal),
        staleTime: 0,
      })
      .catch(() => undefined);
  });
  serverGame = afterMove();
  serverGames = [serverGame];
  resolveMove(json(serverGame, 201));
  await screen.findByRole("heading", { name: "Red to play" });
  await act(async () => {
    resolveRead(structuredClone(blank));
    await pendingRead;
  });
  expect(client.getQueryData<Game>(queryKeys.game(blank.id))?.version).toBe(1);
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: Blue" }),
  ).toBeInTheDocument();
});

test("a conflict fetches authoritative state without replaying the move", async () => {
  await restored();
  moveHandler = async () => {
    serverGame = afterMove(4);
    serverGames = [serverGame];
    return json(
      { error: { code: "conflict", message: "The game has changed." } },
      409,
    );
  };
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await screen.findByRole("alert");
  expect(
    await screen.findByRole("heading", { name: "Red to play" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: "Row 6, column 5: Blue" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: empty" }),
  ).toBeInTheDocument();
  expect(moveCalls()).toHaveLength(1);
});

test("a saved move with a lost response is recovered with a GET", async () => {
  await restored();
  moveHandler = async () => {
    serverGame = afterMove();
    serverGames = [serverGame];
    throw new TypeError("Lost response");
  };
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await screen.findByRole("alert");
  await screen.findByRole("heading", { name: "Red to play" });
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: Blue" }),
  ).toBeInTheDocument();
  expect(moveCalls()).toHaveLength(1);
});

test("unavailable recovery disables play until a successful refresh", async () => {
  await restored();
  failRecovery = true;
  moveHandler = async () => {
    throw new TypeError("Network unavailable");
  };
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await screen.findByText("Refresh the game before making another move.");
  expect(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  ).toBeDisabled();
  expect(moveCalls()).toHaveLength(1);
  failRecovery = false;
  fireEvent.click(screen.getByRole("button", { name: "Refresh games" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Drop chip in column 3" }),
    ).toBeEnabled(),
  );
});

test("completed games are view only and offer a new game", async () => {
  const board = blank.board.map((row) => [...row]);
  board[5] = [1, 1, 1, 1, 0, 2, 2];
  board[4][6] = 2;
  serverGame = {
    ...blank,
    board,
    state: "complete",
    winner: 1,
    next_player: null,
    version: 7,
    winning_cells: [0, 1, 2, 3].map((column) => ({ row: 5, column })),
  };
  serverGames = [serverGame];
  saveSession();
  mount();
  await screen.findByRole("heading", { name: "Blue won" });
  for (const button of screen.getAllByRole("button", { name: /Drop chip/ }))
    expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Play a new game" }));
  await screen.findByRole("heading", { name: "Ready to play" });
  expect(localStorage.getItem("connect-four:last-game:" + user.id)).toBe(
    "33333333-3333-4333-8333-333333333333",
  );
});

test("deletion removes the selected game and its cached history", async () => {
  await restored();
  fireEvent.click(screen.getByRole("button", { name: /Delete game / }));
  expect(screen.getByText("Delete this game?")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  await within(
    screen.getByRole("complementary", { name: "Saved games" }),
  ).findByText("Your game history is clear.");
  expect(
    screen.queryByRole("list", { name: "Move history" }),
  ).not.toBeInTheDocument();
  expect(localStorage.getItem("connect-four:last-game:" + user.id)).toBeNull();
  expect(client.getQueryData(queryKeys.game(blank.id))).toBeUndefined();
  expect(
    screen.getByRole("button", { name: "Open profile for Ada" }),
  ).toHaveTextContent("Ada");
});

test("switching profiles clears server caches and the saved active profile", async () => {
  await restored();
  fireEvent.click(screen.getByRole("button", { name: "Switch profile" }));
  await screen.findByLabelText("Your name");
  expect(client.getQueryData(queryKeys.game(blank.id))).toBeUndefined();
  expect(client.getQueryData(queryKeys.user(user.id))).toBeUndefined();
  expect(localStorage.getItem("connect-four:user-id")).toBeNull();
});

function createCalls() {
  return fetchMock.mock.calls.filter(
    ([url, options]) => url === "/api/games" && options?.method === "POST",
  );
}

test("a new profile goes directly into its first game", async () => {
  serverGames = [];
  mount();
  fireEvent.change(await screen.findByLabelText("Your name"), {
    target: { value: "Ada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
  await screen.findByRole("heading", { name: "Ready to play" });
  expect(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  ).toBeEnabled();
  expect(createCalls()).toHaveLength(1);
  expect(
    screen.queryByText("Your next game starts here"),
  ).not.toBeInTheDocument();
  expect(localStorage.getItem("connect-four:last-game:" + user.id)).toBe(
    serverGame.id,
  );
});

test("Strict Mode creates only one initial game", async () => {
  serverGames = [];
  localStorage.setItem("connect-four:user-id", user.id);
  mount(true);
  await screen.findByRole("heading", { name: "Ready to play" });
  expect(createCalls()).toHaveLength(1);
  expect(serverGames).toHaveLength(1);
});

test("an initial create with a lost response opens the saved game without retrying", async () => {
  serverGames = [];
  loseCreateResponse = true;
  localStorage.setItem("connect-four:user-id", user.id);
  mount();
  await screen.findByRole("heading", { name: "Ready to play" });
  expect(createCalls()).toHaveLength(1);
  expect(serverGames).toHaveLength(1);
  expect(localStorage.getItem("connect-four:last-game:" + user.id)).toBe(
    serverGame.id,
  );
});

test("returning without a saved selection opens the last completed game", async () => {
  serverGame = { ...blank, state: "draw", next_player: null, version: 42 };
  serverGames = [serverGame];
  localStorage.setItem("connect-four:user-id", user.id);
  mount();
  await screen.findByRole("heading", { name: "Draw" });
  expect(
    screen.getByRole("button", { name: "Play a new game" }),
  ).toBeInTheDocument();
  expect(createCalls()).toHaveLength(0);
  expect(
    screen.queryByRole("complementary", { name: "Quick guide" }),
  ).not.toBeInTheDocument();
});

test("the sidebar stays enabled and in place while a move is saved", async () => {
  const other = {
    ...structuredClone(blank),
    id: "44444444-4444-4444-8444-444444444444",
    created_at: "2026-11-08T12:00:00Z",
  };
  serverGames.push(other);
  let resolve!: (response: Response) => void;
  moveHandler = () =>
    new Promise<Response>((done) => {
      resolve = done;
    });
  await restored();
  const list = screen.getByRole("list", { name: "Your games" });
  const rows = within(list).getAllByRole("listitem");
  const listReads = fetchMock.mock.calls.filter(([url]) =>
    String(url).endsWith("/games"),
  ).length;
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await waitFor(() => expect(moveCalls()).toHaveLength(1));
  expect(screen.getByRole("button", { name: "+ New game" })).toBeEnabled();
  expect(within(rows[1]).getByRole("button", { pressed: false })).toBeEnabled();
  expect(within(list).getAllByRole("listitem")[1]).toBe(rows[1]);
  serverGame = afterMove();
  serverGames = [serverGame, other];
  resolve(json(serverGame, 201));
  await screen.findByRole("heading", { name: "Red to play" });
  expect(within(list).getAllByRole("listitem")).toEqual(rows);
  expect(
    fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/games")),
  ).toHaveLength(listReads);
  expect(screen.getByRole("button", { name: "+ New game" })).toBeEnabled();
});

test("opening another game during a move keeps that game selected", async () => {
  const other = {
    ...structuredClone(blank),
    id: "44444444-4444-4444-8444-444444444444",
    created_at: "2026-11-08T12:00:00Z",
  };
  serverGames.push(other);
  let resolve!: (response: Response) => void;
  moveHandler = () =>
    new Promise<Response>((done) => {
      resolve = done;
    });
  await restored();
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await waitFor(() => expect(moveCalls()).toHaveLength(1));
  const otherRow = within(
    screen.getByRole("list", { name: "Your games" }),
  ).getAllByRole("listitem")[1];
  fireEvent.click(within(otherRow).getByRole("button", { pressed: false }));
  await waitFor(() =>
    expect(client.getQueryData(queryKeys.game(other.id))).toBeDefined(),
  );
  serverGame = afterMove();
  serverGames = [serverGame, other];
  resolve(json(serverGame, 201));
  await waitFor(() =>
    expect(client.getQueryData<Game>(queryKeys.game(blank.id))?.version).toBe(
      1,
    ),
  );
  expect(localStorage.getItem("connect-four:last-game:" + user.id)).toBe(
    other.id,
  );
  expect(
    screen.getByRole("heading", { name: "Ready to play" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: empty" }),
  ).toBeInTheDocument();
});

test("first-play tips follow accepted moves, survive refresh, and stay dismissed", async () => {
  serverGames = [];
  localStorage.setItem("connect-four:user-id", user.id);
  const firstMount = mount();
  await screen.findByRole("heading", { name: "Ready to play" });
  expect(screen.getByText("Start with Blue")).toBeInTheDocument();
  moveHandler = async () => {
    serverGame = afterMove(2, serverGame);
    serverGames = [serverGame];
    return json(serverGame, 201);
  };
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await screen.findByText("Now it’s Red’s turn");
  firstMount.unmount();
  client.clear();
  mount();
  await screen.findByText("Now it’s Red’s turn");
  moveHandler = async () => {
    const board = serverGame.board.map((row) => [...row]);
    board[4][2] = 2;
    serverGame = {
      ...serverGame,
      board,
      version: 2,
      next_player: 1,
      moves: [
        ...serverGame.moves,
        {
          number: 2,
          row: 4,
          column: 2,
          player: 2,
          created_at: blank.created_at,
        },
      ],
    };
    serverGames = [serverGame];
    return json(serverGame, 201);
  };
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await screen.findByText("Four in a row wins");
  fireEvent.click(screen.getByRole("button", { name: "Got it" }));
  expect(
    screen.queryByRole("complementary", { name: "Quick guide" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "+ New game" }));
  await screen.findByRole("heading", { name: "Ready to play" });
  expect(
    screen.queryByRole("complementary", { name: "Quick guide" }),
  ).not.toBeInTheDocument();
});

test("a rejected move does not advance the tutorial", async () => {
  serverGames = [];
  localStorage.setItem("connect-four:user-id", user.id);
  mount();
  await screen.findByText("Start with Blue");
  moveHandler = async () => json({ error: { message: "Move rejected." } }, 409);
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 3" }),
  );
  await screen.findByRole("alert");
  expect(screen.getByText("Start with Blue")).toBeInTheDocument();
  expect(screen.queryByText("Now it’s Red’s turn")).not.toBeInTheDocument();
});

test("move history has a clear order and highlights the selected chip", async () => {
  const first = afterMove();
  const board = first.board.map((row) => [...row]);
  board[4][2] = 2;
  serverGame = {
    ...first,
    board,
    version: 2,
    next_player: 1,
    moves: [
      ...first.moves,
      { number: 2, row: 4, column: 2, player: 2, created_at: blank.created_at },
    ],
  };
  serverGames = [serverGame];
  saveSession();
  mount();
  await screen.findByRole("heading", { name: "Blue to play" });
  const entries = within(
    screen.getByRole("list", { name: "Move history" }),
  ).getAllByRole("button");
  expect(entries[0]).toHaveAccessibleName("Move 2, Red, column 3, row 5");
  expect(entries[1]).toHaveAccessibleName("Move 1, Blue, column 3, row 6");
  fireEvent.click(entries[1]);
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: Blue" }),
  ).toHaveAttribute("data-highlighted", "true");
  expect(entries[1]).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Clear highlight" }));
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: Blue" }),
  ).not.toHaveAttribute("data-highlighted");
});

test("desktop navigation opens the shared profile and lobby, then resumes the same board", async () => {
  await restored();
  const board = screen.getByRole("group", { name: "Connect Four board" });
  const navigation = screen.getByRole("navigation", {
    name: "Main navigation",
  });
  fireEvent.click(within(navigation).getByRole("button", { name: "Profile" }));
  expect(screen.getByRole("region", { name: "Profile screen" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument();
  expect(
    screen.queryByRole("group", { name: "Connect Four board" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: "Switch profile" }),
  ).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "View your games" }));
  expect(screen.getByRole("region", { name: "Games screen" })).toBeVisible();
  const list = screen.getByRole("list", { name: "Your games" });
  fireEvent.click(within(list).getByRole("button", { pressed: true }));
  await screen.findByRole("heading", { name: "Ready to play" });
  expect(
    within(navigation).getByRole("button", { name: "Play" }),
  ).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("group", { name: "Connect Four board" })).toBe(board);
  expect(createCalls()).toHaveLength(0);
  expect(moveCalls()).toHaveLength(0);
});

test("the desktop name and avatar open current profile activity", async () => {
  serverGame = afterMove();
  serverGames = [serverGame];
  saveSession();
  mount();
  await screen.findByRole("heading", { name: "Red to play" });
  fireEvent.click(screen.getByRole("button", { name: "Open profile for Ada" }));
  const profile = screen.getByRole("region", { name: "Profile screen" });
  expect(
    within(profile).getByText("Total moves").nextElementSibling,
  ).toHaveTextContent("1");
  expect(
    within(profile).getByText("Games played").nextElementSibling,
  ).toHaveTextContent("1");
  fireEvent.click(
    within(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).getByRole("button", { name: "Play" }),
  );
  expect(
    screen.getByRole("img", { name: "Row 6, column 3: Blue" }),
  ).toBeInTheDocument();
  expect(localStorage.getItem("connect-four:last-game:" + user.id)).toBe(
    blank.id,
  );
});

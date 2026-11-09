import { QueryClientProvider } from "@tanstack/react-query";
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
import type { Game, GameSummary, User } from "./schemas";
import { createQueryClient } from "./queryClient";
import { mobileQuery } from "./styles/theme";

const user: User = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Ada",
  created_at: "2026-11-09T12:00:00Z",
};
const id = (number: number) =>
  "22222222-2222-4222-8222-" + number.toString().padStart(12, "0");

function fixtureGame(
  number: number,
  columns: number[],
  winner: 1 | 2 | null = null,
): Game {
  const board: Game["board"] = Array.from({ length: 6 }, () =>
    Array<0>(7).fill(0),
  );
  const heights = Array<number>(7).fill(0);
  const moves = columns.map((column, index) => {
    const row = 5 - heights[column]++;
    const player = index % 2 === 0 ? 1 : 2;
    board[row][column] = player;
    return {
      number: index + 1,
      row,
      column,
      player: player as 1 | 2,
      created_at: user.created_at,
    };
  });
  return {
    id: id(number),
    user_id: user.id,
    board,
    moves,
    version: moves.length,
    state: winner ? "complete" : moves.length ? "in_progress" : "not_started",
    next_player: winner ? null : moves.length % 2 ? 2 : 1,
    winner,
    winning_cells: winner
      ? [0, 1, 2, 3].map((column) => ({ row: 5, column }))
      : [],
    created_at: user.created_at,
    updated_at: user.created_at,
  };
}

let games: GameSummary[];
let details: Map<string, Game>;
let client = createQueryClient();
let setMobile: (mobile: boolean) => void;
const dialogPrototype = HTMLDialogElement.prototype;
const oldShowModal = Object.getOwnPropertyDescriptor(
  dialogPrototype,
  "showModal",
);
const oldClose = Object.getOwnPropertyDescriptor(dialogPrototype, "close");

beforeEach(() => {
  localStorage.clear();
  let mobile = true;
  const listeners = new Set<() => void>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === mobileQuery && mobile,
    media: query,
    onchange: null,
    addEventListener: (_event: string, listener: () => void) => {
      if (query === mobileQuery) listeners.add(listener);
    },
    removeEventListener: (_event: string, listener: () => void) =>
      listeners.delete(listener),
  }));
  setMobile = (value) => {
    mobile = value;
    act(() => {
      listeners.forEach((listener) => listener());
    });
  };
  vi.stubGlobal("scrollTo", vi.fn());
  Object.defineProperties(dialogPrototype, {
    showModal: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
      },
    },
    close: {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.removeAttribute("open");
      },
    },
  });

  const current = fixtureGame(1, [3, 3]);
  const blue = fixtureGame(2, [0, 6, 1, 6, 2, 5, 3], 1);
  const red = fixtureGame(3, [6, 0, 6, 1, 5, 2, 5, 3], 2);
  const ready = fixtureGame(4, []);
  const draw: GameSummary = {
    ...fixtureGame(5, []),
    state: "draw",
    version: 42,
    next_player: null,
  };
  games = [current, blue, red, ready, draw];
  details = new Map([current, blue, red, ready].map((game) => [game.id, game]));
  localStorage.setItem("connect-four:user-id", user.id);
  localStorage.setItem("connect-four:last-game:" + user.id, current.id);
  client = createQueryClient();
  client.setDefaultOptions({
    ...client.getDefaultOptions(),
    queries: { ...client.getDefaultOptions().queries, retry: false, gcTime: 0 },
  });
  vi.spyOn(api, "user").mockResolvedValue(user);
  vi.spyOn(api, "signIn").mockResolvedValue(user);
  vi.spyOn(api, "games").mockImplementation(async () => games);
  vi.spyOn(api, "game").mockImplementation(
    async (gameId) => details.get(gameId)!,
  );
  vi.spyOn(api, "createGame").mockImplementation(async () => {
    const created = fixtureGame(6, []);
    games = [created, ...games];
    details.set(created.id, created);
    return created;
  });
  vi.spyOn(api, "deleteGame").mockImplementation(async (gameId) => {
    games = games.filter((game) => game.id !== gameId);
    details.delete(gameId);
  });
  vi.spyOn(api, "move").mockImplementation(async () => {
    const moved = fixtureGame(1, [3, 3, 0]);
    details.set(moved.id, moved);
    games = games.map((game) => (game.id === moved.id ? moved : game));
    return moved;
  });
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (oldShowModal)
    Object.defineProperty(dialogPrototype, "showModal", oldShowModal);
  else delete (dialogPrototype as Partial<HTMLDialogElement>).showModal;
  if (oldClose) Object.defineProperty(dialogPrototype, "close", oldClose);
  else delete (dialogPrototype as Partial<HTMLDialogElement>).close;
});

async function mount() {
  render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
  await screen.findByRole("heading", { name: "Blue to play" });
  return screen.getByRole("navigation", { name: "Main navigation" });
}
function stat(label: string) {
  return within(
    screen.getByRole("region", { name: "Profile screen" }),
  ).getByText(label).nextElementSibling;
}

test("mobile opens on Play with history and the lobby out of the way", async () => {
  const navigation = await mount();
  expect(within(navigation).getAllByRole("button")).toHaveLength(3);
  expect(
    within(navigation).getByRole("button", { name: "Play" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    screen.getByRole("group", { name: "Connect Four board" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("list", { name: "Move history" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("list", { name: "Your games" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Open move history" }),
  ).toHaveTextContent("Moves");
});

test("Games has filters and opening a finished game returns to Play", async () => {
  const navigation = await mount();
  fireEvent.click(within(navigation).getByRole("button", { name: "Games" }));
  expect(
    screen.queryByRole("group", { name: "Connect Four board" }),
  ).not.toBeInTheDocument();
  expect(
    within(screen.getByRole("list", { name: "Your games" })).getAllByRole(
      "listitem",
    ),
  ).toHaveLength(5);
  fireEvent.click(screen.getByRole("button", { name: "Finished (3)" }));
  expect(
    within(screen.getByRole("list", { name: "Your games" })).getAllByRole(
      "listitem",
    ),
  ).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: /Blue won/ }));
  await screen.findByRole("heading", { name: "Blue won" });
  expect(
    within(navigation).getByRole("button", { name: "Play" }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    screen.getByRole("button", { name: "Play a new game" }),
  ).toBeInTheDocument();
  expect(api.createGame).not.toHaveBeenCalled();
});

test("creating from Games selects the new board in Play", async () => {
  const navigation = await mount();
  fireEvent.click(within(navigation).getByRole("button", { name: "Games" }));
  fireEvent.click(screen.getByRole("button", { name: "New game" }));
  await screen.findByRole("heading", { name: "Ready to play" });
  expect(
    within(navigation).getByRole("button", { name: "Play" }),
  ).toHaveAttribute("aria-current", "page");
  expect(localStorage.getItem("connect-four:last-game:" + user.id)).toBe(id(6));
  expect(api.createGame).toHaveBeenCalledTimes(1);
});

test("Profile shows shared-play activity and color results", async () => {
  const navigation = await mount();
  fireEvent.click(within(navigation).getByRole("button", { name: "Profile" }));
  expect(stat("Games played")).toHaveTextContent("4");
  expect(stat("Total moves")).toHaveTextContent("59");
  expect(stat("Saved games")).toHaveTextContent("5");
  expect(stat("Open games")).toHaveTextContent("2");
  expect(stat("Finished games")).toHaveTextContent("3");
  expect(stat("Blue wins")).toHaveTextContent("1");
  expect(stat("Red wins")).toHaveTextContent("1");
  expect(stat("Draws")).toHaveTextContent("1");
  expect(
    screen.getByText("You play both colors. Results are counted by color."),
  ).toBeVisible();
  expect(
    screen.queryByRole("group", { name: "Connect Four board" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Leaderboard")).not.toBeInTheDocument();
});

test("profile activity updates from an accepted move without refetching the lobby", async () => {
  const navigation = await mount();
  fireEvent.click(
    screen.getByRole("button", { name: "Drop chip in column 1" }),
  );
  await screen.findByRole("heading", { name: "Red to play" });
  fireEvent.click(within(navigation).getByRole("button", { name: "Profile" }));
  expect(stat("Total moves")).toHaveTextContent("60");
  expect(api.games).toHaveBeenCalledTimes(1);
  fireEvent.click(within(navigation).getByRole("button", { name: "Play" }));
  expect(
    screen.getByRole("img", { name: "Row 6, column 1: Blue" }),
  ).toBeInTheDocument();
});

test("the avatar opens Profile and switching profiles resets mobile navigation", async () => {
  await mount();
  fireEvent.click(screen.getByRole("button", { name: "Open profile for Ada" }));
  await screen.findByRole("region", { name: "Profile screen" });
  fireEvent.click(screen.getByRole("button", { name: "Switch profile" }));
  await screen.findByLabelText("Your name");
  expect(
    screen.queryByRole("navigation", { name: "Main navigation" }),
  ).not.toBeInTheDocument();
  expect(localStorage.getItem("connect-four:user-id")).toBeNull();
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Ada" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Start playing" }));
  await screen.findByRole("heading", { name: "Blue to play" });
  expect(
    within(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).getByRole("button", { name: "Play" }),
  ).toHaveAttribute("aria-current", "page");
});

test("history opens in a sheet and selecting a move closes it and highlights the board", async () => {
  await mount();
  fireEvent.click(screen.getByRole("button", { name: "Open move history" }));
  const sheet = screen.getByRole("dialog", { name: "Move history" });
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.click(
    within(sheet).getByRole("button", {
      name: "Move 1, Blue, column 4, row 6",
    }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  expect(
    screen.getByRole("img", { name: "Row 6, column 4: Blue" }),
  ).toHaveAttribute("data-highlighted", "true");
  expect(api.move).not.toHaveBeenCalled();
});

test("closing and cancelling the history sheet restore page scrolling", async () => {
  await mount();
  const trigger = screen.getByRole("button", { name: "Open move history" });
  trigger.focus();
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: "Close move history" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  expect(trigger).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Open move history" }));
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { cancelable: true }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
});

test("resizing to desktop closes the sheet and restores inline history", async () => {
  await mount();
  fireEvent.click(screen.getByRole("button", { name: "Open move history" }));
  setMobile(false);
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(document.body.style.overflow).toBe("");
  expect(
    screen.getByRole("navigation", { name: "Main navigation" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("list", { name: "Move history" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("list", { name: "Your games" })).toBeInTheDocument();
});

test("Profile stays selected when moving between mobile and desktop", async () => {
  const navigation = await mount();
  fireEvent.click(within(navigation).getByRole("button", { name: "Profile" }));
  setMobile(false);
  const desktopNavigation = screen.getByRole("navigation", {
    name: "Main navigation",
  });
  expect(
    within(desktopNavigation).getByRole("button", { name: "Profile" }),
  ).toHaveAttribute("aria-current", "page");
  expect(stat("Total moves")).toHaveTextContent("59");
  expect(
    screen.queryByRole("group", { name: "Connect Four board" }),
  ).not.toBeInTheDocument();
  setMobile(true);
  expect(
    within(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).getByRole("button", { name: "Profile" }),
  ).toHaveAttribute("aria-current", "page");
  expect(stat("Total moves")).toHaveTextContent("59");
});

test("deleting a finished game updates the saved activity and color results", async () => {
  const navigation = await mount();
  fireEvent.click(within(navigation).getByRole("button", { name: "Games" }));
  const rows = within(
    screen.getByRole("list", { name: "Your games" }),
  ).getAllByRole("listitem");
  const blueGame = rows.find((row) =>
    within(row).queryByRole("button", { name: /Blue won/ }),
  )!;
  fireEvent.click(
    within(blueGame).getByRole("button", { name: /Delete game / }),
  );
  fireEvent.click(within(blueGame).getByRole("button", { name: "Delete" }));
  await waitFor(() =>
    expect(
      within(screen.getByRole("list", { name: "Your games" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(4),
  );
  fireEvent.click(within(navigation).getByRole("button", { name: "Profile" }));
  expect(stat("Games played")).toHaveTextContent("3");
  expect(stat("Total moves")).toHaveTextContent("52");
  expect(stat("Finished games")).toHaveTextContent("2");
  expect(stat("Blue wins")).toHaveTextContent("0");
});

test("an untouched board does not count as a played game or invent results", async () => {
  const ready = fixtureGame(4, []);
  games = [ready];
  details = new Map([[ready.id, ready]]);
  localStorage.setItem("connect-four:last-game:" + user.id, ready.id);
  render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
  await screen.findByRole("heading", { name: "Ready to play" });
  fireEvent.click(
    within(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).getByRole("button", { name: "Profile" }),
  );
  expect(stat("Games played")).toHaveTextContent("0");
  expect(stat("Total moves")).toHaveTextContent("0");
  expect(stat("Saved games")).toHaveTextContent("1");
  expect(stat("Blue wins")).toHaveTextContent("0");
  expect(stat("Red wins")).toHaveTextContent("0");
  expect(screen.getByText("Finish a game to see results here.")).toBeVisible();
});

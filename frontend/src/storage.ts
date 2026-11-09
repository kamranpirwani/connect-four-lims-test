const USER_KEY = "connect-four:user-id";
const GAME_PREFIX = "connect-four:last-game:";
const TUTORIAL_PREFIX = "connect-four:tutorial:";

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // The current session still works when browser storage is unavailable.
  }
}

export const storage = {
  user: () => get(USER_KEY),
  saveUser: (id: string | null) => set(USER_KEY, id),
  game: (userId: string) => get(GAME_PREFIX + userId),
  saveGame: (userId: string, id: string | null) =>
    set(GAME_PREFIX + userId, id),
  tutorial: (userId: string) => get(TUTORIAL_PREFIX + userId),
  saveTutorial: (userId: string, progress: string) =>
    set(TUTORIAL_PREFIX + userId, progress),
};

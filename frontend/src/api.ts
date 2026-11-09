import { z } from "zod";
import {
  GameSchema,
  GameSummarySchema,
  SignInSchema,
  SubmitMoveSchema,
  UserSchema,
} from "./schemas";
import type { Game } from "./schemas";

export type {
  Player,
  Cell,
  GameState,
  User,
  Position,
  Move,
  GameSummary,
  Game,
} from "./schemas";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  schema: z.ZodType<T>,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  options.signal?.addEventListener("abort", forwardAbort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    let response: Response;
    try {
      response = await fetch(path, {
        ...options,
        signal: controller.signal,
        headers: {
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });
    } catch (cause) {
      if (options.signal?.aborted) throw cause;
      throw new ApiError(
        0,
        "Cannot reach the game server. Check your connection and try again.",
      );
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const error = z
        .object({
          error: z.object({
            message: z.string(),
            details: z.array(z.object({ message: z.string() })).optional(),
          }),
        })
        .safeParse(body);
      const message = error.success
        ? (error.data.error.details?.[0]?.message ?? error.data.error.message)
        : "The server could not complete this request. Try again.";
      throw new ApiError(response.status, message);
    }
    const body: unknown =
      response.status === 204
        ? undefined
        : await response.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        502,
        "The server returned an unexpected response. Refresh and try again.",
      );
    return parsed.data;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", forwardAbort);
  }
}

export const api = {
  signIn: (name: string) =>
    request(UserSchema, "/api/users", {
      method: "POST",
      body: JSON.stringify(SignInSchema.parse({ name })),
    }),
  user: (id: string, signal?: AbortSignal) =>
    request(UserSchema, "/api/users/" + encodeURIComponent(id), { signal }),
  games: (id: string, signal?: AbortSignal) =>
    request(
      z.array(GameSummarySchema),
      "/api/users/" + encodeURIComponent(id) + "/games",
      { signal },
    ),
  createGame: (userId: string) =>
    request(GameSchema, "/api/games", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),
  game: (id: string, signal?: AbortSignal) =>
    request(GameSchema, "/api/games/" + encodeURIComponent(id), { signal }),
  move: (game: Game, column: number) =>
    request(
      GameSchema,
      "/api/games/" + encodeURIComponent(game.id) + "/moves",
      {
        method: "POST",
        body: JSON.stringify(
          SubmitMoveSchema.parse({
            column,
            player: game.next_player ?? undefined,
            expected_version: game.version,
          }),
        ),
      },
    ),
  deleteGame: (id: string) =>
    request(z.undefined(), "/api/games/" + encodeURIComponent(id), {
      method: "DELETE",
    }),
};

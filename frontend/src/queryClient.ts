import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export const queryKeys = {
  user: (id: string | null) => ["users", id] as const,
  games: (id: string | null) => ["users", id, "games"] as const,
  game: (id: string | null) => ["games", id] as const,
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: (failures, error) =>
          failures < 1 &&
          !(
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          ),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        networkMode: "always",
      },
      mutations: { retry: false, networkMode: "always" },
    },
  });
}

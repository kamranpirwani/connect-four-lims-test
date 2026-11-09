import { useCallback, useEffect, useRef, useState } from "react";
import {
  isCancelledError,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "../api";
import type { Game, GameSummary } from "../schemas";
import { queryKeys as keys } from "../queryClient";
import { storage } from "../storage";

const EMPTY_GAMES: GameSummary[] = [];
const orderGames = (games: GameSummary[]) =>
  [...games].sort(
    (a, b) =>
      b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id),
  );

export function useGameSession() {
  const client = useQueryClient();
  const [userId, setUserId] = useState(storage.user);
  const [selectedId, setSelectedId] = useState(() => {
    const id = storage.user();
    return id ? storage.game(id) : null;
  });
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [blockedGameId, setBlockedGameId] = useState<string | null>(null);
  const initialSetup = useRef(new Set<string>());
  const operations = useRef(new Set<string>());
  const pendingMoves = useRef(new Map<string, Promise<Game | undefined>>());

  const profile = useQuery({
    queryKey: keys.user(userId),
    queryFn: ({ signal }) => api.user(userId!, signal),
    enabled: !!userId,
  });
  const lobby = useQuery({
    queryKey: keys.games(userId),
    queryFn: ({ signal }) => api.games(userId!, signal),
    select: orderGames,
    enabled: !!profile.data,
  });
  const games = lobby.data ?? EMPTY_GAMES;
  const selectedExists = games.some((game) => game.id === selectedId);
  const detail = useQuery({
    queryKey: keys.game(selectedId),
    queryFn: ({ signal }) => api.game(selectedId!, signal),
    enabled: !!profile.data && selectedExists,
  });

  const selectGame = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (userId) storage.saveGame(userId, id);
    },
    [userId],
  );

  const forgetGame = useCallback(
    (id: string) => {
      client.setQueryData<GameSummary[]>(keys.games(userId), (list) =>
        list?.filter((game) => game.id !== id),
      );
      client.removeQueries({ queryKey: keys.game(id), exact: true });
      setSelectedId((current) => {
        if (current !== id) return current;
        const remaining =
          client.getQueryData<GameSummary[]>(keys.games(userId)) ?? [];
        const next = orderGames(remaining)[0]?.id ?? null;
        if (userId) storage.saveGame(userId, next);
        return next;
      });
    },
    [client, userId],
  );

  const cacheGame = useCallback(
    (game: Game) => {
      const latest = client.setQueryData<Game>(
        keys.game(game.id),
        (previous) =>
          previous && previous.version > game.version ? previous : game,
      )!;
      const { moves: _moves, ...summary } = latest;
      client.setQueryData<GameSummary[]>(keys.games(game.user_id), (list) => {
        if (!list?.some((item) => item.id === game.id))
          return [summary, ...(list ?? [])];
        // Preserve row order and references for every other saved game.
        return list.map((item) => (item.id === game.id ? summary : item));
      });
      setBlockedGameId((current) => (current === game.id ? null : current));
    },
    [client],
  );

  const cancelGameReads = useCallback(
    async (id: string | null) => {
      await Promise.all([
        client.cancelQueries({ queryKey: keys.games(userId), exact: true }),
        client.cancelQueries({ queryKey: keys.game(id), exact: true }),
      ]);
    },
    [client, userId],
  );

  const perform = useCallback(
    async <T>(
      key: string,
      action: () => Promise<T>,
    ): Promise<T | undefined> => {
      if (operations.current.has(key)) return undefined;
      operations.current.add(key);
      setMessage(null);
      try {
        return await action();
      } catch (error) {
        if (!isCancelledError(error))
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not complete the request.",
          );
        return undefined;
      } finally {
        operations.current.delete(key);
      }
    },
    [],
  );

  const signInMutation = useMutation({
    mutationFn: api.signIn,
    onSuccess: async (user) => {
      await client.cancelQueries();
      client.removeQueries();
      initialSetup.current.clear();
      setReadyUserId(null);
      client.setQueryData(keys.user(user.id), user);
      storage.saveUser(user.id);
      setUserId(user.id);
      setSelectedId(storage.game(user.id));
      setBlockedGameId(null);
    },
  });
  const createMutation = useMutation({
    mutationFn: () => api.createGame(userId!),
    onMutate: async () => {
      await cancelGameReads(selectedId);
      return new Set(
        (client.getQueryData<GameSummary[]>(keys.games(userId)) ?? []).map(
          (game) => game.id,
        ),
      );
    },
    onSuccess: async (game) => {
      await cancelGameReads(game.id);
      cacheGame(game);
      selectGame(game.id);
    },
    onError: async (_error, _variables, existingIds) => {
      // A lost create response may still have committed. Recover before offering another.
      await client.invalidateQueries({
        queryKey: keys.games(userId),
        exact: true,
      });
      const recovered = client
        .getQueryData<GameSummary[]>(keys.games(userId))
        ?.find((game) => !existingIds?.has(game.id));
      if (recovered) selectGame(recovered.id);
    },
  });
  const moveMutation = useMutation({
    mutationFn: ({ game, column }: { game: Game; column: number }) =>
      api.move(game, column),
    onMutate: ({ game }) => cancelGameReads(game.id),
    onSuccess: async (game) => {
      // Cancel focus/reconnect reads started while the POST was pending.
      await cancelGameReads(game.id);
      cacheGame(game);
    },
    onError: async (error, { game }) => {
      if (error instanceof ApiError && error.status === 404) {
        forgetGame(game.id);
        return;
      }
      if (
        !(error instanceof ApiError) ||
        !(error.status === 0 || error.status === 409 || error.status >= 500)
      )
        return;
      setBlockedGameId(game.id);
      try {
        const current = await client.fetchQuery({
          queryKey: keys.game(game.id),
          queryFn: ({ signal }) => api.game(game.id, signal),
          staleTime: 0,
          retry: false,
        });
        cacheGame(current);
      } catch (recoveryError) {
        if (recoveryError instanceof ApiError && recoveryError.status === 404)
          forgetGame(game.id);
      }
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.deleteGame(id);
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
    },
    onMutate: async (id) => {
      // Deleting a game waits for its pending move; other games can still be opened.
      await pendingMoves.current.get(id);
      await cancelGameReads(id);
    },
    onSuccess: async (_result, id) => {
      await cancelGameReads(id);
      forgetGame(id);
    },
    onError: async () => {
      await client.invalidateQueries({
        queryKey: keys.games(userId),
        exact: true,
      });
    },
  });

  const signIn = useCallback(
    (name: string) =>
      perform("sign-in", () => signInMutation.mutateAsync(name)),
    [perform, signInMutation.mutateAsync],
  );
  const createGame = useCallback(
    () =>
      userId
        ? perform("create", () => createMutation.mutateAsync())
        : Promise.resolve(undefined),
    [userId, perform, createMutation.mutateAsync],
  );
  const deleteGame = useCallback(
    (id: string) =>
      perform("delete:" + id, () => deleteMutation.mutateAsync(id)),
    [perform, deleteMutation.mutateAsync],
  );

  // One initial action per profile entry, including Strict Mode's repeated effects.
  useEffect(() => {
    if (
      !userId ||
      !profile.data ||
      !lobby.isSuccess ||
      initialSetup.current.has(userId)
    )
      return;
    initialSetup.current.add(userId);
    const preferred = selectedExists ? selectedId : games[0]?.id;
    if (preferred) {
      selectGame(preferred);
      setReadyUserId(userId);
    } else {
      void createGame().finally(() => setReadyUserId(userId));
    }
  }, [
    userId,
    profile.data,
    lobby.isSuccess,
    games,
    selectedExists,
    selectedId,
    createGame,
    selectGame,
  ]);

  useEffect(() => {
    if (
      profile.error instanceof ApiError &&
      [404, 422].includes(profile.error.status)
    ) {
      storage.saveUser(null);
      setUserId(null);
      setSelectedId(null);
      setReadyUserId(null);
      setMessage(
        "Your saved profile could not be found. Enter your name to continue.",
      );
    }
  }, [profile.error]);

  useEffect(() => {
    if (
      lobby.isSuccess &&
      readyUserId === userId &&
      selectedId &&
      !selectedExists
    ) {
      selectGame(games[0]?.id ?? null);
    }
  }, [
    lobby.isSuccess,
    readyUserId,
    userId,
    selectedId,
    selectedExists,
    games,
    selectGame,
  ]);

  useEffect(() => {
    if (
      detail.error instanceof ApiError &&
      detail.error.status === 404 &&
      selectedId
    ) {
      setMessage(detail.error.message);
      forgetGame(selectedId);
    }
  }, [detail.error, selectedId, forgetGame]);

  useEffect(() => {
    if (detail.dataUpdatedAt && !detail.error)
      setBlockedGameId((current) => (current === selectedId ? null : current));
  }, [detail.dataUpdatedAt, detail.error, selectedId]);

  const openGame = useCallback(
    async (id: string) => {
      setMessage(null);
      void client.invalidateQueries({ queryKey: keys.game(id), exact: true });
      selectGame(id);
    },
    [client, selectGame],
  );

  const signOut = useCallback(
    () =>
      perform("sign-out", async () => {
        await client.cancelQueries();
        client.removeQueries();
        initialSetup.current.clear();
        storage.saveUser(null);
        setUserId(null);
        setSelectedId(null);
        setReadyUserId(null);
        setBlockedGameId(null);
      }),
    [client, perform],
  );

  const refresh = useCallback(
    () =>
      perform("refresh", async () => {
        if (!userId) return;
        await client.fetchQuery({
          queryKey: keys.user(userId),
          queryFn: ({ signal }) => api.user(userId, signal),
          staleTime: 0,
        });
        const currentGames = await client.fetchQuery({
          queryKey: keys.games(userId),
          queryFn: ({ signal }) => api.games(userId, signal),
          staleTime: 0,
        });
        if (selectedId && currentGames.some((game) => game.id === selectedId)) {
          const current = await client.fetchQuery({
            queryKey: keys.game(selectedId),
            queryFn: ({ signal }) => api.game(selectedId, signal),
            staleTime: 0,
          });
          cacheGame(current);
        } else selectGame(orderGames(currentGames)[0]?.id ?? null);
      }),
    [client, userId, selectedId, cacheGame, selectGame, perform],
  );

  const drop = useCallback(
    (column: number): Promise<Game | undefined> => {
      const game = detail.data;
      if (
        !game?.next_player ||
        blockedGameId === game.id ||
        pendingMoves.current.has(game.id)
      )
        return Promise.resolve(undefined);
      const pending = perform("move:" + game.id, () =>
        moveMutation.mutateAsync({ game, column }),
      );
      pendingMoves.current.set(game.id, pending);
      void pending.then(() => {
        if (pendingMoves.current.get(game.id) === pending)
          pendingMoves.current.delete(game.id);
      });
      return pending;
    },
    [detail.data, blockedGameId, perform, moveMutation.mutateAsync],
  );

  const savingMove =
    moveMutation.isPending && moveMutation.variables?.game.id === selectedId;
  return {
    user: profile.data ?? null,
    games,
    selectedId,
    game: selectedExists ? (detail.data ?? null) : null,
    loading:
      !!userId &&
      (profile.isPending ||
        (profile.isSuccess && (lobby.isPending || readyUserId !== userId))),
    openingGame: selectedExists && detail.isPending,
    boardBusy:
      detail.isFetching ||
      savingMove ||
      (deleteMutation.isPending && deleteMutation.variables === selectedId),
    savingMove,
    navigationBusy: createMutation.isPending || deleteMutation.isPending,
    creating: createMutation.isPending,
    signingIn: signInMutation.isPending,
    profileBusy:
      signInMutation.isPending ||
      createMutation.isPending ||
      moveMutation.isPending ||
      deleteMutation.isPending,
    refreshing: profile.isFetching || lobby.isFetching,
    needsRefresh: blockedGameId === selectedId && selectedId !== null,
    error:
      message ??
      profile.error?.message ??
      lobby.error?.message ??
      detail.error?.message ??
      null,
    signIn,
    signOut,
    createGame,
    openGame,
    refresh,
    drop,
    deleteGame,
  };
}

export type GameSession = ReturnType<typeof useGameSession>;

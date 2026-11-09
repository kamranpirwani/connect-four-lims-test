import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import type { Game, GameSummary } from "../schemas";
import { storage } from "../storage";

const ProgressSchema = z.object({
  step: z.number().int().min(0).max(3),
  gameId: z.string().nullable(),
  firstColumn: z.number().int().min(0).max(6).nullable(),
  lastMove: z.number().int().min(0).max(42),
});
type Progress = z.infer<typeof ProgressSchema>;

function readProgress(userId: string, games: GameSummary[]): Progress {
  try {
    const saved = storage.tutorial(userId);
    if (saved) {
      const result = ProgressSchema.safeParse(JSON.parse(saved));
      if (result.success) return result.data;
    }
  } catch {
    /* Ignore invalid browser data and use the appropriate first-play state. */
  }
  return {
    step: games.some((game) => game.version > 0) ? 3 : 0,
    gameId: null,
    firstColumn: null,
    lastMove: 0,
  };
}

export function useFirstGameTutorial(userId: string, games: GameSummary[]) {
  const [progress, setProgress] = useState(() => readProgress(userId, games));

  useEffect(() => {
    storage.saveTutorial(userId, JSON.stringify(progress));
  }, [progress, userId]);

  const recordMove = useCallback((game: Game) => {
    const lastMove = game.moves.at(-1);
    if (!lastMove) return;
    setProgress((previous) => {
      if (
        previous.step >= 3 ||
        (previous.gameId && previous.gameId !== game.id) ||
        previous.lastMove >= game.version
      )
        return previous;
      return {
        step: previous.step + 1,
        gameId: game.id,
        firstColumn: previous.firstColumn ?? lastMove.column,
        lastMove: game.version,
      };
    });
  }, []);
  const dismiss = useCallback(
    () => setProgress((previous) => ({ ...previous, step: 3 })),
    [],
  );

  return { progress, recordMove, dismiss };
}

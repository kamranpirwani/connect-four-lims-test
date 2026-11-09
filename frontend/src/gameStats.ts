import type { GameSummary } from "./schemas";

export function gameStats(games: GameSummary[]) {
  return {
    saved: games.length,
    played: games.filter((game) => game.version > 0).length,
    completed: games.filter((game) => game.next_player === null).length,
    open: games.filter((game) => game.next_player !== null).length,
    moves: games.reduce((total, game) => total + game.version, 0),
    blueWins: games.filter(
      (game) => game.state === "complete" && game.winner === 1,
    ).length,
    redWins: games.filter(
      (game) => game.state === "complete" && game.winner === 2,
    ).length,
    draws: games.filter((game) => game.state === "draw").length,
  };
}

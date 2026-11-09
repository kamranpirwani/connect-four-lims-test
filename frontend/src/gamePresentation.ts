import type { GameSummary, Player } from "./schemas";

export const playerName = (player: Player) => (player === 1 ? "Blue" : "Red");

export function gameHeading(game: GameSummary): string {
  if (game.winner) return playerName(game.winner) + " won";
  if (game.state === "draw") return "Draw";
  if (game.state === "not_started") return "Ready to play";
  return playerName(game.next_player!) + " to play";
}

export function savedGameLabel(game: GameSummary): string {
  return game.state === "in_progress" ? "In progress" : gameHeading(game);
}

export function gameDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

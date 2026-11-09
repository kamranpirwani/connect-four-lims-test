import { useRef, useState } from "react";

type Game = {
  // Make these enum
  next_player: number | null;
  winner: number | null;
  state: string;
};

// use constants for board
const emptyBoard = () => Array.from({ length: 6 }, () => Array(7).fill(0));

const initialGame: Game = {
  next_player: 1,
  winner: null,
  state: "not_started",
};

const playerName = (player: number) => (player === 1 ? "Blue" : "Red");

export default function App() {
  const [board, setBoard] = useState(emptyBoard);
  const [game, setGame] = useState(initialGame);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(undefined);

  const gameCompleted =
    game.winner !== undefined ||
    game.state === "draw" ||
    game.state === "complete";

  const message = busy
    ? "Checking board..."
    : game.winner !== null
      ? `${playerName(game.winner)} wins!`
      : game.state === "draw"
        ? "Draw"
        : gameCompleted
          ? "Game over"
          : `${playerName(game.next_player ?? 1)} turn`;

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "20px auto",
        padding: 16,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Connect Four</h1>
      <p>Click any slot in the columns to drop a chip</p>

      <h2>{message}</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gap: 8,
        padding: 10,
        background: "blue",
        borderRadius: 8
      }}
      {board.flatMap((row, r) =>
        row.map((cell, c) => (
                    <button style={{
            width: "100%",
            padding: 0,
            borderRadius: "50%",
            background: "green",
            color: "red",
            fontSize: 24,
            cursor: "pointer"
          }}>
          </button>
        ))
    )}
    </main>
  );
}

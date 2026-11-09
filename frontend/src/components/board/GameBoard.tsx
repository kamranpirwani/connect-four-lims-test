import { memo, useMemo } from "react";
import styled from "styled-components";
import type { Game, Move } from "../../schemas";
import { colors } from "../../styles/theme";
import { BoardColumn } from "./BoardColumn";

const Housing = styled.div({
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "clamp(5px, 1.2vw, 12px)",
  padding: "clamp(10px, 2vw, 20px)",
  background: colors.board,
  borderRadius: 16,
  marginTop: 20,
  overflow: "hidden",
  boxShadow: "0 7px 0 #14274f",
});

export const GameBoard = memo(function GameBoard({
  game,
  disabled,
  animateMove,
  highlightedMove,
  hintColumn,
  tipId,
  onDrop,
}: {
  game: Game;
  disabled: boolean;
  animateMove: number | null;
  highlightedMove: Move | null;
  hintColumn: number | null;
  tipId?: string;
  onDrop: (column: number) => void;
}) {
  const columns = useMemo(
    () =>
      Array.from({ length: 7 }, (_, column) =>
        game.board.map((row) => row[column]),
      ),
    [game.board],
  );
  return (
    <Housing
      role="group"
      aria-label="Connect Four board"
      aria-busy={disabled && !!game.next_player}
    >
      {columns.map((cells, column) => (
        <BoardColumn
          key={column}
          column={column}
          cells={cells}
          disabled={disabled || game.next_player === null}
          lastMove={game.moves.at(-1)}
          animateMove={animateMove}
          winningCells={game.winning_cells}
          highlightedMove={highlightedMove}
          hinted={hintColumn === column}
          tipId={tipId}
          onDrop={onDrop}
        />
      ))}
    </Housing>
  );
});

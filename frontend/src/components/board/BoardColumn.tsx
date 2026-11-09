import styled from "styled-components";
import type { Cell, Move, Position } from "../../schemas";
import { BoardCell } from "./BoardCell";

const ColumnButton = styled.button<{ $hinted: boolean }>((p) => ({
  display: "grid",
  gap: "clamp(5px, 1.2vw, 12px)",
  border: 0,
  padding: 0,
  background: p.$hinted ? "#ffffff18" : "transparent",
  borderRadius: 50,
  cursor: "pointer",
  outline: p.$hinted ? "2px dashed #ffcf64" : undefined,
  outlineOffset: 5,
  "&:hover:not(:disabled)": { background: "rgba(255,255,255,0.12)" },
  "&:focus-visible": { outlineColor: "#ffcf64", outlineOffset: 4 },
  "&:disabled": { cursor: "default" },
}));
const Number = styled.span({
  color: "#e6edff",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1,
  padding: "2px 0 1px",
});

export function BoardColumn({
  column,
  cells,
  disabled,
  lastMove,
  animateMove,
  winningCells,
  highlightedMove,
  hinted,
  tipId,
  onDrop,
}: {
  column: number;
  cells: Cell[];
  disabled: boolean;
  lastMove?: Move;
  animateMove: number | null;
  winningCells: Position[];
  highlightedMove: Move | null;
  hinted: boolean;
  tipId?: string;
  onDrop: (column: number) => void;
}) {
  return (
    <ColumnButton
      type="button"
      aria-label={"Drop chip in column " + (column + 1)}
      aria-describedby={tipId}
      disabled={disabled || cells[0] !== 0}
      $hinted={hinted}
      onClick={() => onDrop(column)}
    >
      <Number aria-hidden="true">{column + 1}</Number>
      {cells.map((cell, row) => (
        <BoardCell
          key={row}
          cell={cell}
          row={row}
          column={column}
          winning={winningCells.some(
            (position) => position.row === row && position.column === column,
          )}
          highlighted={
            highlightedMove?.row === row && highlightedMove.column === column
          }
          animate={
            lastMove?.number === animateMove &&
            lastMove.row === row &&
            lastMove.column === column
          }
        />
      ))}
    </ColumnButton>
  );
}

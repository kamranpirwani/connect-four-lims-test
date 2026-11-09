import { memo } from "react";
import styled, { css, keyframes } from "styled-components";
import type { Cell, Player } from "../../schemas";

const fall = keyframes({
  from: { transform: "translateY(var(--drop-start))" },
  to: { transform: "translateY(0)" },
});
const Slot = styled.span<{ $highlighted: boolean }>((p) => ({
  position: "relative",
  display: "block",
  aspectRatio: "1",
  borderRadius: "50%",
  background: "#e5ebf4",
  boxShadow: "inset 0 3px 5px #11264f40",
  outline: p.$highlighted ? "3px solid #ffffff" : "none",
  outlineOffset: 3,
}));
const Chip = styled.span<{
  $player: Player;
  $winning: boolean;
  $animate: boolean;
  $row: number;
}>(
  (p) => ({
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: p.$player === 1 ? "#4a80f5" : "#ed566b",
    color: "#0d1830",
    fontSize: "clamp(12px, 1.5vw, 18px)",
    fontWeight: 800,
    border: p.$winning ? "4px solid #ffcf64" : "3px solid #ffffff25",
    boxShadow: "inset 0 -4px 0 #00000015",
    "--drop-start": -(p.$row + 1) * 115 + "%",
  }),
  (p) =>
    p.$animate
      ? css`
          animation: ${fall} 300ms ease-out;
        `
      : css`
          animation: none;
        `,
);

export const BoardCell = memo(function BoardCell({
  cell,
  row,
  column,
  winning,
  highlighted,
  animate,
}: {
  cell: Cell;
  row: number;
  column: number;
  winning: boolean;
  highlighted: boolean;
  animate: boolean;
}) {
  const label = cell === 1 ? "Blue" : cell === 2 ? "Red" : "empty";
  return (
    <Slot
      role="img"
      aria-label={
        "Row " + (row + 1) + ", column " + (column + 1) + ": " + label
      }
      $highlighted={highlighted}
      data-highlighted={highlighted || undefined}
    >
      {cell !== 0 && (
        <Chip $player={cell} $winning={winning} $animate={animate} $row={row}>
          {cell}
        </Chip>
      )}
    </Slot>
  );
});

import { memo } from "react";
import styled from "styled-components";
import type { Move } from "../../schemas";
import { playerName } from "../../gamePresentation";
import { colors } from "../../styles/theme";
import { historyGrid } from "./historyLayout";

const Entry = styled.button<{ $selected: boolean; $latest: boolean }>((p) => ({
  ...historyGrid,
  width: "100%",
  padding: "11px 12px",
  border: 0,
  borderBottom: "1px solid " + colors.line,
  borderRadius: 6,
  textAlign: "left",
  cursor: "pointer",
  color: colors.ink,
  fontSize: 13,
  background: p.$selected ? "#e4edff" : p.$latest ? "#f3f7ff" : "transparent",
  "&:hover": { background: "#edf3ff" },
  "@media(max-width: 420px)": {
    gridTemplateColumns: "24px 24px 1fr 68px",
    gap: 6,
    padding: "10px 6px",
  },
}));
const Number = styled.span({
  color: colors.muted,
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
});
const Chip = styled.span<{ $player: number }>((p) => ({
  width: 22,
  height: 22,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: p.$player === 1 ? colors.blue : colors.red,
  color: colors.paper,
  fontSize: 11,
  fontWeight: 800,
}));
const ColumnTrack = styled.span({
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 3,
  alignItems: "center",
  "@media(max-width: 420px)": { display: "none" },
});
const Marker = styled.span<{ $active: boolean; $player: number }>((p) => ({
  aspectRatio: "1",
  borderRadius: "50%",
  background: p.$active
    ? p.$player === 1
      ? colors.blue
      : colors.red
    : "#e1e7f1",
}));
const ColumnText = styled.span({
  textAlign: "right",
  fontWeight: 600,
  fontSize: 12,
});

export const MoveHistoryItem = memo(function MoveHistoryItem({
  move,
  selected,
  latest,
  onInspect,
}: {
  move: Move;
  selected: boolean;
  latest: boolean;
  onInspect: (number: number) => void;
}) {
  return (
    <li value={move.number}>
      <Entry
        type="button"
        $selected={selected}
        $latest={latest}
        aria-pressed={selected}
        aria-label={
          "Move " +
          move.number +
          ", " +
          playerName(move.player) +
          ", column " +
          (move.column + 1) +
          ", row " +
          (move.row + 1)
        }
        onClick={() => onInspect(move.number)}
      >
        <Number>#{move.number}</Number>
        <Chip $player={move.player} aria-hidden="true" />
        <strong>{playerName(move.player)}</strong>
        <ColumnTrack aria-hidden="true">
          {Array.from({ length: 7 }, (_, column) => (
            <Marker
              key={column}
              $active={column === move.column}
              $player={move.player}
            />
          ))}
        </ColumnTrack>
        <ColumnText>Column {move.column + 1}</ColumnText>
      </Entry>
    </li>
  );
});

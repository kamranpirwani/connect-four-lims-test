import { memo } from "react";
import styled from "styled-components";
import type { Move } from "../../schemas";
import { Panel } from "../common/Panel";
import { SectionTitle, Subtle } from "../common/Typography";
import { TextButton } from "../common/Button";
import { MoveHistoryItem } from "./MoveHistoryItem";
import { historyGrid } from "./historyLayout";

const Heading = styled.div({
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginBottom: 6,
});
const Surface = styled(Panel)<{ $embedded: boolean }>((p) =>
  p.$embedded
    ? {
        border: 0,
        padding: 0,
        background: "transparent",
        borderRadius: 0,
        "@media(max-width: 500px)": { padding: 0 },
      }
    : {},
);
const List = styled.ol<{ $embedded: boolean }>((p) => ({
  padding: 0,
  margin: "4px 0 0",
  listStyle: "none",
  maxHeight: p.$embedded ? "none" : 300,
  overflowY: "auto",
  overscrollBehavior: "contain",
}));
const ColumnHeadings = styled.div({
  ...historyGrid,
  marginTop: 14,
  padding: "0 12px",
  fontSize: 11,
  color: "#5b6a82",
  "span:nth-child(2)": { gridColumn: "2 / 4" },
  "span:last-child": { gridColumn: "4 / -1", textAlign: "right" },
  "@media(max-width: 420px)": {
    ...historyGrid["@media(max-width: 420px)"],
    padding: "0 6px",
  },
});

export const MoveHistory = memo(function MoveHistory({
  moves,
  highlightedNumber,
  onInspect,
  embedded = false,
}: {
  moves: Move[];
  highlightedNumber: number | null;
  onInspect: (number: number | null) => void;
  embedded?: boolean;
}) {
  return (
    <Surface
      $embedded={embedded}
      as={embedded ? "div" : "section"}
      aria-labelledby={embedded ? undefined : "move-history-heading"}
    >
      {(!embedded || highlightedNumber !== null) && (
        <Heading>
          {!embedded && (
            <SectionTitle id="move-history-heading">Move history</SectionTitle>
          )}
          {highlightedNumber !== null && (
            <TextButton onClick={() => onInspect(null)}>
              Clear highlight
            </TextButton>
          )}
        </Heading>
      )}
      <Subtle>
        {moves.length
          ? "Latest first. Select a move to highlight its chip."
          : "Your first move will appear here."}
      </Subtle>
      {moves.length > 0 && (
        <ColumnHeadings aria-hidden="true">
          <span>Move</span>
          <span>Player</span>
          <span>Column</span>
        </ColumnHeadings>
      )}
      {moves.length > 0 && (
        <List
          $embedded={embedded}
          reversed
          start={moves.length}
          aria-label="Move history"
        >
          {moves
            .slice()
            .reverse()
            .map((move, index) => (
              <MoveHistoryItem
                key={move.number}
                move={move}
                selected={move.number === highlightedNumber}
                latest={index === 0}
                onInspect={onInspect}
              />
            ))}
        </List>
      )}
    </Surface>
  );
});

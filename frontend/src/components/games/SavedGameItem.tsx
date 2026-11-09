import { memo, useState } from "react";
import styled from "styled-components";
import type { GameSummary } from "../../schemas";
import { gameDate, savedGameLabel } from "../../gamePresentation";
import { colors } from "../../styles/theme";
import { TextButton } from "../common/Button";

const Item = styled.li<{ $selected: boolean }>((p) => ({
  border: "1px solid " + (p.$selected ? "#a7bff2" : colors.line),
  borderRadius: 10,
  background: p.$selected ? "#eef4ff" : colors.paper,
  overflow: "hidden",
}));
const OpenGame = styled.button({
  width: "100%",
  textAlign: "left",
  border: 0,
  background: "transparent",
  padding: "13px 14px 8px",
  cursor: "pointer",
  color: colors.ink,
  strong: { display: "block", fontSize: 14 },
  small: { color: colors.muted, fontSize: 12 },
});
const Actions = styled.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "0 14px 10px",
  fontSize: 12,
  color: colors.muted,
});

export const SavedGameItem = memo(function SavedGameItem({
  game,
  selected,
  disabled,
  onOpen,
  onDelete,
}: {
  game: GameSummary;
  selected: boolean;
  disabled: boolean;
  onOpen: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <Item $selected={selected}>
      <OpenGame
        disabled={disabled}
        aria-pressed={selected}
        onClick={() => void onOpen(game.id)}
      >
        <strong>{savedGameLabel(game)}</strong>
        <small>
          {gameDate(game.created_at)} / {game.version}{" "}
          {game.version === 1 ? "move" : "moves"}
        </small>
      </OpenGame>
      <Actions>
        {confirming ? (
          <>
            <span>Delete this game?</span>
            <TextButton
              disabled={disabled}
              onClick={() =>
                void onDelete(game.id).then(() => setConfirming(false))
              }
            >
              Delete
            </TextButton>
            <TextButton
              disabled={disabled}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </TextButton>
          </>
        ) : (
          <>
            <span>
              {game.next_player === null ? "View history" : "Resume anytime"}
            </span>
            <TextButton
              aria-label={"Delete game " + game.id.slice(0, 8)}
              disabled={disabled}
              onClick={() => setConfirming(true)}
            >
              Delete
            </TextButton>
          </>
        )}
      </Actions>
    </Item>
  );
});

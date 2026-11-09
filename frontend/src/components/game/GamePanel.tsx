import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { Game } from "../../schemas";
import type { useFirstGameTutorial } from "../../hooks/useFirstGameTutorial";
import { gameHeading } from "../../gamePresentation";
import { colors } from "../../styles/theme";
import { GameBoard } from "../board/GameBoard";
import { Button } from "../common/Button";
import { Panel } from "../common/Panel";
import { Subtle } from "../common/Typography";
import { MoveHistory } from "../history/MoveHistory";
import { FirstGameTips } from "../tutorial/FirstGameTips";
import { BottomSheet } from "../common/BottomSheet";

const Stack = styled.div({ display: "grid", gap: 16 });
const Heading = styled.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
});
const Title = styled.h2({
  fontSize: "clamp(23px, 3vw, 30px)",
  letterSpacing: "-0.8px",
  lineHeight: 1.2,
});
const Footer = styled.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
  marginTop: 18,
  minHeight: 22,
  fontSize: 13,
  color: colors.muted,
});
const Legend = styled.div({ display: "flex", gap: 18 });
const PlayerLabel = styled.span<{ $player: number }>((p) => ({
  display: "inline-flex",
  gap: 7,
  alignItems: "center",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
  color: p.$player === 1 ? colors.blue : colors.red,
  "&::before": {
    content: '""',
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "currentColor",
  },
}));
const Inspection = styled.div({
  marginTop: 16,
  padding: "8px 12px",
  background: "#eef4ff",
  borderRadius: 8,
  fontSize: 13,
});
const MovesButton = styled(Button)({
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  flexShrink: 0,
  padding: "8px 12px",
});
const MoveCount = styled.span({
  fontSize: 12,
  fontWeight: 700,
  minWidth: 18,
  textAlign: "center",
  color: colors.muted,
});

export function GamePanel({
  game,
  boardBusy,
  savingMove,
  needsRefresh,
  creating,
  onDrop,
  onCreate,
  tutorial,
  mobile = false,
}: {
  game: Game;
  boardBusy: boolean;
  savingMove: boolean;
  needsRefresh: boolean;
  creating: boolean;
  onDrop: (column: number) => Promise<Game | undefined>;
  onCreate: () => Promise<unknown>;
  tutorial: ReturnType<typeof useFirstGameTutorial>;
  mobile?: boolean;
}) {
  const [animateMove, setAnimateMove] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);
  const panel = useRef<HTMLElement>(null);
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(
    null,
  );
  const highlightedMove =
    game.moves.find((move) => move.number === highlightedNumber) ?? null;
  const finished = game.next_player === null;
  const showTips =
    !finished &&
    tutorial.progress.step < 3 &&
    (!tutorial.progress.gameId || tutorial.progress.gameId === game.id);

  const inspect = useCallback((number: number | null) => {
    setHighlightedNumber((previous) => (previous === number ? null : number));
    setHistoryOpen(false);
  }, []);

  useEffect(() => {
    if (highlightedNumber === null || historyOpen) return;
    const cell = panel.current?.querySelector<HTMLElement>(
      '[data-highlighted="true"]',
    );
    if (!cell?.scrollIntoView) return;
    const bounds = cell.getBoundingClientRect();
    if (bounds.top < 110 || bounds.bottom > window.innerHeight - 20) {
      cell.scrollIntoView({
        block: "center",
        behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")
          ?.matches
          ? "auto"
          : "smooth",
      });
    }
  }, [highlightedNumber, historyOpen]);

  function drop(column: number) {
    setHighlightedNumber(null);
    setAnimateMove(game.version + 1);
    void onDrop(column).then((accepted) => {
      if (accepted) tutorial.recordMove(accepted);
    });
  }

  return (
    <Stack>
      <Panel ref={panel}>
        <Heading>
          <div>
            <Title aria-live="polite">{gameHeading(game)}</Title>
            <Subtle style={{ marginTop: 7 }}>
              {finished
                ? "Game complete. Review your moves or play again."
                : "Choose a column to drop your chip."}
            </Subtle>
          </div>
          {mobile && (
            <MovesButton
              $secondary
              aria-label="Open move history"
              aria-haspopup="dialog"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 5h16M4 12h16M4 19h10" />
              </svg>
              Moves <MoveCount>{game.moves.length}</MoveCount>
            </MovesButton>
          )}
          {!mobile && game.next_player && (
            <PlayerLabel $player={game.next_player}>
              Player {game.next_player}
            </PlayerLabel>
          )}
        </Heading>
        {showTips && (
          <FirstGameTips
            step={tutorial.progress.step}
            onDismiss={tutorial.dismiss}
          />
        )}
        {needsRefresh && (
          <Subtle role="status" style={{ marginTop: 12 }}>
            Refresh the game before making another move.
          </Subtle>
        )}
        <GameBoard
          game={game}
          disabled={boardBusy || needsRefresh}
          animateMove={animateMove}
          highlightedMove={highlightedMove}
          hintColumn={
            showTips && tutorial.progress.step === 1
              ? tutorial.progress.firstColumn
              : null
          }
          tipId={showTips ? "first-game-tip" : undefined}
          onDrop={drop}
        />
        <Footer>
          <Legend>
            <PlayerLabel $player={1}>1 Blue</PlayerLabel>
            <PlayerLabel $player={2}>2 Red</PlayerLabel>
          </Legend>
          <span role="status">
            {savingMove ? "Saving move…" : game.version + " of 42 moves"}
          </span>
        </Footer>
        {highlightedMove && (
          <Inspection role="status">
            Highlighted: move {highlightedMove.number}, column{" "}
            {highlightedMove.column + 1}, row {highlightedMove.row + 1}.
          </Inspection>
        )}
        {finished && (
          <Button
            style={{ marginTop: 22 }}
            disabled={creating}
            onClick={() => void onCreate()}
          >
            Play a new game
          </Button>
        )}
      </Panel>
      {!mobile && (
        <MoveHistory
          moves={game.moves}
          highlightedNumber={highlightedMove?.number ?? null}
          onInspect={inspect}
        />
      )}
      {mobile && historyOpen && (
        <BottomSheet title="Move history" onDismiss={closeHistory}>
          <MoveHistory
            embedded
            moves={game.moves}
            highlightedNumber={highlightedMove?.number ?? null}
            onInspect={inspect}
          />
        </BottomSheet>
      )}
    </Stack>
  );
}

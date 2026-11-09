import { useState } from "react";
import styled from "styled-components";
import type { GameSummary } from "../../schemas";
import { colors } from "../../styles/theme";
import { Button, TextButton } from "../common/Button";
import { Subtle } from "../common/Typography";
import { SavedGameItem } from "./SavedGameItem";

const Heading = styled.div({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 8,
  h2: { fontSize: 28, letterSpacing: "-0.8px" },
});
const Filters = styled.div({
  maxWidth: 460,
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 4,
  padding: 4,
  margin: "22px 0 18px",
  background: "#dfe7f2",
  borderRadius: 12,
});
const Filter = styled.button<{ $active: boolean }>((p) => ({
  minHeight: 44,
  padding: "8px 6px",
  border: 0,
  borderRadius: 9,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  color: p.$active ? colors.ink : colors.muted,
  background: p.$active ? colors.paper : "transparent",
  boxShadow: p.$active ? "0 1px 4px #182b4d10" : "none",
}));
const List = styled.ul({
  listStyle: "none",
  display: "grid",
  gap: 12,
  margin: 0,
  padding: 0,
  "@media(min-width: 851px)": {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
});
const Empty = styled.p({
  color: colors.muted,
  textAlign: "center",
  padding: "30px 12px",
});
type GameFilter = "all" | "open" | "finished";

export function GamesScreen({
  games,
  selectedId,
  pending,
  refreshing,
  onCreate,
  onOpen,
  onDelete,
  onRefresh,
}: {
  games: GameSummary[];
  selectedId: string | null;
  pending: boolean;
  refreshing: boolean;
  onCreate: () => Promise<unknown>;
  onOpen: (id: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onRefresh: () => Promise<unknown>;
}) {
  const [filter, setFilter] = useState<GameFilter>("all");
  const open = games.filter((game) => game.next_player !== null);
  const finished = games.filter((game) => game.next_player === null);
  const visible =
    filter === "open" ? open : filter === "finished" ? finished : games;
  return (
    <section aria-labelledby="games-screen-heading">
      <Heading>
        <h2 id="games-screen-heading">Your games</h2>
        <Button disabled={pending} onClick={() => void onCreate()}>
          New game
        </Button>
      </Heading>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Subtle>Pick up a game or revisit a finish.</Subtle>
        <TextButton disabled={refreshing} onClick={() => void onRefresh()}>
          Refresh
        </TextButton>
      </div>
      <Filters role="group" aria-label="Filter games">
        <Filter
          $active={filter === "all"}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All ({games.length})
        </Filter>
        <Filter
          $active={filter === "open"}
          aria-pressed={filter === "open"}
          onClick={() => setFilter("open")}
        >
          Open ({open.length})
        </Filter>
        <Filter
          $active={filter === "finished"}
          aria-pressed={filter === "finished"}
          onClick={() => setFilter("finished")}
        >
          Finished ({finished.length})
        </Filter>
      </Filters>
      {visible.length ? (
        <List aria-label="Your games">
          {visible.map((game) => (
            <SavedGameItem
              key={game.id}
              game={game}
              selected={game.id === selectedId}
              disabled={pending}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </List>
      ) : (
        <Empty>
          {filter === "finished"
            ? "No finished games yet."
            : filter === "open"
              ? "No open games right now."
              : "Your game history is clear."}
        </Empty>
      )}
    </section>
  );
}

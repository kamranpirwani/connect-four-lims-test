import { memo } from "react";
import styled from "styled-components";
import type { GameSummary } from "../../schemas";
import { Button, TextButton } from "../common/Button";
import { Panel } from "../common/Panel";
import { SectionTitle, Subtle } from "../common/Typography";
import { SavedGameItem } from "./SavedGameItem";

const Sidebar = styled.aside({
  display: "grid",
  gap: 16,
  "@media(max-width: 850px)": { order: 2 },
});
const Heading = styled.div({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
});
const List = styled.ul({
  listStyle: "none",
  padding: 0,
  margin: "18px -12px 0",
  display: "grid",
  gap: 7,
  maxHeight: 440,
  overflowY: "auto",
});
const NewGame = styled(Button)({ width: "100%" });

export const GameSidebar = memo(function GameSidebar({
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
  const openCount = games.filter((game) => game.next_player !== null).length;
  return (
    <Sidebar aria-label="Saved games">
      <Panel>
        <Heading>
          <SectionTitle>Your games</SectionTitle>
          <TextButton disabled={refreshing} onClick={() => void onRefresh()}>
            Refresh
          </TextButton>
        </Heading>
        <NewGame disabled={pending} onClick={() => void onCreate()}>
          + New game
        </NewGame>
        {games.length ? (
          <List aria-label="Your games">
            {games.map((game) => (
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
          <Subtle style={{ marginTop: 20 }}>Your game history is clear.</Subtle>
        )}
      </Panel>
      <Subtle>
        {openCount} open {openCount === 1 ? "game" : "games"}. Blue goes first,
        then take turns.
      </Subtle>
    </Sidebar>
  );
});

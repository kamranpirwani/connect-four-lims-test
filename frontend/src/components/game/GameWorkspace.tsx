import { useCallback } from "react";
import styled from "styled-components";
import type { GameSession } from "../../hooks/useGameSession";
import { useFirstGameTutorial } from "../../hooks/useFirstGameTutorial";
import { GameSidebar } from "../games/GameSidebar";
import { GamesScreen } from "../games/GamesScreen";
import { ProfileScreen } from "../profile/ProfileScreen";
import { BottomNavigation } from "../navigation/BottomNavigation";
import type { AppView } from "../navigation/destinations";
import { Button } from "../common/Button";
import { Panel } from "../common/Panel";
import { Subtle } from "../common/Typography";
import { GamePanel } from "./GamePanel";

const Layout = styled.div({
  display: "grid",
  gridTemplateColumns: "285px minmax(0, 1fr)",
  gap: 28,
  alignItems: "start",
});
const SecondaryPage = styled.div({ maxWidth: 920, margin: "0 auto" });

export function GameWorkspace({
  session,
  mobile,
  tab,
  onTabChange,
}: {
  session: GameSession;
  mobile: boolean;
  tab: AppView;
  onTabChange: (tab: AppView) => void;
}) {
  const tutorial = useFirstGameTutorial(session.user!.id, session.games);
  const createAndPlay = useCallback(async () => {
    onTabChange("play");
    return session.createGame();
  }, [onTabChange, session.createGame]);
  const openAndPlay = useCallback(
    async (id: string) => {
      onTabChange("play");
      return session.openGame(id);
    },
    [onTabChange, session.openGame],
  );

  const play =
    session.creating && mobile ? (
      <Panel role="status">Starting your game…</Panel>
    ) : session.game ? (
      <GamePanel
        key={session.game.id}
        game={session.game}
        boardBusy={session.boardBusy}
        savingMove={session.savingMove}
        needsRefresh={session.needsRefresh}
        creating={session.creating}
        onDrop={session.drop}
        onCreate={createAndPlay}
        tutorial={tutorial}
        mobile={mobile}
      />
    ) : (
      <Panel>
        <h2>
          {session.openingGame
            ? "Opening your game…"
            : "Ready for another game?"}
        </h2>
        {!session.openingGame && (
          <>
            <Subtle style={{ margin: "10px 0 18px" }}>
              Start a fresh board whenever you’re ready.
            </Subtle>
            <Button
              disabled={session.creating}
              onClick={() => void createAndPlay()}
            >
              Play a new game
            </Button>
          </>
        )}
      </Panel>
    );

  return (
    <>
      <section hidden={tab !== "play"} aria-label="Play screen">
        {mobile ? (
          play
        ) : (
          <Layout>
            <GameSidebar
              games={session.games}
              selectedId={session.selectedId}
              pending={session.navigationBusy}
              refreshing={session.refreshing}
              onCreate={createAndPlay}
              onOpen={openAndPlay}
              onDelete={session.deleteGame}
              onRefresh={session.refresh}
            />
            {play}
          </Layout>
        )}
      </section>
      <section hidden={tab !== "games"} aria-label="Games screen">
        <SecondaryPage>
          <GamesScreen
            games={session.games}
            selectedId={session.selectedId}
            pending={session.navigationBusy}
            refreshing={session.refreshing}
            onCreate={createAndPlay}
            onOpen={openAndPlay}
            onDelete={session.deleteGame}
            onRefresh={session.refresh}
          />
        </SecondaryPage>
      </section>
      <section hidden={tab !== "profile"} aria-label="Profile screen">
        <SecondaryPage>
          <ProfileScreen
            user={session.user!}
            games={session.games}
            busy={session.profileBusy}
            onSignOut={session.signOut}
            onGames={() => onTabChange("games")}
          />
        </SecondaryPage>
      </section>
      {mobile && <BottomNavigation active={tab} onChange={onTabChange} />}
    </>
  );
}

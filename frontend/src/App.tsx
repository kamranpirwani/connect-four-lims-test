import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useGameSession } from "./hooks/useGameSession";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { mobileQuery } from "./styles/theme";
import { GlobalStyle } from "./styles/GlobalStyle";
import { AppHeader } from "./components/layout/AppHeader";
import { NameEntry } from "./components/auth/NameEntry";
import { GameWorkspace } from "./components/game/GameWorkspace";
import { ErrorNotice } from "./components/common/ErrorNotice";
import { Panel } from "./components/common/Panel";
import type { AppView } from "./components/navigation/destinations";

const Shell = styled.main<{ $mobileApp: boolean }>((p) => ({
  maxWidth: 1260,
  margin: "0 auto",
  padding: "36px 40px 56px",
  ["@media" + mobileQuery]: {
    padding: p.$mobileApp
      ? "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) calc(96px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))"
      : "22px 16px 36px",
  },
}));

export default function App() {
  const session = useGameSession();
  const mobile = useMediaQuery(mobileQuery);
  const profileId = session.user?.id ?? null;
  const [navigation, setNavigation] = useState<{
    profileId: string | null;
    tab: AppView;
  }>({ profileId: null, tab: "play" });
  const tab = navigation.profileId === profileId ? navigation.tab : "play";
  useEffect(() => {
    if (profileId === null)
      setNavigation((current) =>
        current.profileId === null ? current : { profileId: null, tab: "play" },
      );
  }, [profileId]);
  const changeTab = useCallback(
    (destination: AppView) => {
      setNavigation({ profileId, tab: destination });
      if (mobile) window.scrollTo({ top: 0, behavior: "auto" });
    },
    [profileId, mobile],
  );
  const openProfile = useCallback(() => changeTab("profile"), [changeTab]);

  return (
    <>
      <GlobalStyle />
      <Shell $mobileApp={mobile && !!session.user}>
        <AppHeader
          user={session.user}
          disabled={session.profileBusy}
          onSignOut={session.signOut}
          onProfile={openProfile}
          mobile={mobile}
          activeView={tab}
          onNavigate={changeTab}
        />
        {session.error && (
          <ErrorNotice
            message={session.error}
            refreshing={session.refreshing}
            onRefresh={session.user ? session.refresh : undefined}
          />
        )}
        {session.loading ? (
          <Panel role="status">Preparing your game…</Panel>
        ) : session.user ? (
          <GameWorkspace
            key={session.user.id}
            session={session}
            mobile={mobile}
            tab={tab}
            onTabChange={changeTab}
          />
        ) : (
          <NameEntry pending={session.signingIn} onSignIn={session.signIn} />
        )}
      </Shell>
    </>
  );
}

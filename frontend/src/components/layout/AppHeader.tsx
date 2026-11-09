import { memo } from "react";
import styled from "styled-components";
import type { User } from "../../schemas";
import { colors, mobileQuery } from "../../styles/theme";
import { TextButton } from "../common/Button";
import { DesktopNavigation } from "../navigation/DesktopNavigation";
import type { AppView } from "../navigation/destinations";

const Header = styled.header({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 32,
  flexWrap: "wrap",
  ["@media" + mobileQuery]: {
    position: "sticky",
    top: "env(safe-area-inset-top, 0px)",
    zIndex: 10,
    background: colors.background,
    padding: "12px 0",
    marginTop: -12,
    marginBottom: 16,
    flexWrap: "nowrap",
    gap: 12,
  },
});
const Brand = styled.div({ display: "flex", alignItems: "center", gap: 12 });
const Mark = styled.div({
  display: "grid",
  gridTemplateColumns: "repeat(2, 10px)",
  gap: 4,
  span: { width: 10, height: 10, borderRadius: "50%", background: colors.blue },
  "span:nth-child(even)": { background: colors.red },
});
const Title = styled.h1({
  fontSize: "clamp(25px, 3vw, 34px)",
  letterSpacing: "-1.2px",
  fontWeight: 800,
  ["@media" + mobileQuery]: { fontSize: 24, letterSpacing: "-0.8px" },
});
const ProfileButton = styled.button({
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  border: 0,
  background: "transparent",
  padding: 4,
  minWidth: 44,
  minHeight: 44,
  borderRadius: "50%",
  cursor: "pointer",
});
const ProfileName = styled.span({
  maxWidth: 110,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: colors.ink,
  fontSize: 14,
});
const Profile = styled.div({
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontSize: 14,
});
const Avatar = styled.span({
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#dae5fb",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
  color: colors.board,
});

export const AppHeader = memo(function AppHeader({
  user,
  disabled,
  onSignOut,
  onProfile,
  mobile,
  activeView,
  onNavigate,
}: {
  user: User | null;
  disabled: boolean;
  onSignOut: () => Promise<unknown>;
  onProfile: () => void;
  mobile: boolean;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}) {
  return (
    <Header>
      <Brand>
        <Mark aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </Mark>
        <Title>Connect Four</Title>
      </Brand>
      {user && !mobile && (
        <DesktopNavigation active={activeView} onChange={onNavigate} />
      )}
      {user && (
        <Profile>
          <ProfileButton
            aria-label={"Open profile for " + user.name}
            onClick={onProfile}
          >
            <Avatar aria-hidden="true">
              {Array.from(user.name)[0]?.toUpperCase()}
            </Avatar>
            {!mobile && <ProfileName>{user.name}</ProfileName>}
          </ProfileButton>
          {!mobile && activeView !== "profile" && (
            <TextButton disabled={disabled} onClick={() => void onSignOut()}>
              Switch profile
            </TextButton>
          )}
        </Profile>
      )}
    </Header>
  );
});

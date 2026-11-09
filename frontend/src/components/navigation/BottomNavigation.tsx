import { memo } from "react";
import styled from "styled-components";
import { colors } from "../../styles/theme";
import { NavigationIcon } from "./NavigationIcon";
import { destinations } from "./destinations";
import type { AppView } from "./destinations";

const Navigation = styled.nav({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 30,
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  padding:
    "8px max(16px, env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
  background: colors.paper,
  borderTop: "1px solid " + colors.line,
  boxShadow: "0 -4px 18px #182b4d08",
});
const Tab = styled.button<{ $active: boolean }>((p) => ({
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: 3,
  minHeight: 52,
  border: 0,
  borderRadius: 12,
  padding: "5px 8px",
  background: p.$active ? "#eaf1ff" : "transparent",
  color: p.$active ? colors.blue : colors.muted,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
}));

export const BottomNavigation = memo(function BottomNavigation({
  active,
  onChange,
}: {
  active: AppView;
  onChange: (tab: AppView) => void;
}) {
  return (
    <Navigation aria-label="Main navigation">
      {destinations.map((destination) => (
        <Tab
          key={destination.id}
          type="button"
          aria-current={active === destination.id ? "page" : undefined}
          $active={active === destination.id}
          onClick={() => onChange(destination.id)}
        >
          <NavigationIcon destination={destination.id} />
          <span>{destination.label}</span>
        </Tab>
      ))}
    </Navigation>
  );
});

import { memo } from "react";
import styled from "styled-components";
import { colors } from "../../styles/theme";
import { destinations } from "./destinations";
import type { AppView } from "./destinations";

const Navigation = styled.nav({
  display: "flex",
  justifyContent: "center",
  gap: 4,
  padding: 4,
  border: "1px solid " + colors.line,
  borderRadius: 12,
  background: "#ffffff80",
});
const Link = styled.button<{ $active: boolean }>((p) => ({
  minHeight: 40,
  padding: "8px 16px",
  border: 0,
  borderRadius: 8,
  background: p.$active ? "#e4edff" : "transparent",
  color: p.$active ? colors.blue : colors.muted,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  "&:hover": { background: "#eaf1ff" },
}));

export const DesktopNavigation = memo(function DesktopNavigation({
  active,
  onChange,
}: {
  active: AppView;
  onChange: (view: AppView) => void;
}) {
  return (
    <Navigation aria-label="Main navigation">
      {destinations.map((destination) => (
        <Link
          key={destination.id}
          type="button"
          aria-current={active === destination.id ? "page" : undefined}
          $active={active === destination.id}
          onClick={() => onChange(destination.id)}
        >
          {destination.label}
        </Link>
      ))}
    </Navigation>
  );
});

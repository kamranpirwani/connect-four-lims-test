import styled from "styled-components";
import { colors, mobileQuery } from "../../styles/theme";

export const Button = styled.button<{ $secondary?: boolean }>((p) => ({
  border: "1px solid " + (p.$secondary ? colors.line : colors.blue),
  background: p.$secondary ? colors.paper : colors.blue,
  color: p.$secondary ? colors.ink : colors.paper,
  borderRadius: 9,
  padding: "10px 16px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  ["@media" + mobileQuery]: { minHeight: 44 },
  "&:hover:not(:disabled)": { filter: "brightness(0.95)" },
  "&:disabled": { opacity: 0.55 },
}));

export const TextButton = styled.button({
  border: 0,
  padding: "4px 0",
  background: "transparent",
  color: colors.muted,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
  fontSize: 13,
  ["@media" + mobileQuery]: { minHeight: 44, minWidth: 44 },
});

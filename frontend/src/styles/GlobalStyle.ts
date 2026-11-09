import { createGlobalStyle } from "styled-components";
import { colors } from "./theme";

export const GlobalStyle = createGlobalStyle({
  "*": { boxSizing: "border-box" },
  body: {
    margin: 0,
    background: colors.background,
    color: colors.ink,
    fontFamily: '"Avenir Next", "Trebuchet MS", sans-serif',
    lineHeight: 1.5,
    minHeight: "100dvh",
  },
  "button, input": { font: "inherit" },
  button: { touchAction: "manipulation" },
  "button, a, input": {
    "&:focus-visible": {
      outline: "3px solid " + colors.blue,
      outlineOffset: 4,
    },
  },
  "button:disabled": { cursor: "not-allowed" },
  "h1, h2, h3, p": { margin: 0 },
  "@media (prefers-reduced-motion: reduce)": {
    "*, *::before, *::after": {
      animationDuration: "0.01ms !important",
      transitionDuration: "0.01ms !important",
    },
  },
});

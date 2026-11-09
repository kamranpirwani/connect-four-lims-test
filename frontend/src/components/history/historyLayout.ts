export const historyGrid = {
  display: "grid",
  gridTemplateColumns: "28px 24px minmax(38px, 1fr) minmax(55px, 96px) 64px",
  gap: 8,
  alignItems: "center",
  "@media(max-width: 420px)": {
    gridTemplateColumns: "24px 24px 1fr 68px",
    gap: 6,
  },
} as const;

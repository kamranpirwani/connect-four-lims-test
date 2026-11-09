export const destinations = [
  { id: "play", label: "Play" },
  { id: "games", label: "Games" },
  { id: "profile", label: "Profile" },
] as const;

export type AppView = (typeof destinations)[number]["id"];

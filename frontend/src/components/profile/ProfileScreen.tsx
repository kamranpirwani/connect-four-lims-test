import { useMemo } from "react";
import styled from "styled-components";
import type { GameSummary, User } from "../../schemas";
import { gameStats } from "../../gameStats";
import { colors } from "../../styles/theme";
import { Button } from "../common/Button";
import { Panel } from "../common/Panel";
import { SectionTitle, Subtle } from "../common/Typography";

const Stack = styled.div({
  display: "grid",
  gap: 18,
  "@media(min-width: 851px)": {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
});
const Identity = styled.div({
  display: "flex",
  alignItems: "center",
  gap: 16,
  marginBottom: 6,
  gridColumn: "1 / -1",
  h2: { fontSize: 28, letterSpacing: "-0.8px", overflowWrap: "anywhere" },
});
const Avatar = styled.span({
  width: 58,
  height: 58,
  flexShrink: 0,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "#dae5fb",
  color: colors.board,
  fontSize: 25,
  fontWeight: 800,
});
const Totals = styled.dl({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  margin: 0,
  padding: "6px 0",
  "div + div": { borderLeft: "1px solid " + colors.line, paddingLeft: 22 },
  dt: { color: colors.muted, fontSize: 13 },
  dd: {
    margin: "2px 0 0",
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: "-1px",
    lineHeight: 1.2,
  },
});
const Results = styled.dl({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
  margin: "18px 0 0",
  dt: { color: colors.muted, fontSize: 12 },
  dd: { margin: "3px 0 0", fontSize: 26, fontWeight: 800 },
});
const ResultBar = styled.div({
  display: "flex",
  height: 12,
  overflow: "hidden",
  borderRadius: 8,
  background: "#e4eaf3",
  marginTop: 18,
});
const Segment = styled.span<{ $count: number; $color: string }>((p) => ({
  flexGrow: p.$count,
  background: p.$color,
}));
const Details = styled.dl({
  display: "grid",
  gap: 12,
  margin: "20px 0 0",
  div: { display: "flex", justifyContent: "space-between", gap: 12 },
  dt: { color: colors.muted, fontSize: 14 },
  dd: { margin: 0, fontWeight: 700 },
});
const FullButton = styled(Button)({ width: "100%", minHeight: 46 });
const StatsNote = styled(Subtle)({ gridColumn: "1 / -1" });

export function ProfileScreen({
  user,
  games,
  busy,
  onSignOut,
  onGames,
}: {
  user: User;
  games: GameSummary[];
  busy: boolean;
  onSignOut: () => Promise<unknown>;
  onGames: () => void;
}) {
  const stats = useMemo(() => gameStats(games), [games]);
  return (
    <Stack>
      <Identity>
        <Avatar aria-hidden="true">
          {Array.from(user.name)[0]?.toUpperCase()}
        </Avatar>
        <div>
          <Subtle>Your profile</Subtle>
          <h2>{user.name}</h2>
        </div>
      </Identity>
      <Panel>
        <Totals aria-label="Your activity">
          <div>
            <dt>Games played</dt>
            <dd>{stats.played}</dd>
          </div>
          <div>
            <dt>Total moves</dt>
            <dd>{stats.moves}</dd>
          </div>
        </Totals>
        <Details>
          <div>
            <dt>Saved games</dt>
            <dd>{stats.saved}</dd>
          </div>
          <div>
            <dt>Open games</dt>
            <dd>{stats.open}</dd>
          </div>
          <div>
            <dt>Finished games</dt>
            <dd>{stats.completed}</dd>
          </div>
        </Details>
      </Panel>
      <Panel>
        <SectionTitle>Game results</SectionTitle>
        <Subtle style={{ marginTop: 6 }}>
          You play both colors. Results are counted by color.
        </Subtle>
        <ResultBar
          role="img"
          aria-label={
            stats.blueWins +
            " Blue wins, " +
            stats.redWins +
            " Red wins, " +
            stats.draws +
            " draws"
          }
        >
          <Segment $count={stats.blueWins} $color={colors.blue} />
          <Segment $count={stats.redWins} $color={colors.red} />
          <Segment $count={stats.draws} $color="#9aa8bf" />
        </ResultBar>
        <Results>
          <div>
            <dt>Blue wins</dt>
            <dd style={{ color: colors.blue }}>{stats.blueWins}</dd>
          </div>
          <div>
            <dt>Red wins</dt>
            <dd style={{ color: colors.red }}>{stats.redWins}</dd>
          </div>
          <div>
            <dt>Draws</dt>
            <dd>{stats.draws}</dd>
          </div>
        </Results>
        {!stats.completed && (
          <Subtle style={{ marginTop: 14 }}>
            Finish a game to see results here.
          </Subtle>
        )}
      </Panel>
      <StatsNote>Stats reflect the games in your history.</StatsNote>
      <FullButton $secondary onClick={onGames}>
        View your games
      </FullButton>
      <FullButton $secondary disabled={busy} onClick={() => void onSignOut()}>
        Switch profile
      </FullButton>
    </Stack>
  );
}

import { useState } from "react";
import type { FormEvent } from "react";
import styled from "styled-components";
import { colors } from "../../styles/theme";
import { Button } from "../common/Button";
import { Panel } from "../common/Panel";
import { Subtle } from "../common/Typography";

const Screen = styled.section({
  minHeight: "65vh",
  display: "grid",
  placeItems: "center",
});
const Card = styled(Panel)({
  width: "100%",
  maxWidth: 480,
  padding: 42,
  display: "grid",
  gap: 22,
  h2: { fontSize: 32, lineHeight: 1.2, letterSpacing: "-1px" },
  form: { display: "grid", gap: 12 },
  label: { fontWeight: 700, fontSize: 14 },
  "@media(max-width: 500px)": { padding: 28 },
});
const Input = styled.input({
  width: "100%",
  border: "1px solid #b6c3d8",
  borderRadius: 8,
  padding: "12px 14px",
  background: colors.paper,
  color: colors.ink,
  fontSize: 16,
});

export function NameEntry({
  pending,
  onSignIn,
}: {
  pending: boolean;
  onSignIn: (name: string) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    void onSignIn(name);
  }
  return (
    <Screen>
      <Card>
        <h2>
          Pick a name.
          <br />
          Start a game.
        </h2>
        <Subtle>
          Play both colors on one screen. Your game opens as soon as you’re
          ready.
        </Subtle>
        <form onSubmit={submit}>
          <label htmlFor="player-name">Your name</label>
          <Input
            id="player-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            autoComplete="nickname"
            placeholder="Enter your name"
            required
            disabled={pending}
          />
          <Button type="submit" disabled={pending || !name.trim()}>
            {pending ? "Opening your game…" : "Start playing"}
          </Button>
        </form>
        <Subtle>
          A name is your profile for this demo. Use the same name to find your
          games again.
        </Subtle>
      </Card>
    </Screen>
  );
}

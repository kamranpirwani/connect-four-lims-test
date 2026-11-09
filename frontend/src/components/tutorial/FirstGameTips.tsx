import styled from "styled-components";
import { colors } from "../../styles/theme";
import { TextButton } from "../common/Button";

const Tip = styled.aside({
  position: "sticky",
  top: 12,
  zIndex: 2,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 16,
  background: colors.tip,
  border: "1px solid #ecd99f",
  borderRadius: 10,
  padding: "12px 14px",
  marginTop: 18,
  minHeight: 86,
  p: { fontSize: 13, color: colors.muted, marginTop: 3 },
  strong: { fontSize: 14 },
});
const Copy = styled.div({ maxWidth: 520 });
const Step = styled.span({
  fontSize: 11,
  color: colors.muted,
  marginLeft: 8,
  whiteSpace: "nowrap",
});

const tips = [
  {
    title: "Start with Blue",
    text: "Choose any column. Your chip drops to the lowest open space.",
  },
  {
    title: "Now it’s Red’s turn",
    text: "See where blue landed? Try the same column to stack red on top.",
  },
  {
    title: "Four in a row wins",
    text: "Keep taking turns. Connect four of your color across, vertically, or diagonally.",
  },
];

export function FirstGameTips({
  step,
  onDismiss,
}: {
  step: number;
  onDismiss: () => void;
}) {
  const tip = tips[step];
  if (!tip) return null;
  return (
    <Tip id="first-game-tip" aria-label="Quick guide" aria-live="polite">
      <Copy>
        <strong>{tip.title}</strong>
        <Step>{step + 1} of 3</Step>
        <p>{tip.text}</p>
      </Copy>
      <TextButton onClick={onDismiss}>
        {step === 2 ? "Got it" : "Skip tips"}
      </TextButton>
    </Tip>
  );
}

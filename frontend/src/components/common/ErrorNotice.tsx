import styled from "styled-components";
import { Button } from "./Button";

const Notice = styled.div({
  background: "#fff5ed",
  border: "1px solid #eac5a8",
  borderRadius: 10,
  padding: "12px 16px",
  marginBottom: 20,
  color: "#7d3918",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  fontSize: 14,
});

export function ErrorNotice({
  message,
  onRefresh,
  refreshing,
}: {
  message: string;
  onRefresh?: () => Promise<unknown>;
  refreshing: boolean;
}) {
  return (
    <Notice role="alert">
      <span>{message}</span>
      {onRefresh && (
        <Button
          $secondary
          disabled={refreshing}
          onClick={() => void onRefresh()}
        >
          Refresh games
        </Button>
      )}
    </Notice>
  );
}

import styled from "styled-components";
import { colors } from "../../styles/theme";

export const Panel = styled.section({
  background: colors.paper,
  borderRadius: 16,
  border: "1px solid " + colors.line,
  padding: 24,
  "@media(max-width: 500px)": { padding: 18 },
});

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";
import { colors } from "../../styles/theme";

const enter = keyframes({
  from: { transform: "translateY(20%)", opacity: 0 },
  to: { transform: "translateY(0)", opacity: 1 },
});
const Dialog = styled.dialog(
  {
    position: "fixed",
    inset: "auto 0 0",
    margin: 0,
    width: "100%",
    maxWidth: "none",
    maxHeight: "min(80dvh, 720px)",
    padding:
      "0 max(18px, env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left))",
    border: 0,
    borderRadius: "22px 22px 0 0",
    background: colors.paper,
    color: colors.ink,
    boxShadow: "0 -12px 40px #12234125",
    overflow: "auto",
    overscrollBehavior: "contain",
    "&::backdrop": { background: "#12234170" },
  },
  css`
    animation: ${enter} 180ms ease-out;
  `,
);
const Header = styled.header({
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: colors.paper,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 0 10px",
  h2: { fontSize: 20, letterSpacing: "-0.4px" },
});
const CloseButton = styled.button({
  display: "grid",
  placeItems: "center",
  minWidth: 44,
  minHeight: 44,
  border: 0,
  borderRadius: "50%",
  background: "#edf2f8",
  color: colors.ink,
  cursor: "pointer",
});

export function BottomSheet({
  title,
  onDismiss,
  children,
}: {
  title: string;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current!;
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    element
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, []);

  return (
    <Dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientY < bounds.top ||
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY > bounds.bottom
        )
          onDismiss();
      }}
    >
      <Header>
        <h2 id={titleId}>{title}</h2>
        <CloseButton
          type="button"
          aria-label={"Close " + title.toLowerCase()}
          onClick={onDismiss}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </CloseButton>
      </Header>
      {children}
    </Dialog>
  );
}

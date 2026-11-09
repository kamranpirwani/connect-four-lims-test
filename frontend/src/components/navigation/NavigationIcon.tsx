import type { AppView } from "./destinations";

export function NavigationIcon({ destination }: { destination: AppView }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {destination === "play" ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          {[8, 16].flatMap((x) =>
            [8, 16].map((y) => (
              <circle key={x + ":" + y} cx={x} cy={y} r="1.7" />
            )),
          )}
        </>
      ) : destination === "games" ? (
        <>
          <rect x="4" y="6" width="16" height="15" rx="3" />
          <path d="M8 3h8M8 11h8M8 16h5" />
        </>
      ) : (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </>
      )}
    </svg>
  );
}

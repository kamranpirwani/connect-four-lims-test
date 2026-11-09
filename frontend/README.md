# Frontend

React, TypeScript, Styled Components, React Query, and Zod.

## Run and verify

Use Node 24.15+ (24.x) or 26+. From this directory:

```sh
npm install
npm run dev
npm test
npm run build
```

The frontend uses port 5173 and forwards API calls to port 8080.
Set `API_PROXY_TARGET` when running the backend on a different port.

## UI structure

`App.tsx` composes the screen. Feature components own their markup and local
styles instead of sharing one large styled-component file:

- `components/auth/NameEntry.tsx`: name entry and its form state.
- `components/layout/AppHeader.tsx`: branding and profile switching.
- `components/games/`: saved-game sidebar and individual saved-game rows.
- `components/game/`: game workspace, status, board and history composition.
- `components/board/`: board layout, clickable columns and individual cells.
- `components/history/`: ordered move entries and column markers.
- `components/tutorial/`: the short first-play guide.
- `components/navigation/`: the mobile Play, Games, and Profile tab bar.
- `components/navigation/DesktopNavigation.tsx`: the same destinations in the desktop header.
- `components/profile/`: activity totals and shared-play color results.
- `components/common/` and `styles/`: small shared controls and theme tokens.

`hooks/useGameSession.ts` coordinates queries, mutations and initial game
selection. `hooks/useFirstGameTutorial.ts` owns persisted tutorial progress.
`api.ts` handles HTTP and `schemas.ts` validates responses and derives types.

## State and interaction

After name entry, a profile with no games receives one new game automatically.
A returning profile opens its last selected game, or its most recent game if no
selection is saved. Completed games stay visible and offer “Play a new game.”
Initial creation is guarded against repeated effects in React Strict Mode.
An uncertain create response is recovered by reading the saved games.

At phone and tablet widths, Play keeps the board on its own screen. Games is a
separate lobby with All/Open/Finished filters, and Profile shows saved activity.
Changing tabs keeps the current board and local inspection state mounted. The
avatar also opens Profile. Touch controls and fixed navigation respect mobile
safe areas; the desktop layout keeps its sidebar and inline history.

Desktop has the same Play, Games, and Profile destinations in its header, plus
profile access through the name/avatar. Games and Profile reuse the mobile
screens with wider layouts. Switching views preserves the active board, and
the selected view carries across responsive breakpoints.

Server data lives in React Query. Accepted moves update both the game and its
saved-game summary from the returned response. The sidebar does not refetch,
reorder or disable all its controls during each move. Rows have stable keys and
memoized components; only a changed saved-game summary needs to update.

Loading states belong to the action that is running. A pending board move
disables that board, while other games can still be opened. Deletion waits for
an outstanding move on the same game. Reads are cancelled around writes to
prevent stale responses from replacing newer state.

History shows the latest move first, with move numbers, player colors and a
column marker. Selecting an entry highlights its saved position on the board;
it does not change game state. Offscreen highlighted chips are brought into
view, respecting reduced-motion preferences.

On mobile, the Moves control opens history in a bottom sheet using a native
HTML dialog. Background scrolling is locked while it is open. Close, Escape,
backdrop selection, or choosing a move dismisses it; focus returns to the Moves
control. Changing to desktop closes the sheet and restores the inline history.

Profile totals come from the existing React Query game summaries. “Games
played” counts games with at least one accepted move; “Total moves” sums saved
move counts. Blue wins, Red wins and draws are game outcomes, since one profile
controls both colors. Deleting a game removes it from these totals. Personal
win/loss rankings and a leaderboard are deferred until player ownership is
defined.

The non-blocking first-play guide explains gravity after the first accepted
move, turns/stacking next, and then the four-in-a-row goal. Progress and dismissal
are saved per profile in browser storage. Failed moves do not advance it.
Established profiles with existing moves are not put through the guide again.

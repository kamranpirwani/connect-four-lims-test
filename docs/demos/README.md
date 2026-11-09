# App demos

These looping GIFs are recordings of the running local app, using separate demo
profiles and real, server-accepted moves. They show the shared-play experience;
rooms, online opponents, and chat are future work.

| Asset | Recording viewport | GIF dimensions | What it shows |
|---|---|---|---|
| [Desktop](desktop.gif) | 1000 × 900 | 900 × 810 | Name entry, tutorial, seven-move Blue win, history inspection, profile, games |
| [Mobile](mobile.gif) | 390 × 844 | 390 × 844 | Name entry, tutorial, seven-move Blue win, history sheet, chip highlight, Games/Profile tabs |

To refresh the demos after a UI change:

1. Run the frontend and backend with an isolated demo profile or database.
2. Capture the app at the viewport sizes above. Enter a name and play columns
   **4, 4, 3, 7, 2, 7, 1** to demonstrate gravity and a Blue horizontal win.
3. On desktop, inspect move 1 and visit Profile and Games. On mobile, open Moves,
   select move 1, then visit Games and Profile.
4. Export a looping GIF at 10 frames per second, with short pauses for the guide
   and each destination. Keep text readable and review the first frame, winning
   board, move history, and profile before replacing these files.

The desktop export is scaled to 900 pixels wide; the mobile export retains its
recorded size. Media stays in this directory and is embedded with repository
paths in the root README.

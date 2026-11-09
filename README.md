# Connect Four take-home

Thank you for taking the Confident LIMS engineering exercise. You will build a small
Connect Four game:

1. **Stage 1 (2 hours at most):** a basic React frontend and a basic Python backend with only
   one endpoint, written by hand with no AI.
2. **Stage 2 (about 1 hour suggested):** improve your project with an AI coding agent of your choice,
   and write down what you would do next with more time.

**Time.** Stage 1 has a limit of **2 hours** and no minimum: stop early if you're done. It
runs from when you click **Start my Stage 1 time** in our form to when you submit your Stage 1
commit later in the same form, including setup and any breaks, so plan to do it in one
sitting. When you reach 2 hours, commit, tag and submit what you have, even if it's
unfinished. Stage 2 runs from your
Stage 1 submission to your Stage 2 submission; it has no minimum or maximum, and we suggest
about an hour.

**What we value.** We prefer a small amount of excellent work to a large amount of rough
work. Work that is bug-free, thoughtful, clean and tested scores higher than extra features.

**Who grades it.** People review and grade your work. We also use AI to scan your code for
security risks and to write review notes that our reviewers read alongside your code; it never
sets your score.

Our email to you contains **your personal Zoom link**, used to record Stage 1, and the link
to our **form**. You go through the form once, from start to finish: clicking **Start my
Stage 1 time** shows you this page, and later steps in the same form are where you submit
your Stage 1 commit and then your Stage 2 commit. Keep the form open in a browser tab (if you
close it, reopen the link in the same browser to continue where you left off), and please
don't share your Zoom link.

## Setup (about 10 minutes)

1. Click **Use this template** at the top of this page and create a **private** repo in your
   own GitHub account. Keep `connect-four` in the repo name (for example `connect-four`):
   our grading account accepts invitations only to repos named that way.
2. Invite our reviewers **@salbarran**, **@KN3LL2K**, **@eatpie75** and **@JosephChou124**,
   and our grading account **@confident-interview-bot**, as collaborators
   (**Settings → Collaborators → Add people**). GitHub gives collaborators on a personal repo
   write access; we only read your code and never push to it.
3. Clone your repo and check that both apps run (commands below). Keep these install, run
   and test commands working: we use them to run and test your code.
4. Install the free [Zoom desktop app](https://zoom.us/download) if you don't have it. You
   don't need a Zoom account. Use the app rather than joining from a web browser: screen
   sharing is more reliable there. On a Mac, the first time you share, macOS asks you to
   allow Zoom under **System Settings → Privacy & Security → Screen & System Audio
   Recording**; turn it on and restart Zoom.

You need [Node.js](https://nodejs.org/) 20 or newer and [Python](https://www.python.org/) 3.10
or newer.

| Folder | Install | Run | Test |
|---|---|---|---|
| `frontend/` | `npm install` | `npm run dev` (http://localhost:5173) | `npm test` |
| `backend/` | `pip install -r requirements.txt` | `uvicorn main:app --port 8080` | `pytest` |

We suggest a virtual environment for the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8080
```

The frontend dev server forwards requests for `/evaluate_board_state` to
`http://localhost:8080`, so the browser can call the backend without any CORS setup. Call it
with a relative URL, for example `fetch("/evaluate_board_state", ...)`.

## Rules

- **Stage 1 must be your own code, with no AI and no help from other people.** Do not use AI
  assistants, AI code completion or AI chat, and don't ask anyone for help. To be safe, turn
  off AI features in your code editor and your browser before you start. You may search the
  web and read documentation (for example the React, FastAPI or MDN docs), but skip any
  AI-generated answers, such as AI summaries at the top of search results.
- **Record all of Stage 1 on your personal Zoom link.** The recording is how you show that
  you wrote Stage 1 without AI. Recording starts on its own as soon as you join, so get your
  desktop ready first: close anything private and open what you'll need. Then join the link
  and share your **entire screen** (not a single window): click **Share** (the green
  **up-arrow ↑** button) in the toolbar at the bottom of the Zoom window, choose your whole
  screen (shown as **Screen** or **Desktop**), then click **Share**. Recording starts
  automatically and is saved to our account; there is nothing to upload. You don't need to turn
  on your camera or microphone. To take a break, leave the meeting and rejoin the same link
  (your Stage 1 time keeps running). End Stage 1 by running `git log --oneline -3` on
  screen (see *Commits and tags*), then leave the meeting and submit your Stage 1 commit in the
  form right away. You don't need to record Stage 2.
- **Stage 1 is limited to 2 hours**, from **Start my Stage 1 time** to your Stage 1 submission.
  Breaks count. At 2 hours, stop, make your final commit and tag (see *Commits and tags*) and
  submit, even if the game is unfinished.
- **Commit as you go**, at least every 30 minutes, and push to your repo.
- At the technical interview you'll walk us through your Stage 1 code and make a small change
  to it without AI.
- In Stage 2, use any AI tool with your own account. Do not connect it to any employer or
  company systems, repos or data.
- Keep your repo private.

## Commits and tags

Your git history tells us which code is hand-coded and which is AI-assisted, so please follow
these steps exactly:

1. Start every Stage 1 commit message with `stage1:`.
2. When Stage 1 is done, make your final hand-coded commit, tag it and push:

   ```bash
   git add .
   git commit --allow-empty -m "stage1: FINAL hand-coded submission"
   git tag stage1-final
   git push origin main stage1-final
   git log --oneline -3   # show this on the Zoom recording, then leave the meeting
   ```

   Then go back to the form and submit the commit right away (**Submit my Stage 1 commit**).
   This ends your Stage 1 time and starts Stage 2.

3. Start every Stage 2 commit message with `stage2:`, and when you are done:

   ```bash
   git tag stage2-final
   git push origin main stage2-final
   ```

   Then submit the commit in the form right away (**Submit my Stage 2 commit**). This finishes
   the form.

We compare each submission with your commit and tag push times on GitHub, so submit within a
few minutes of pushing.

Do not rewrite history after tagging `stage1-final` (no rebase, amend or force-push).

## Stage 1: Connect Four (hand-coded, no AI)

Build a Connect Four game that you can play in the browser, with a React frontend in
`frontend/` and a Python backend in `backend/`. If you aren't familiar with the game, see the
[rules](http://mathworld.wolfram.com/Connect-Four.html) and this
[video](https://www.youtube.com/watch?v=H3FYRM9a0i4).

### Frontend

- The board has 6 rows and 7 columns.
- One person plays both colors on one screen: blue (player 1) and red (player 2). Blue always
  goes first, and the players take turns.
- A chip dropped in a column lands in the lowest open slot. A full column takes no more chips.
- Chips need not be circular and the board need not be realistic, but use simple, intuitive
  graphics.
- **After every move, the frontend sends the board to the backend** and uses the response to
  show whose turn it is, the winner and the winning chips, or a draw. Play stops when the game
  is over. If the backend rejects the board, show the error.
- No saved state is needed; losing the game on refresh is fine. You may use any libraries.

### Backend

A simple server in Python with a single API call that evaluates the board. No database is
needed. Use port `8080`. We will run tests against your server.

**POST** `/evaluate_board_state`

It accepts a game state as JSON:

- `0` is an empty slot
- `1` is a blue piece (player 1)
- `2` is a red piece (player 2)

```json
{
    "board": [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0],
        [0, 0, 0, 2, 1, 1, 0],
        [0, 0, 0, 1, 1, 2, 0]
    ]
}
```

The route handler should:

- Validate the request body and return errors accordingly.
- Evaluate the board: whether the game is in progress (and whose turn it is), won (by whom,
  and which pieces form the win) or drawn, or whether the board is impossible under the rules.

You choose the response format.

Game rules:

- Blue (player 1) always goes first.
- A win occurs when at least 4 pieces of the same color appear in at least one horizontal row,
  vertical column, or diagonal.
- A draw occurs when the board is filled with pieces and there are no rows, columns or
  diagonals with 4 or more consecutive pieces of the same color.

**Write the code as if you were opening a pull request for a colleague to review.** Add a
short section to this README on how to run the app and its tests. Within the time available,
favor a working game over an unfinished one.

### What we look for

- [ ] a game that works without bugs
- [ ] a clear, usable, and visually appealing UI
- [ ] correct, robust board evaluation that handles edge cases
- [ ] useful API responses
- [ ] sensible structure, with game logic separate from request handling
- [ ] clean, readable code
- [ ] tests

## Stage 2: improve it with AI (about 1 hour suggested)

Use an AI coding agent of your choice to improve anything you like in your Stage 1 project.
You decide what matters most.

An hour is a guide, not a limit: spend more or less as you see fit. You don't need to do
everything you can think of. Put whatever you would do with more time in your next-steps
document instead.

- Start every commit message with `stage2:` and tag your last commit `stage2-final`.
- Save and commit the complete, unedited AI session transcripts in `ai-transcripts/` as
  human-readable Markdown or text files (see *Exporting AI transcripts* below).
- Add a few lines to this README under a **Stage 2** heading describing what you changed and
  why.
- Commit a `NEXT_STEPS.md` describing what you would do if you had more time (UI/UX
  improvements, new features, bug fixes, infrastructure, etc.).

### What we look for

- [ ] good choices about what to improve
- [ ] work that is correct and verified
- [ ] effective use of the AI agent (good context, reviewing and testing its output, and
  catching its mistakes)
- [ ] thoughtful and self-aware suggestions for further work if given more time

### Exporting AI transcripts

We read your transcripts, so they must be human-readable: Markdown (`.md`) or plain text
(`.txt`), one file per session, numbered in order (for example `01-hover-preview.md`).
Include every prompt and every response, in order, without editing. Only remove secrets
such as API keys.

Do not commit raw session logs (`.jsonl` or `.json` files, such as those under
`~/.claude/projects/` or `~/.codex/sessions/`). We can't read them.

- **Claude Code:** run `/export` at the end of each session, choose to save it to a file,
  and move the file into `ai-transcripts/`.
- **Codex (CLI, IDE extension or app):** use its Markdown export if your version has one;
  otherwise select the whole conversation, copy it and paste it into a Markdown file.
- **Cursor:** use the chat's **Export chat** option to save it as Markdown.
- **GitHub Copilot Chat (VS Code):** right-click in the chat and choose **Copy All**, then
  paste into a Markdown file. (**Chat: Export Chat...** saves JSON, which we can't read.)
- **Any other tool:** use its Markdown or text export, or copy and paste the full
  conversation into a Markdown file.

Before you commit, open each file and check that you can read the conversation.

## Submit

Both submissions are later steps in the form you started, not new forms. Keep it open, or
reopen the link in the same browser to pick up where you left off:

1. **Submit my Stage 1 commit**, right after you push `stage1-final`: your repo URL, the
   `stage1-final` commit ID, and a statement that Stage 1 is your own work without AI.
2. **Submit my Stage 2 commit**, right after you push `stage2-final`: the `stage2-final` commit
   ID and any notes for us.

To get a commit ID, run `git rev-parse 'stage1-final^{commit}'` (or `stage2-final`) and paste
what it prints. The short ID from `git log --oneline` (for example `3f2c1ab`) works too.

**Use the same email address you used in your job application.** We use it to match your
submissions to your application, and your Zoom recording is attached to your application
automatically.

Questions? Reply to the email we sent you.

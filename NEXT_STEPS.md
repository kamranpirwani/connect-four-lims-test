# Next steps

The current release supports persistent, shared play: one profile controls both
colors. These are future improvements, in proposed product priority order.
Authentication and security controls are prerequisites for opening online play
to other users.

1. **Online play with rooms and player colors.** Introduce real accounts and
   explicit game membership. Let players create or join a room, choose Blue or
   Red without both claiming the same side, and start when both are ready.
   Authorize each move against the signed-in player's assigned color and turn.
   Define room capacity, leaving, reconnecting, and abandoned-game behavior.

2. **Real-time game updates through WebSockets.** Keep the server authoritative
   for moves and results. Broadcast committed, versioned game changes and player
   presence to the room; use the REST API to retrieve a fresh snapshot after a
   disconnect or a missed event. Add connection status and reconnect feedback,
   and prevent duplicate or out-of-order events from changing the board twice.

3. **Lobby and opponent chat.** Add a shared lobby for meeting other players
   and room-scoped chat for conversation and friendly banter during a game.
   Use WebSockets for delivery, with message limits, safe text rendering,
   reporting, muting/blocking, and a clear message-retention policy. Check room
   membership before delivering private game messages.

4. **Production security and fair play.** Serve the API over HTTPS and live
   connections over WSS to encrypt traffic. Enforce authentication, ownership,
   room membership, allowed origins, and message validation on every relevant
   request or event. Retain server-side gravity, turn, win, and version checks;
   add rate limits, abuse monitoring, and idempotency keys before enabling
   automatic write retries. Encryption protects traffic; preventing illegal
   moves also requires these server checks. Use the
   [OWASP WebSocket security checklist](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)
   when implementing the live transport.

5. **Personal results and a leaderboard.** Once each account is assigned a
   side, track personal wins, losses, and draws and define ranking rules for
   disconnects, forfeits, and repeat opponents. Until then, keep the current
   shared-play totals and Blue/Red outcomes; a winning board does not identify
   a personal winner in the current model.

6. **History replay and UI refinement.** Use the ordered move records to step
   through a completed game. Review spacing, colors, animation timing,
   keyboard interaction, and screen-reader announcements on real desktop and
   mobile devices. Keep creating a new game as the way to play again, so past
   games retain their own history.

7. **Persistence and deployment.** Add Alembic migrations before changing the
   stored schema for rooms or accounts. Paginate game history as it grows and
   establish tested backup and restore procedures. Evaluate PostgreSQL and its
   transaction behavior for a larger multi-user deployment; the current
   repository and connection setup target SQLite. Add operational health checks,
   error monitoring, and deployment configuration before a public release.

8. **Automated delivery and regression checks.** Add CI for backend tests,
   formatting, frontend tests, and production builds. Maintain browser
   end-to-end tests against the real frontend/backend, including refresh,
   reconnect, competing moves, and authorization, plus automated accessibility
   checks. Current frontend integration tests mock HTTP responses; backend
   tests use real SQLite, including restart and concurrency scenarios. Keep
   Python/Node pins and lockfiles updated with tested dependency versions.

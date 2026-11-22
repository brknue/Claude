# Simple Chess

A full chess site in a plain hand-made look: white, black and grey only, no effects, no emojis.

**Play:** https://brknue.github.io/Claude/simplechess/

Features: Stockfish 17 at any Elo (100–3200), every chess variant and the party variants (4-player chess, kung fu chess …), friend links, online matchmaking, accounts with ratings, friends, chat, daily games, notifications, game review with accuracy and brilliant moves, 3,800+ openings, rated puzzles, daily and weekly puzzles, board editor, 20 languages, works offline and installs on the Home Screen.

- Fully independent: its own account server, accounts, ratings, friends and online matchmaking. Database setup: `source/supabase/setup-all.sql`, then `finish-admin.sql`.
- Its own settings, puzzle progress and saved games in the browser.
- The look: `source/src/plain.css`, loaded after the main stylesheet.

Released under GPLv3 (it bundles Stockfish).

# Rookstorm

Chess website in 20 languages: play Stockfish 17 at any Elo and every chess variant, play friends and strangers online, review games, learn openings and solve endless puzzles. Works on phone, tablet and computer, has dark and light mode, and installs as an app that works offline.

**Play:** https://brknue.github.io/Claude/rookstorm/

**Android app:** Settings → Install the Android app, or [rookstorm.apk](https://brknue.github.io/Claude/rookstorm/rookstorm.apk) (free, not from the Play Store: Android asks you to allow installing it). It opens the live site full screen, so app players and website players are matched with each other and the app updates together with the site. Version 2 adds native notifications for messages, challenges and daily games, also while the app is closed. **iPhone / iPad app:** free from Safari: Share → Add to Home Screen (step-by-step guide at `#/app`). It gets its own icon, opens full screen like an app, works offline, plays with website and Android players, and can show notifications (iOS 16.4+). An App Store version would need Apple's paid developer program.

## Features

- **Bot at any Elo (100–3200).** Type a rating. From 1320 up, Stockfish's calibrated `UCI_Elo` limiter is used; below that, a human-like error model picks among Stockfish's top lines. 3200 is full strength. Standard and Chess960.
- **Party variants (17 more):** 4-Player Chess, 4-Player Teams, 4-Player Kung Fu Chess, Kung Fu Chess (real time, three speeds), Fog of War, Duck Chess, Dice Chess, Double-Move, Progressive, Monster, Knightmate, Extinction, Capture the King, Pawn Wars, Torpedo, Mini Chess 5×5 and Los Alamos 6×6. Duck, Double-Move, Progressive, Monster, Knightmate, Torpedo, the two small boards and both 4-player modes use normal check rules (checkmate wins, stalemate draws, 50-move rule); the others keep their own win rule (capture the king, extinction, promotion). Play them against the computer or at a **party table**: share one link, up to 4 friends open it and pick their seat, empty seats can be given to the computer. The host's browser runs the game (`source/src/arcade/`), so no server is needed.
- **Time controls:** bullet, blitz, rapid, classical, unlimited or any custom minutes + increment.
- **Variants:** Standard, Chess960, Crazyhouse, King of the Hill, Three-check, Atomic, Antichess, Horde, Racing Kings — all playable against the computer, a friend or online. Stockfish plays Standard and Chess960; the others use Rookstorm's own variant engine (`src/vsearch.ts`, approximate strength).
- **Same device:** pass-and-play with automatic board flipping.
- **Friend link:** create a game, send the link (message, AirDrop, anything) or a short game code, and play in real time with clocks, chat, draw offers, takeback requests and rematches. If a phone drops the connection (e.g. switching apps), the game reconnects.
- **Online:** get paired with the next player searching the same variant and time control; takeback requests work here too.
- **Premoves:** queue as many premoves as you like while the opponent thinks; they play one after another, and if one becomes illegal the whole queue is cleared. Right-click or the ✕ button clears them; one switch under the move list turns premoves on or off. In friend games the host can untick "Infinite premoves" to allow only one premove; online games always allow unlimited.
- **Capture points:** optional (Settings → Game): taking a piece pops up +3 / +5 …, losing one shows −3.
- **20 languages:** English, Deutsch, Türkçe, Español, Français, Italiano, Português, Nederlands, Polski, Svenska, Русский, Українська, العربية, فارسی, हिन्दी, 中文, 日本語, 한국어, Bahasa Indonesia, Tiếng Việt (Settings → Language; Arabic and Persian right-to-left).
- **Game review:** accuracy per player and every move classified (Brilliant, Great, Best, Excellent, Good, Book, Inaccuracy, Mistake, Miss, Blunder), with the best move shown, a badge on the piece that moved, an estimated game rating per player, an evaluation graph and an eval bar. Import any PGN or FEN.
- **Board editor:** set up any position and get Stockfish's best move and top 3 lines.
- **Openings:** all 3,865 named openings and variations from the Lichess database: search, browse families, explore book moves from any position, and drill lines as White or Black.
- **Puzzles:** 27,000 rated Lichess puzzles from 400 to 3000, picked near your puzzle rating, which goes up and down as you solve. 30 themes and a Streak mode.
- **Daily and weekly puzzles:** a new ultra-hard daily puzzle every day (rated 2750+) and the hardest puzzles in the collection every week (about 2900–3000, long lines, one try). No hints; only the first try on the puzzle's own day/week counts and shows on the profile. A calendar lets you replay past puzzles as practice, with the solution.

## How it works

- Static site, no server of its own. Hash routing, so any static host works.
- Engine: Stockfish 17.1 lite, single-threaded WebAssembly (no special server headers needed). Browsers without WebAssembly SIMD (e.g. iPads before iOS 16.4) automatically get Stockfish's pure-JavaScript build (`engine/sf-asm.js`, downloaded only when needed).
- Offline: a service worker caches everything (about 11 MB), including the engine and all puzzles.
- Friend and online games run peer-to-peer over WebRTC through the free PeerJS signalling server (`0.peerjs.com`). That is the only external service, and it is contacted only when you start a friend or online game. Matchmaking needs no server either: players race to claim a lobby ID per variant and time control.
- Android app (`source/android/`): a tiny WebView wrapper (about 30 KB) that loads the live site and adds Android's share sheet and saving to Downloads. Built without Android Studio by `source/android/build.sh` (needs a JDK and the Android build-tools + platform packages).
- Android app 2: native notifications; while the app is closed it checks about every 15 minutes with a random per-device key (`notify_poll`), never the sign-in session.
- Settings, puzzle rating and recent games are stored only in this browser (`localStorage` keys start with `rs.`).

## Source and rebuilding

The built site is this folder. The source is in [`source/`](source/) (TypeScript + Vite, libraries: chessground, chessops, PeerJS).

```bash
cd rookstorm/source
npm ci
npm run dev      # local dev server
npm run build    # writes source/dist; copy its contents to rookstorm/ to publish
```

`npm run build` first copies `engine/` and `data/` from this folder into `source/public/`.

## Credits and licences

- Stockfish 17.1 — GPLv3 (`engine/COPYING.txt`)
- chessground — GPLv3; chessops — GPLv3; PeerJS — MIT
- Openings: [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings), CC0
- Puzzles: [Lichess puzzle database](https://database.lichess.org/#puzzles), CC0

Because it bundles GPL code, Rookstorm is released under GPLv3.

## Accounts

Sign up with a username and password (no e-mail; a recovery code resets a forgotten password). Accounts give saved ratings (everyone starts at 1500 in every mode), friends, rated friend games (tick "Rated game"), challenges, watching friends' live games, friends' game history with analysis, **chat with friends** (send games you played; they open in the analysis board), **daily games** (1–14 days per move, their own Daily rating, timeouts handled on the server) and **notifications** for messages, challenges and daily moves (in-page, browser notifications while a tab is open, and native ones in the Android app). The live site uses its own Supabase project; to run your own copy:

1. Create a free Supabase project (region Central EU / Frankfurt).
2. Run [`source/supabase/schema.sql`](source/supabase/schema.sql) in the SQL editor, then the add-ons [`add-brilliants.sql`](source/supabase/add-brilliants.sql), [`add-social.sql`](source/supabase/add-social.sql) (chat, daily games, notifications) [`add-rating-privacy.sql`](source/supabase/add-rating-privacy.sql) (ratings public by default, each player can limit them to friends or nobody) and [`add-daily-puzzles.sql`](source/supabase/add-daily-puzzles.sql) (daily/weekly puzzle results on profiles).
3. Authentication → Email: turn off "Confirm email" (accounts use username + password and a recovery code; no e-mail addresses are collected).
4. Put the project URL and anon key into `source/src/config.ts` and rebuild.

Ratings are computed on the server; every table has row-level security and the browser can only call the functions in the schema. Players can download and delete their data from their profile. The privacy policy and terms are at `#/privacy` and `#/terms`.

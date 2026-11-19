# Rookstorm

Chess website: play Stockfish 17 at any Elo, play friends and strangers online, review games, learn openings and solve endless puzzles. Works on phone, tablet and computer, has dark and light mode, and installs as an app that works offline.

**Play:** https://brknue.github.io/Claude/rookstorm/

## Features

- **Bot at any Elo (100–3200).** Type a rating. From 1320 up, Stockfish's calibrated `UCI_Elo` limiter is used; below that, a human-like error model picks among Stockfish's top lines. 3200 is full strength. Standard and Chess960.
- **Time controls:** bullet, blitz, rapid, classical, unlimited or any custom minutes + increment.
- **Variants:** Standard, Chess960, King of the Hill, Three-check, Atomic, Antichess, Horde, Racing Kings (all for human play; Standard and Chess960 vs the bot).
- **Same device:** pass-and-play with automatic board flipping.
- **Friend link:** create a game, send the link, play in real time with clocks, chat, draw offers and rematches.
- **Online:** get paired with the next player searching the same variant and time control.
- **Game review:** accuracy per player and every move classified (Brilliant, Great, Best, Excellent, Good, Book, Inaccuracy, Mistake, Miss, Blunder), with the best move shown, an evaluation graph and an eval bar. Import any PGN or FEN.
- **Board editor:** set up any position and get Stockfish's best move and top 3 lines.
- **Openings:** all 3,865 named openings and variations from the Lichess database: search, browse families, explore book moves from any position, and drill lines as White or Black.
- **Puzzles:** 27,000 rated Lichess puzzles from 400 to 3000, picked near your puzzle rating, which goes up and down as you solve. 30 themes and a Streak mode.

## How it works

- Static site, no server of its own. Hash routing, so any static host works.
- Engine: Stockfish 17.1 lite, single-threaded WebAssembly (no special server headers needed).
- Offline: a service worker caches everything (about 11 MB), including the engine and all puzzles.
- Friend and online games run peer-to-peer over WebRTC through the free PeerJS signalling server (`0.peerjs.com`). That is the only external service, and it is contacted only when you start a friend or online game. Matchmaking needs no server either: players race to claim a lobby ID per variant and time control.
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

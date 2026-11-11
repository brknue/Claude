# Real developer and player evidence
Public accounts were retrieved on 2026-11-11. These are attributable reports, **not independently verified analytics, representative surveys or game playtests**. A useful report supplies a symptom and a testable hypothesis; popularity and confident wording are not verification.

## C01: learning requires practice and decomposition
[How did YOU learn to script on Roblox?](https://www.reddit.com/r/robloxgamedev/comments/1hp3hzl/how_did_you_learn_to_script_on_roblox/) — Reddit discussion begun 2024-12-29.

Several participants describe learning from tutorials, experimentation and documentation. One recommends breaking a sword system into tools, equip animations and attacks; others disagree over how much general programming to learn first. The thread also describes getting stuck in repeated tutorial watching. The same discussion contains differing creator preferences.

**Inference:** combine short lessons with independent reconstruction and small changes. **Limitation:** retrospective anecdotes, self-selected participants and no controlled learning comparison. This does not establish one “best” channel.

## C02: reported onboarding improvements, uncertain causality
[I tracked retention on my Roblox game for 3 months](https://www.reddit.com/r/robloxgamedev/comments/1sakqj4/i_tracked_retention_on_my_roblox_game_for_3/) — author u/bloxmetrics.

The author reports early departures falling from 45% to 18% after clarifying spawn-area action, D1 rising from 6% to 15% after shortening a tutorial, and D7 improving with daily rewards. Those numbers are claims, not audited results. Another participant, u/hamxburger, reports first-puzzle completion rising from 69% to 81% and average sessions from 7.5 to 9.5 minutes after making the initial puzzle easier; later progression improved unevenly.

**Inference:** instrument the first objective and progression after it; “more solved the first puzzle” is not equivalent to durable retention. **Limitations:** missing sample sizes, no randomized control, possible acquisition/version changes, and uncertain game identification in replies. No number here is a benchmark or prediction.

## C03: conflicting daily-reward report
[Improving Long-Term Retention for Game](https://devforum.roblox.com/t/improving-long-term-retention-for-game/4628547) — Tech_Voyager, 2026-05-10.

The creator of Claw Machine Arcade reports low D7 retention and no improvement after adding seven-day daily rewards. They also attribute traffic problems to algorithm changes; that attribution is the author's explanation, not confirmed platform evidence.

**Access:** the indexed search result exposed the dated original report; directly opening the thread produced a bot-check page. No hidden replies or analytics screenshot were verified.

**Inference:** C02 and C03 conflict on rewards. Genre, implementation, audience and baseline may matter. Investigate the core loop and test on the actual game rather than treating a retention trick as universal.

## C04: small interaction failures in a polished game
[game feedback for my roblox game](https://www.reddit.com/r/robloxgamedev/comments/1s5hw1m/game_feedback_for_my_roblox_game/) — 2026-03-27; feedback by u/R3DD3ST_.

A player reports that the market NPC's UI sometimes opens only on the second interaction and that joining briefly lags while the map loads. They otherwise describe the game as polished and suggest a loading screen.

**Inference:** test first interaction immediately after join and measure actual readiness. A loading screen may explain waiting; it does not itself fix loading cost or an initialization race. **Limitation:** one short, uncontrolled play report; no trace or reproduction was supplied to this research.

## C05: tutorial creator's recurring failure cases
[GnomeCode's Tower Defense companion/support page](https://gnomecode.com/tutorials/tower-defense) documents users encountering nil/name errors, anchored enemies, waypoint timeout issues and outdated collision-group API usage.

**Inference:** verify hierarchy, spelling, physics configuration and current API docs before redesigning NPC logic. **Limitations:** selected support examples, not a measured frequency study. Some historical animation/ownership advice on the page may age; check official current guidance before applying it.

## Evidence intake template
For a new report record: source URL, author/date, exact claim in a short paraphrase, whether a game/build is identified, sample/observation window, supplied reproduction or analytics, confounders, conflicting evidence, proposed experiment and result. Preserve disagreement and distinguish reported from reproduced.

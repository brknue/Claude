# Roblox dev YouTube videos, round 2: concrete lessons from transcripts

Evidence tags: [transcript] = lessons taken from a full transcript mirror (SozAI, which says its transcripts are machine-generated); [description/chapters] = YouTube description or chapters seen through a mirror; [title only] = the video exists at that URL, but its content was not retrieved.

Overall caveat: YouTube watch pages fetched through WebFetch came back cut off (title only, no description, channel or date). Recapio "digest" pages for AlvinBlox and "Star" never loaded (they showed "Generating AI summary..."). Only SozAI gave usable transcripts, and most of its Roblox catalog is Tizzy RBLX, which was excluded. **The goal of 15+ videos with transcripts was NOT met.** Transcript-level lessons exist for 3 non-Tizzy videos. Description-level information exists for 3 tutorial series. The other 11 videos are title only. Publish dates were not retrievable for any video. SozAI pages are recent ("mostly from the last few months" per search), so they are probably 2025-2026.

## Q1. Video inventory and concrete lessons per video

### Takeaway
Three non-Tizzy creator videos had retrievable transcripts: Zyonic, Kradez, and one creator SozAI does not name. They agree on four points: playtest early with your own community, ship updates fast, make most of your money from cheap consumable dev products, and stand out from clones with a twist plus original metadata. The big tutorial channels (AlvinBlox, TheDevKing, GnomeCode, BrawlDev) put out mostly scripting how-tos, and only their titles or descriptions could be retrieved.

### Cited Findings

**V1. "I Made a Successful Roblox Game to Prove It's Not Luck": Zyonic [transcript]**. URL: https://sozai.app/transcript/successful-roblox-game-proof-not-luck/ (YouTube ID and date not shown on the mirror)
- Build order: core movement first (run, double jump, dodge), then a round system, then hit detection. Hit detection "took a few days." Core development took about 1 month, solo, alongside college classes. — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)
- Build long-term progression early (upgrades, tool crates, unlockable tools) so the game doesn't feel repetitive. Keep the lobby simple (spinner wheel, leaderboard, an obby that became a practice area). — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)
- Playtest with fans at every stage through Discord, even with a rough prototype. His line: "Find an idea, prove it works by play testing, and do not give up on it." — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)
- Paid ads underperformed. He spent 280 ad credits over about 7 days, then ran 2 more campaigns. CCU stayed around 50 and dislikes were high. He says ad traffic is weaker because those players don't know the game yet. After he stopped ads, growth came organically: a 900 CCU weekend peak, then a 7,000+ CCU peak, about 5,000 CCU around 2 months after launch, and 20M visits. — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)
- Monetization came in layers once momentum returned: game passes and dev products first, then a battle pass, clans, more tools and cosmetics. He turned down a $24,000 offer for 70% of the game. — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)
- He used an AI text/image-to-3D tool (Meshie, a paid sponsor of the video) and locked in one art style. — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)
- "You cannot release a game and just expect it to take off on its own." — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)

**V2. "How much my 2k+ CCU Roblox game makes": Kradez (game: "Spinner Dye") [transcript]**. URL: https://sozai.app/transcript/2k-ccu-roblox-game-earnings/
- He built the game in "3 to 4 days," then shipped a few updates. Each update produced a visible bump in CCU and revenue. — [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)
- The update that started growth replaced a "boring" final showdown with a 1v1 duel between the last two players. In other words, fix the climax of the round loop. — [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)
- Numbers (self-reported): about 6M visits, about 2,100 peak CCU, about 1,500 30-day average CCU, a best single day of about 97K Robux, and about 1.39M Robux over 56 days, which he puts at roughly $3,800 USD/month. — [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)
- Developer products earned most of the revenue (top sellers: "Nuke All" and "Quad Shooter"). His one game pass earned almost nothing. His advice is to add more small, cheap dev products. — [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)
- His strategy: make several games with the same core loop and different themes ("the best strategy on Roblox"). He thinks TikTok helped growth but says he has no proof. The video also promotes a paid course. — [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)

**V3. "The #1 Reason Nobody Finds Your Roblox Game (How To Get Players)": creator not named on the mirror [transcript]**. URL: https://sozai.app/transcript/reason-nobody-finds-roblox-game/
- Don't copy titles, thumbnails or templates. The video cites Roblox guidance that non-unique experiences may be deprioritized in recommendations and search. Use original imagery and naming, and make sure thumbnails match the actual game. — [SozAI](https://sozai.app/transcript/reason-nobody-finds-roblox-game/)
- Check demand before building: search a fantasy term (e.g., "fish") in Creator Exchange (spelled that way on the mirror; possibly Creator Hub/Explore). Look for high-demand fantasies that haven't seen new ideas in a long time. — [SozAI](https://sozai.app/transcript/reason-nobody-finds-roblox-game/)
- If the market is saturated, "mutate" the core loop with a twist (ice fishing, cage fishing) and give it a new title and thumbnail. "Blue ocean" example: first-responder roleplay. Case study: "My Fishing Tycoon." — [SozAI](https://sozai.app/transcript/reason-nobody-finds-roblox-game/)

**V4. GnomeCode, "How to make a Tower Defense Game - #1 Path Navigation" [description/chapters]**. URL: https://www.youtube.com/watch?v=DanjB0cTfw0 (mirror: https://videohighlight.com/v/DanjB0cTfw0). Date not retrieved; the series dates from about 2021-22 by my own recollection, unverified.
- Chapters: Setting up, Moving the Zombie, Creating waypoints, Moving between waypoints. — [VideoHighlight](https://videohighlight.com/v/DanjB0cTfw0)
- Design choice: he rejected PathfindingService because it would need many invisible barriers, and used hand-placed waypoints in a "waypoints" folder instead. He used a toolbox zombie with its extra scripts stripped out. The description promotes early access through "GnomeCode Academy." — [VideoHighlight](https://videohighlight.com/v/DanjB0cTfw0)
- Staleness risk: one DevForum user reported the series "just doesn't seem to work anymore" for them. — [DevForum (via search summary)](https://devforum.roblox.com/t/need-help-with-developing-a-tower-defense-game-like-tower-defense-simulator/2331906)

**V5. BrawlDev, "Roblox Beginners Scripting Tutorial Guide (2024)" and "Roblox Advanced Scripting Tutorial Guide (2023-2025)" playlists [description/chapters]**
- The channel has 3 playlists (Beginner, Advanced, GUI) with 50+ videos and 30+ hours. Beginner #1 is "Roblox Studio Basics" and #17 is "Tables" (2025 re-upload label). A downloadable companion .rbxl place sits behind Patreon. — [search summary of episode mirror](https://www.espinoinsurance.com/video/UGzb-T9JMa4/Tables-Roblox-Beginners-Scripting-Tutorial-17-2025.html) (page 404'd when fetched); [Patreon sitemap](https://www.patreon.com/cw/BrawlDev/sitemap)
- Recommended on DevForum (Feb 25, 2025) with the warning "Most scripting tutorial series are very good but they could be outdated." — [DevForum](https://devforum.roblox.com/t/looking-for-a-good-script-tutorial-series/3505255)
- A Reddit r/robloxgamedev comment says "search up brawldev on youtube and go to his beginners scripting playlist." — [Reddit mirror](https://redlib.hbubli.cc/r/robloxgamedev/comments/1kp7gjq/places_to_learn_scripting/msxz0if/?context=3)

**V6. TheDevKing, Beginner scripting series and "Advanced Roblox Scripting Tutorials" playlist [description/chapters]**. URL: https://www.youtube.com/playlist?list=PLhieaQmOk7nIoGnFoACf33M3o0BOqB38a
- The advanced playlist is pitched as the follow-on after the beginner series. — [YouTube search snippet](https://www.youtube.com/playlist?list=PLhieaQmOk7nIoGnFoACf33M3o0BOqB38a)
- A DevForum user (Feb 2025) recommends "Beginner's Roblox Scripting Tutorial #1 - Roblox Studio Basics" and says DevKing "re-explains stuff like you're a baby." The linked video's title says 2019, so it is likely dated. Another user adds that real learning means challenging yourself, not just watching. — [DevForum](https://devforum.roblox.com/t/looking-for-a-good-script-tutorial-series/3505255)

**Title-only items (content not retrieved; listed so the writer can cite them as existing, not for their lessons):**
- V7. "Avoid These 5 Roblox Dev Mistakes (They Cost Me Thousands)". A search snippet places it on the AlvinBlox channel and says it covers "five common and costly mistakes" with time-saving and performance tips. Channel attribution is unconfirmed. [title only] — [YouTube](https://www.youtube.com/watch?v=f63stwpsaXw)
- V8. "How To Make A Popular Roblox Game", AlvinBlox. The Recapio summary never loaded. [title only] — [Recapio](https://recapio.com/digest/how-to-make-a-popular-roblox-game-by-alvinblox)
- V9. "How To Make A ROBLOX GAME - Everything YOU Need To Know!" [title only] — [YouTube](https://www.youtube.com/watch?v=__8wtR1P-jA)
- V10. "I spent $500K creating Roblox games… here's what I learned", "Star" per the Recapio slug. [title only] — [Recapio](https://recapio.com/digest/i-spent-500k-creating-roblox-games-heres-what-i-learned-by-star)
- V11. "How I made 23M ROBUX this year as a small roblox developer (5M Visits)" [title only] — [YouTube](https://www.youtube.com/watch?v=wKI3PBO3bB0)
- V12. "How much ROBUX do I make MONTHLY as a small dev" [title only] — [YouTube](https://www.youtube.com/watch?v=dP51ZjQfBh8)
- V13. "How Much ROBUX I Make as a SMALL Roblox Developer… (Real Numbers)" [title only] — [YouTube](https://www.youtube.com/watch?v=TEENlwjuKWI)
- V14. "How much I made in 1 YEAR as a Roblox dev!" [title only] — [YouTube](https://www.youtube.com/watch?v=UBs1bebPu0s)
- V15. "Can Roblox Developers Actually Earn A Full-Time Living?" [title only] — [YouTube](https://www.youtube.com/watch?v=ogkEA9wx6Os)
- V16. "Roblox Just LEAKED How Much Money They Pay DEVS.." [title only] — [YouTube](https://www.youtube.com/watch?v=G_pjRR_bfyk)
- V17. "Roblox Game Development Tips" [title only] — [YouTube](https://www.youtube.com/watch?v=cGmjaHZjBJA)
- V18. "Roblox Games Are Dying… Here's Why", Zebra Agent per the Recapio slug. [title only] — [Recapio](https://recapio.com/digest/roblox-games-are-dying-heres-why-by-zebra-agent)
- V19. "Advice for new developers - S1E10 #beyondtheblox" (Short) [title only] — [YouTube](https://www.youtube.com/shorts/UDVinyrPEZg)

**Tizzy RBLX videos found again (EXCLUDED as possible duplicates; listed so the coordinator can check whether they were covered):**
- "I Made 3 Viral Roblox Games in a Row (Here's What I Wish I Knew Sooner)" [transcript]. Highlights: a frictionless first 90 seconds, auto-equip, contextual tutorials, a 5x "wow moment," funnel tracking for every onboarding step, D1 retention going from 6-8% to about 16% after an early-game overhaul, cheap 5/9 Robux entry products, no cash packs, ARPU going from about 1.0 to 2.0, and paying 2-3 testers 1-2K Robux for about 3-hour grinds. — [SozAI](https://sozai.app/transcript/made-3-viral-roblox-games/index.md)
- "This AI-Made Roblox Game is PRINTING Money (Steal His Strategy)" [transcript]. Highlights: use RoTrends to estimate revenue, 40K Robux/day ≈ $140/day, pick quiz/clicker/sim genres for AI-assisted builds, "kids are very forgiving on Roblox." — [SozAI](https://sozai.app/transcript/ai-made-roblox-game-printing-money/)
- Other Tizzy items on SozAI: "How I Make My Roblox Games Go Viral Everytime," "How I'd Make a Roblox Game Hit 10K CCU," "I Made ANOTHER $25,070/mo Roblox Game," "My Roblox Game Makes $119,300/mo," "Roblox Game Monetization Explained Like You're 5," and a live-ops video. — [SozAI search results](https://sozai.app/transcript/make-roblox-games-go-viral/)

### Inferences
- In this sample, creators who show their own numbers (Zyonic, Kradez, Tizzy) are indie devs with business-focused channels. The classic tutorial channels publish technical how-tos and rarely publish postmortems with numbers.
- Kradez's result (2,100 peak CCU from a 3-4 day build) and Zyonic's (a 1-month build reaching 7K CCU) suggest small-scope, fast-iteration games can work. Both are survivor stories.

### Gaps
- No transcript retrieved for AlvinBlox, TheDevKing, BrawlDev, Crusherfire, Suphi Kaner, ByteBlox, B Ricey, Okeanskiy, Stewiepfing, KreekCraft or Josh Hu. The searches found nothing at all for Suphi Kaner, Okeanskiy or ByteBlox.
- No publish dates for any video. YouTube pages came back cut off, and SozAI doesn't show dates.
- The creator of V3 is unidentified.

## Q2. Consensus vs. conflicts across creators

### Takeaway
Consensus: playtest with your community before launch, keep shipping updates after launch, and lean on cheap, repeatable dev products. Conflicts: whether paid ads help a new game, and whether to clone a proven loop or differentiate.

### Cited Findings
- **Consensus: test early with real players.** Zyonic tested every stage on Discord — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md). Tizzy keeps a dedicated tester group and a published test place — [SozAI](https://sozai.app/transcript/made-3-viral-roblox-games/index.md).
- **Consensus: post-launch updates drive growth.** For Kradez, each update gave a CCU/revenue bump — [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/). Zyonic: "You cannot release a game and just expect it to take off" — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md).
- **Consensus: cheap dev products and consumables beat game passes.** Kradez's dev products earned most of the revenue while his single game pass earned "almost nothing" — [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/). Tizzy recommends 5/9 Robux entry tiers and consumables — [SozAI](https://sozai.app/transcript/made-3-viral-roblox-games/index.md).
- **Conflict: paid ads.** Zyonic's ads gave about 50 CCU and high dislikes, and growth came after he stopped — [SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md). Tizzy's AI-clone video describes spending 7,000 Robux on ads to make a game go viral — [SozAI search summary](https://sozai.app/transcript/viral-steal-egg-ripoff-claude/).
- **Conflict: cloning vs. originality.** Kradez says to reskin one core loop across themes ("the best strategy on Roblox") — [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/). Tizzy's AI video says to copy fast-rising genres — [SozAI](https://sozai.app/transcript/ai-made-roblox-game-printing-money/). V3 warns that copied titles, thumbnails and templates get deprioritized and says to add a twist with original metadata — [SozAI](https://sozai.app/transcript/reason-nobody-finds-roblox-game/). One way to reconcile them: re-use the loop, but differentiate the theme, metadata and art.
- **Consensus (from Tizzy and Zyonic): one consistent art style.** — [SozAI Zyonic](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md); [SozAI Tizzy](https://sozai.app/transcript/made-3-viral-roblox-games/index.md)

### Inferences
- Taken together, these suggest the ad conflict depends on retention: ads amplify a game that already retains players and waste money on one that doesn't. This is my inference and no video states it directly.

### Gaps
- No creator in the sample gave controlled ad ROI data.

## Q3. Beginner learning paths / series

### Takeaway
The community's usual path is TheDevKing's or BrawlDev's beginner scripting playlist, then the same creator's advanced playlist, then project series like GnomeCode's tower defense, alongside official Roblox docs. Everyone warns that tutorials go out of date and that you have to build things yourself.

### Cited Findings
- BrawlDev: Beginner (2024), Advanced (2023-2025) and GUI playlists, 50+ videos and 30+ hours total. Starts at Studio basics, with tables at episode #17. — [search summary of episode mirror](https://www.espinoinsurance.com/video/UGzb-T9JMa4/Tables-Roblox-Beginners-Scripting-Tutorial-17-2025.html); recommended on [DevForum](https://devforum.roblox.com/t/looking-for-a-good-script-tutorial-series/3505255) and [Reddit](https://redlib.hbubli.cc/r/robloxgamedev/comments/1kp7gjq/places_to_learn_scripting/msxz0if/?context=3)
- TheDevKing: Beginner series (starting with "Roblox Studio Basics," 2019-era), then the Advanced playlist. Praised for very slow, simple explanations. — [DevForum](https://devforum.roblox.com/t/looking-for-a-good-script-tutorial-series/3505255); [YouTube playlist](https://www.youtube.com/playlist?list=PLhieaQmOk7nIoGnFoACf33M3o0BOqB38a)
- GnomeCode: project-based Tower Defense series. Episode 1 covers waypoint-based enemy pathing; later episodes were not enumerated (check gnomecode.com/tutorials/tower-defense). — [VideoHighlight](https://videohighlight.com/v/DanjB0cTfw0)
- Some videos recommend these channels alongside Robuilder, Gamer M8, the DevForum and the API docs as learning resources. — [YouTube search summary](https://www.youtube.com/channel/UCqtTgteHiP9WkbvYA_ApjZg)
- The official alternative is Roblox's own "Coding fundamentals" series. — [Roblox Creator Docs](https://create.roblox.com/docs/tutorials/fundamentals/coding-1)

### Inferences
- BrawlDev is the most current (2024-2025) of the recommended full scripting paths. TheDevKing's beginner series is older (2019), so for newcomers in 2025-26 BrawlDev looks like the safer default.

### Gaps
- Full episode lists for BrawlDev, TheDevKing and GnomeCode TD were not retrieved.
- Nothing retrieved on AlvinBlox's current beginner playlists, Suphi Kaner's advanced/module series, or Crusherfire/B Ricey content.

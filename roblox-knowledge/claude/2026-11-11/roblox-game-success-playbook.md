# Win Roblox Discovery by Retaining Players First

Roblox games now get popular mostly because of how well they keep the players Roblox sends them, not because of how many players they already have. Since March 2025, the Home "Recommended For You" (RFY) algorithm has ranked games on **per-player averages**. The main inputs are qualified play-through rate (qPTR: the share of impressions that turn into a real play), how many players leave in the first 60 and 180 seconds, how many days players come back (day 1, days 2-7 and days 8-28), and playtime, which counts only up to **60 minutes per player per day**. Over **90% of platform traffic starts on Home** ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [DevForum 2025 Roadmap](https://devforum.roblox.com/t/roblox’s-2025-discovery-roadmap-and-ways-to-reach-and-engage-your-audience/3557533)).

That design has made the platform much more open to new games. One third-party analysis found games under six months old went from **1.3% to 60.7% of Top 20 visits** after the change ([Dubit](https://dubit.io/blog/roblox-top-20-rfy)). The 2025 mega-hits fit this picture. Grow a Garden's first version took about **3 days** to build. Studios then scaled it with weekly timed updates and events, amplified by short-form video ([Wikipedia: Grow a Garden](https://en.wikipedia.org/wiki/Grow_a_Garden)).

The money is real but extremely concentrated. Creators earned **$1.503B through DevEx in 2025**, yet the **median DevEx creator earns about $1,500 a year** ([Roblox 10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm); [TweakTown](https://www.tweaktown.com/news/113585/robloxs-top-10-creators-averaged-dollars65-7-million-each-while-the-median-made-dollars1500-and-roblox-everywhere-is-the-fix/index.html)). At the standard **$0.0038 per Robux** cash-out rate, a creator keeps roughly a quarter of each dollar a player spends.

For a beginner, the practical answer is:
- Ship a small, readable core loop fast.
- Make the first three minutes frictionless.
- Give players reasons to return daily and to bring friends.
- Test many honest thumbnails.
- Add fair, mostly cheap, consumable monetization once retention holds.
- Run a steady update and event cadence.

The playbook at the end turns this into a checklist.

> **Evidence key used throughout:** unmarked figures come from Roblox (docs, DevForum staff posts, SEC filings, newsroom) or established press.
> - **[3P]** marks third-party trackers, analysts or blogs (e.g., RoStats, Rolimons, RoWatcher, profitable.app, Dubit). Their methods are often undisclosed.
> - **[self-reported]** marks creator claims in YouTube videos, which are unaudited and often promote courses.
> - **[unverified]** marks claims seen only in search snippets, secondary summaries or user comments.
>
> Data is current to roughly November 2026.

## Recommended For You ranks per-player quality, so small games can compete

### How the algorithm decides

RFY works in two stages. **Retrieval** picks candidate games from engagement, retention and monetization signals. **Ranking** then personalizes and orders about **100 candidates** for each user's Home ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).

The single most important design choice is that signals are **per-user averages, not totals**. Roblox states that "smaller experiences with highly engaged users are not disadvantaged" ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery)).

Roblox also tests every game on **new user cohorts daily**. If a cohort engages and spends, the game is shown to more similar cohorts. A weak start carries **no permanent penalty**, and retrieval needs only "a very low minimum number of plays" ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).

| Signal tier | Signal | What it rewards |
|---|---|---|
| Most important | qPTR: qualified plays ÷ RFY impressions, now measured per session | A thumbnail and title that deliver what they promise |
| Most important | First-play bounce: under 60s and 61-180s (negative signal) | Onboarding that hooks players immediately |
| Most important | Play days per user: D1, D2-7 (out of 6 days), D8-28 | Reasons to come back on many separate days |
| Most important | Playtime per user, capped at 60 min/user/game/day | Engaging sessions, but nothing beyond an hour counts |
| Important | Intentional co-play days: joins, invites, private servers, and reserved servers since Dec 2025 | Playing with friends |
| Important | Qualified play sessions, spend days, Robux spent per user | Monetization that comes after engagement |

*Sources: [Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [DevForum RFY announcement, Mar 31 2025, with Dec 11 2025 update](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441)*

Roblox frames the goal as "lasting value," meaning long-term retention *and* long-term monetization. It explicitly advises creators to **fix core gameplay and retention first**, because monetization helps only once retention is strong ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).

Weights are undisclosed, and Roblox says no single signal dominates. Most signals refresh within **24 hours**, and changes show up in impressions a few days later. Roblox's own example: a qPTR dip on February 28 was followed by an impression drop on March 3 ([DevForum RFY thread](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441)).

A Roblox newsroom item from June 2026 says ranking now looks beyond a game's first week to its first 28 days. It also says Roblox is testing a metric for how many new players a game brings to the platform **[unverified, snippet only]** ([Roblox newsroom](https://about.roblox.com/pl/newsroom/2026/06/optimizing-discovery-great-games-reach-millions-players-roblox)).

Four implications follow:
- **Returning on more days beats longer sessions.** The 60-minute cap means AFK farming and very long sessions add nothing past an hour.
- **Genre itself is not a ranking factor.** Finite or story games are not penalized for lower long-term retention ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).
- **Inaccurate tags and descriptions hurt**, because they cause bounces.
- **Impressions are relative.** Roblox notes that a 50% signal gain can yield little growth if competitors improve more. Home traffic also swings with season: weekly peaks on Saturday, summer, back-to-school and holidays ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).

### Thumbnails, ads, events and other discovery surfaces

**A custom thumbnail is mandatory**: without one, a game gets no Home recommendations ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery)). Several metadata problems reduce exposure:
- Leading with monetary rewards or giveaways.
- Mismatched or misleading thumbnails and titles.
- Near-copies of another game. These are down-ranked in favor of whichever game first had the unique metadata or place file ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).

**Thumbnail personalization** has been live since November 2024. It uses a multi-armed bandit rather than a fixed A/B split, shifting traffic toward winning thumbnails within hours. In the experiment phase it lifted qPTR by **+8.5% on average**, and some games saw **+50%** ([DevForum: Personalize your thumbnails](https://devforum.roblox.com/t/live-now-personalize-your-thumbnails-to-attract-more-users/3257233)). Roblox staff advise:
- Games under **1,000 DAU** may not see meaningful results.
- Don't restart the test daily ([DevForum: 5 Tips From Roblox Staff](https://devforum.roblox.com/t/5-tips-from-roblox-staff-to-get-the-most-out-of-thumbnail-personalization/3471689)).
- Keep each variant live **at least 7 days** ([DevForum 2025 Roadmap](https://devforum.roblox.com/t/roblox’s-2025-discovery-roadmap-and-ways-to-reach-and-engage-your-audience/3557533)).

**Sponsored ads** buy plays, but they do not "train" RFY. Engagement, retention and spend from ad-acquired players are **excluded from RFY signals**, so RFY impressions can dip while total acquisition rises ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)). Some developers dispute this and argue ad traffic still degrades their discovery metrics **[unverified developer complaint]** ([DevForum](https://devforum.roblox.com/t/sponsored-ads-traffic-degrades-the-engagement-metrics-used-for-discovery-causing-paid-acquisition-to-harm-organic-ranking/4838351)).

Roblox's RDC 2025 ads recap reported ([DevForum: Ads RDC Recap](https://devforum.roblox.com/t/ads-for-creators-rdc-recap-and-what%E2%80%99s-next/3929106)):
- Cost per play is **over 71% cheaper**, with players acquirable for **under $0.01**.
- **The 5 newest games to reach the top 20 by earnings all started with Sponsored ads.**
- A typical advertised game saw **+150% impressions, +24% plays and +16% playtime** in lift studies.
- 1 Ad Credit now costs **263 Robux**, down from 285.

**Events** are a meaningful secondary surface. An updated event promotion system raised event participation **266%** during its experiment ([DevForum](https://devforum.roblox.com/t/join-us-we%E2%80%99ve-updated-our-event-promotion-system/3282942)). Home's "Live Events" row accepts up to 5 event thumbnails, and a "Trending Events in Experiences" chart ranks active events by DAU ([Creator Hub: Experience events](https://create.roblox.com/docs/en-us/production/promotion/experience-events)).

Other surfaces:
- **Search** is semantic, so queries like "food games" work. It gained one-click genre tags in December 2025 ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [DevForum: Personalized Discovery](https://devforum.roblox.com/t/building-the-future-of-roblox-home-and-search-introducing-personalized-discovery/3432124)).
- **Charts** include a CCU-based "Top Playing Now" sort, live since about April 2025 ([DevForum](https://devforum.roblox.com/t/introducing-top-playing-now-on-charts/3529809)).
- **Curated rows** include Today's Picks and Standout Games ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery)).
- **Roblox Moments** (beta since RDC 2025) is a short-clip feed: clips of up to 30 seconds with a "Join" button ([DevForum: RDC25](https://devforum.roblox.com/t/rdc25-what-we-announced/3920245)).

### Recent changes, 2024-2026

| When | Change |
|---|---|
| Jul-Nov 2024 | Thumbnail personalization tested, then launched |
| Jan 2025 | Dynamic positioning of the Friends / "People You May Know" and "Continue" rows |
| Mar 2025 | Improved RFY (per-user signals) and the Home Recommendations analytics tab |
| Apr 2025 | CCU chart ("Top Playing Now") |
| Aug 2025 | Test of genre and social-proof subtitles on tiles |
| Sep 2025 | Moments beta and cheaper ads |
| Dec 2025 | Reserved servers count as co-play; RFY-only attribution; genre tags in Search |
| Jan 2026 (CES) | Homepage CPM ad format **[secondary press]** |

*Sources: [DevForum: Personalized Discovery](https://devforum.roblox.com/t/building-the-future-of-roblox-home-and-search-introducing-personalized-discovery/3432124); [DevForum RFY thread](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441); [DevForum subtitle test](https://devforum.roblox.com/t/upcoming-tests-improving-game-discovery-with-relevant-information/3907203); [Outlook Respawn](https://respawn.outlookindia.com/amp/story/gaming/gaming-news/roblox-unveils-homepage-ad-format-and-expands-buying-at-ces-2026)*

The effect on the charts has been dramatic, according to Dubit **[3P]**:
- Games 24+ months old fell from **84% to 18% of Top 20 visits**.
- Median Top 20 tenure fell from **14 to 7 months**.
- Only 7 of July 2024's Top 20 were still there by December 2025 ([Dubit](https://dubit.io/blog/roblox-top-20-rfy)).

Hours are also spreading beyond the biggest games. The CFO said the top 10 games now hold **about 20% of hours, down from about 30%** three years ago ([Interspace Music](https://interspacemusic.com/blog/roblox-daily-active-users-fall-to-123-million-in-q2-2026/)). The top 50 still took **51% of hours** in December 2025 ([10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm)).

## The median Roblox game keeps one in ten players to day two

Realistic benchmarks matter because blogs inflate them. The broadest dataset is the GameAnalytics 2026 Roblox Report, covering August 2025 to July 2026 and only games with 1M+ MAU. Across all games, medians would be lower ([GameDev Reports summary](https://gamedevreports.substack.com/p/gameanalytics-key-roblox-and-roblox)).

| Metric | Median | Top 10% / Top 5% | Top 1% |
|---|---|---|---|
| D1 retention | **10.3%** | — | 22.2% |
| D7 retention | **1.6%** | — | 9.1% |
| D30 retention | **0.5%** | — | 4.7% |
| Game session length | **9.8 min** | 16.6 min (top 5%) | 21.1 min |
| Sessions per day per game | 1.56 | 3.22 (top 10%) | 8.3 |
| Playtime per player per day | 22.4 min | 123.85 min (top 10%) | 404.98 min |
| ARPPU per game (average spend per paying player) | $0.70 | $2.33 (top 10%) | $55.31 |

The same report puts payer conversion at **3.80% of players** in 2026, down from 4.2% two years earlier. These figures come via a secondary summary; the primary PDF was not reviewed.

Roblox's own Creator Analytics benchmarks your game against similar games at the 50th-90th percentile, for games with **100+ DAU**. A DevForum example shows a D1 range of **12.4%-24.1%** from p50 to p90 ([DevForum: Similar experience benchmarks](https://devforum.roblox.com/t/analytics-similar-experience-benchmarks-broader-access/2210285)).

Third-party blogs claim top-100 games hit D1 of 45-60%, or that a "healthy obby" hits D1 of 25-35% **[3P, likely survivorship-biased]** ([Endsights](https://endsights.com/roblox-games-fail); [RoWatcher](https://rowatcher.com/news/retention-benchmarks-by-roblox-genre-what-good-actually-looks-like)). Treat those as aspirational at best.

Working targets for a beginner, inferred from the data above:
- **D1 above ~12%** is roughly median among similar games.
- **D1 of ~22-24%** is elite.
- **D7 above ~5%** and **D30 above ~2%** are well above median.

No reliable public benchmark exists for the CCU needed to reach the front page.

## The 2025-2026 hits were built in days and grown by weekly events

### Case studies

All per-game CCU figures below are approximate. Roblox does not publish official all-time peaks, and trackers disagree.

| Game | Launch / team | Core loop | Peak CCU | What drove it |
|---|---|---|---|---|
| **Grow a Garden** | Mar 26, 2025; built by a 16-year-old in about **3 days**; Splitting Point bought in at about **1,000 CCU** | Buy seeds, plant, harvest (crops grow offline), sell, buy rarer seeds; rotating stock | **22,346,725** (Aug 23, 2025, RTC); Guinness record at 21.6M | Weekly named updates, admin "war" with Steal a Brainrot, Travis Kelce event, short-form video |
| **Steal a Brainrot** | May 16, 2025; SpyderSammy, owned by DoBig | Buy or steal meme characters that generate passive income; raid bases; rebirth | ~24.1M (RTC, Sep 2025); 25.4M (Wikipedia) vs 25.8M (Rolimons **[3P]**) | Italian brainrot meme, TikTok/YouTube, admin-abuse events; Bruno Mars concert peaked at 12.8M |
| **99 Nights in the Forest** | 2025; Grandma's Favourite Games, 3 named developers | Survival | **14.2M** | Still a top game in late 2026 |
| **Dead Rails** | Early 2025; RCM Games (about 70 games, one hit) | Defend a train in an 1899 zombie West | **1M** (Roblox, Mar 2025) | Roblox's own social posts, then Flamingo and other YouTubers, then Top Trending |
| **Dress to Impress** | Nov 2023; teen-led team | Fashion contest | 370K+ (2024, Kotaku via Rolimons **[3P]**) | Social and fashion appeal, Charli XCX tie-in |
| **Steal An Egg and Collect Rare Pets** | ~Jul 25, 2026 | "Steal" format clone | 14.3M vs 2.2M **[3P, trackers conflict]** | Clone of a proven template |

*Sources: [Wikipedia: Grow a Garden](https://en.wikipedia.org/wiki/Grow_a_Garden); [RTC on X](https://x.com/Roblox_RTC/status/1959281995453706447); [Roblox Newsroom, Jun 2025](https://about.roblox.com/newsroom/2025/06/roblox-infrastructure-supporting-record-breaking-games); [Wikipedia: Steal a Brainrot](https://en.wikipedia.org/wiki/Steal_a_Brainrot); [Rolimons](https://www.rolimons.com/game/109983668079237); [PC Gamer via Yahoo](https://tech.yahoo.com/gaming/articles/peak-player-count-14-2-040313683.html); [GameAnalytics on Dead Rails](https://gameanalytics.com/blog/dead-rails-and-the-hit-makers-formula); [RoWatcher](https://rowatcher.com/games/7018190066/dead-rails/dying); [Kotaku](https://kotaku.com/dress-to-impress-codes-roblox-dti-charli-xcx-1851622355); [RoStats](https://rostats.io/records); [RoWatcher Steal An Egg](https://rowatcher.com/games/10563114921/steal-an-egg)*

Grow a Garden's peaks climbed in steps that matched its weekly updates:

| Date | Update | Peak CCU |
|---|---|---|
| May 18, 2025 | Blood Moon | ~5M |
| May 31, 2025 | Bizzy Bees | 11.7M |
| Jun 14, 2025 | Working Bees | 16M |
| Jun 21, 2025 | Summer | 21.3M |

Those peaks were scheduled events, not a steady state. CCU fell to **7.6M within an hour** of the June 21 peak, and averaged about **2.7M** on June 25 ([Wikipedia: Grow a Garden](https://en.wikipedia.org/wiki/Grow_a_Garden)). Grow a Garden was the fastest game to reach 1B visits, in **33 days**. Bloomberg reportedly put its profit at **at least $148M in eight months** **[unverified, snippet only]** ([Tubefilter](https://www.tubefilter.com/2026/03/09/kreekcraft-has-spent-over-100000-making-a-roblox-game-whats-the-roi-for-developers/)).

Steal a Brainrot showed the same pattern: monthly peaks of 20M+ against an average of about **1M CCU** in September 2025. By late 2026 it was a fraction of that, with a RoStats peak of about 1.41M in September 2026 **[3P]** ([Wikipedia: Steal a Brainrot](https://en.wikipedia.org/wiki/Steal_a_Brainrot); [RoStats](https://rostats.io/records)).

Dead Rails also cooled sharply. RoWatcher recorded a 79K peak in November 2025 **[3P]**, and Profitable showed about 21.8K CCU in July 2026 **[3P]** ([RoWatcher](https://rowatcher.com/games/7018190066/dead-rails/dying); [Profitable](https://profitable.app/roblox/games/dead-rails)).

### Patterns across the hits

Five patterns repeat:
1. **A one-sentence loop** (collect, grow, steal, survive) with passive income and rarity tiers.
2. **A clock**: rotating stock, weekly exclusives you must be online to claim, admin-abuse events, and holiday updates.
3. **Visible social interaction**: stealing, trading, showing off.
4. **Meme-friendly art** that travels on TikTok and YouTube.
5. **Live-ops capacity**, often bought in early. Splitting Point and DoBig took stakes in games at tiny CCU, and Voldex acquired Brookhaven ([Wikipedia: Grow a Garden](https://en.wikipedia.org/wiki/Grow_a_Garden); [Wikipedia List of Roblox games](https://en.wikipedia.org/wiki/List_of_Roblox_games)).

GameAnalytics calls Dead Rails' formula "most advanced yet acceptable": familiar mechanics in a novel setting ([GameAnalytics](https://gameanalytics.com/blog/dead-rails-and-the-hit-makers-formula)). Holiday updates still produce huge spikes for older games: Blox Fruits gained +943K daily average on August 1, 2026, and Murder Mystery 2 peaked at 2.24M on October 25, 2026 **[3P]** ([RoStats](https://rostats.io/records)).

Most viral games still fade. RoWatcher **[3P, undated, methodology undisclosed]** reports that:
- About **80% of 2024's top-50 games were outside the top 200** by early 2026.
- Recently updated games retain **3-4x more players at 6 months**.
- A calendar-anchored event cadence, at least quarterly, is the strongest single predictor of 12-month survival.
- Simulators and tycoons decline fastest, while social and fashion games retain best ([RoWatcher](https://rowatcher.com/news/one-year-on-the-charts-what-really-happens-after-a-roblox-game-goes-viral)).

The hits also carry risks: IP disputes (a Brainrot character was pulled over licensing), exploit scripts, real-money trading of items against the terms of service, and bot-inflation allegations, which were later retracted ([Wikipedia: Steal a Brainrot](https://en.wikipedia.org/wiki/Steal_a_Brainrot); [Wikipedia: Grow a Garden](https://en.wikipedia.org/wiki/Grow_a_Garden)).

## Players are aging up, mostly on mobile, and favor social, anime and simulator games

### Platform size and audience

Roblox's 2025 boom was enormous:
- FY2025 average DAU: **126.5M (+53%)**.
- Bookings: **$6.8B (+55%)**.
- Hours: **123.8B (+69%)** ([GameDevReports/Newzoo](https://gamedevreports.substack.com/p/newzoo-top-roblox-games-in-2025)).
- DAU peaked at **151.5M in Q3 2025** ([GamesBeat](https://gamesbeat.com/roblox-had-151m-daily-active-users-in-q3-2025/)).

2026 is a digestion year. Q3 2026 DAU was **138M (-9% YoY)**, with bookings of **$1.697B (-12% YoY)** and 30M monthly unique payers (-16%) ([Gaming.net](https://gaming.net/roblox-q3-revenue-rises-16-as-bookings-fall-12-to-1-7-billion)). Roblox attributes part of the slowdown to mandatory age checks and discovery changes slowing new-user growth, while retention stayed stable ([Outlook Respawn](https://respawn.outlookindia.com/gaming/gaming-news/roblox-q2-2026-revenue-soars-36-to-15b-despite-bookings-miss)).

The audience is getting older, which affects what to build:
- As of Q3 2026, **18+ users are 29% of age-checked DAU globally and 37% in the US**.
- US adults **monetize 50% or more above under-18 users** ([Gaming.net](https://gaming.net/roblox-q3-revenue-rises-16-as-bookings-fall-12-to-1-7-billion)).
- Among age-checked users in January 2026, 35% were under 13 and 38% were 13-17 ([Outlook Respawn](https://respawn.outlookindia.com/gaming/gaming-news/roblox-daily-users-jump-69-to-record-144-million-in-q4-2025)).

**About 80% of users play on mobile**, but mobile contributes only 46% of Robux revenue ([PocketGamer.biz](https://www.pocketgamer.biz/80-of-roblox-users-are-on-mobile-contributing-46-of-robux-revenue)). Newzoo found only 24% play exclusively on mobile, so cross-play with PC is the norm ([GameDevReports/Newzoo](https://gamedevreports.substack.com/p/newzoo-roblox-as-a-platform-in-2025)).

Growth is strongest outside North America. In Q4 2025, APAC bookings rose 96%, including Indonesia +700% and India +110% ([Outlook Respawn](https://respawn.outlookindia.com/gaming/gaming-news/roblox-daily-users-jump-69-to-record-144-million-in-q4-2025)). In Q3 2026, DAU grew 33% in Japan and 37% in India ([Gaming.net](https://gaming.net/roblox-q3-revenue-rises-16-as-bookings-fall-12-to-1-7-billion)). That makes localization and low-end-phone performance matter.

### Genres and trends

Newzoo's long-run genre data puts **Roleplay & Avatar Sim (116M daily visits)** and **Simulation (110M)** on top, ahead of Platformer and Survival (70M each) and Action (59M) ([GameDevReports/Newzoo](https://gamedevreports.substack.com/p/newzoo-roblox-as-a-platform-in-2025)). The steady 2025 anchors were Brookhaven RP and Blox Fruits, in the top 10 every month, plus RIVALS and The Strongest Battlegrounds, in 11 of 12 months ([GameDevReports/Newzoo](https://gamedevreports.substack.com/p/newzoo-top-roblox-games-in-2025)).

Players' panel preferences in 2026 lean toward shooter, sandbox and simulation, with horror, racing and survival also broadly liked ([GamesBeat](https://gamesbeat.com/data-shows-gamers-are-not-graduating-out-of-roblox-as-they-age-up/)).

Playtime and revenue diverge by genre. Roleplay hangouts top playtime but earn less per hour than collection and progression games **[3P estimates]** ([games.gg](https://games.gg/news/roblox-top-earning-games-in-june-2025/)). Late-2026 trends include "Steal a ___" pet clones, fishing games such as Fisch, and asymmetric horror such as Forsaken **[3P]** ([RoStats](https://rostats.io/records); [clip.dor.gg](https://clip.dor.gg/en/blog/roblox-popular-games-ranking)).

### What players like and dislike

Hard sentiment data is thin. What exists points in two directions:
- **Social identity is central.** Roblox logged **274M daily avatar updates in 2025** ([GamesBeat](https://gamesbeat.com/roblox-saw-274m-daily-avatar-updates-in-2025/)), and co-play is an explicit ranking signal.
- **Aggressive monetization draws scrutiny.** A 2026 University of Sydney study found deceptive purchase design in **14 of 15 games studied**: countdown timers, misleading pricing and pay-to-progress ([Univ. of Sydney](https://www.sydney.edu.au/news-opinion/news/2026/05/17/inside-the-pay-to-play-world-of-roblox-targeting-children-.html)).

### Safety rules that shape your audience

- **Chat requires an age check globally** since January 2026, and chat is limited to similar age bands ([Roblox Newsroom](https://about.roblox.com/newsroom/2026/01/roblox-age-checks-required-to-chat)).
- **Unrated experiences can't be played publicly.**
- Hangouts with private spaces such as bedrooms are limited to ID-verified 17+ users and hidden from others' recommendations ([Roblox Newsroom Aug 2025](https://about.roblox.com/newsroom/2025/08/extending-roblox-policy-on-romantic-and-sexual-content)).
- A "Restricted" label is permanent and removes non-verified players ([Content Maturity docs](https://create.roblox.com/docs/production/promotion/content-maturity)).

For maximum reach, aim for a Minimal or Mild maturity label, and build social features that don't depend on open chat between strangers, such as emotes, trading screens and co-op tasks.

## Creators keep about a quarter of every dollar players spend

### Every way to earn

| Method | How it pays | Notes |
|---|---|---|
| **Game passes** | One-time purchase; **70% of Robux** to the creator | Permanent perks (VIP, 2x) |
| **Developer products** | Repeatable purchase; 70% | Consumables, currency, boosts |
| **Subscriptions** | Monthly Robux; 70% | Excluded from automatic price optimization |
| **Private servers** | Monthly Robux fee | Also earns Plus incentives |
| **Paid access** | Robux, or local currency since Jan 2025 ("up to 70%") | Roblox's example: a $9.99 game pays **$4.99 (50%)** per new purchase |
| **Creator Rewards** (replaced Premium Payouts in July 2025) | **5 Robux per Active Spender per day** if your game is among the first three they open and they play 10+ min; **35% of a new or returning user's first $100** of purchases if they joined through your Share Link or a search for your game's name | Active Spender = $9.99+ spent in the past 60 days. The 35% reward needs 100+ average DAU and an ID-verified creator account; it is paid after a 60-day hold |
| **Roblox Plus** ($4.99/mo, launched Apr 30, 2026) | Roblox pays for subscribers' 10%→20% discount, so you still earn full price. Also: 250 Robux/month for up to 3 months per sign-up through your game's prompt, up to 100 Robux per private-server subscriber, and 10% of Robux transfers prompted in your game | Plus incentives paid creators **300M+ Robux in the first four months [secondary]** |
| **Ads** | Rewarded Video ("up to 3%" of earnings early on; Roblox targets 5-10% long-term); pre-roll ads coming (split undisclosed) | Ads shown only to users 13+ |
| **UGC / Marketplace** | Typically 30% creator / 40% distributor / 30% platform; game owners earn a commission on purchases made in their game | Clothing and accessories |
| **Plugins / models** | USD sales (minimum $4.99 / $2.99) | 30-day escrow |

*Sources: [Roblox monetization docs](https://create.roblox.com/docs/production/monetization); [10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm); [DevForum: paid access](https://devforum.roblox.com/t/earn-a-higher-revenue-share-for-999-paid-access-experiences/3294010); [Creator Rewards docs](https://create.roblox.com/docs/creator-rewards); [Roblox Plus docs](https://create.roblox.com/docs/en-us/production/monetization/roblox-plus); [gameaccountvalue](https://gameaccountvalue.com/news-roblox-2026-09-rdc-2026-creator-earnings.html); [DevForum: Rewarded Video](https://devforum.roblox.com/t/more-creators-can-now-use-rewarded-video-ads/3838678); [RDC26 announcements](https://devforum.roblox.com/t/rdc26-what-we-announced/4865880)*

### From Robux to dollars

The **standard DevEx rate is $0.0038 per earned Robux**, raised from $0.0035 on September 5, 2025. Since June 8, 2026, Robux spent by 18+ players in qualifying "novel" games converts at **$0.005396**. To qualify, a game must be "genre-defining" with "deeper gameplay [and] distinct visuals," and must use R15 avatars ([10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm); [Tubefilter](https://www.tubefilter.com/?p=192104)). The DevEx minimum is **30,000 earned Robux**, and you must be **13 or older** ([10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm); [Economic Impact Report](https://about.roblox.com/newsroom/2025/09/roblox-annual-economic-impact-report)).

A worked example, using Roblox's average selling price of about **$0.01 per Robux** ([10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm)):
1. A player spends 1,000 Robux, which cost them about $10.
2. You earn 700 Robux.
3. At the standard rate, that cashes out at about **$2.66**, roughly 27% of what the player paid.
4. At the 18+ novel-game rate, the same purchase pays about **$3.78**.

The rest goes to app stores (Apple and Google take up to 30%), Roblox's platform share, and the spread between buying and cashing-out rates.

Payouts are changing. **Roblox Wallet** launches in late 2026 for US creators aged 18+, paying earnings in USD every business day, with international rollout in 2027 ([DevForum RDC26](https://devforum.roblox.com/t/rdc26-what-we-announced/4865880)). A user comment quotes Roblox as saying US DevEx will end in mid-2027 **[unverified]**.

### Real earnings: a few win big, most earn little

| Cohort | Earnings | Source |
|---|---|---|
| All creators, 2025 | **$1.503B** via DevEx (+63% from $922.8M in 2024); 23,500+ paid | [10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm) |
| All creators, 12 months to Jun 2026 | ~**$1.7B**; $5B+ since 2013; 42,000+ DevEx participants | [Roblox newsroom RDC 2026](https://about.roblox.com/newsroom/2026/09/rdc-2026-the-world-needs-more-play); [TweakTown](https://www.tweaktown.com/news/113585/robloxs-top-10-creators-averaged-dollars65-7-million-each-while-the-median-made-dollars1500-and-roblox-everywhere-is-the-fix/index.html) |
| Top 10 creators (2026 report) | **$65.7M average** | [TweakTown](https://www.tweaktown.com/news/113585/robloxs-top-10-creators-averaged-dollars65-7-million-each-while-the-median-made-dollars1500-and-roblox-everywhere-is-the-fix/index.html) |
| Top 100 / Top 1,000 (2024 data) | $6M / $820K average | [Economic Impact Report](https://about.roblox.com/newsroom/2025/09/roblox-annual-economic-impact-report) |
| Median DevEx creator | **~$1,500/yr** (2026); $1,575 (2024 data) | same |

Platform-wide, about **1.8M of 127M DAU pay on a given day, roughly 1.4%**. Those daily payers average **$10.36** in bookings, and the platform averages **$0.15** in bookings per DAU ([10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm)).

One unofficial estimate puts a creator's take-home revenue at **$0.003-0.006 per DAU** for a conservatively monetized game and **$0.015-0.025** for a well-monetized one **[3P]** ([RoWatcher](https://rowatcher.com/news/devex-math-in-2026-what-you-actually-take-home-per-1-000-players)). By that rough math, a game averaging 10,000 DAU earns somewhere in the tens of thousands of dollars a year, not millions.

Indie data points **[self-reported]**:
- Kradez's 2,100-peak-CCU game made about **1.39M Robux in 56 days (~$3,800/month)** ([SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)).
- Tizzy RBLX claims **$28,910/month** ([SozAI](https://sozai.app/transcript/roblox-game-earnings-lessons/)).

### Pricing rules and fairness

Roblox's official guidance ([monetization docs](https://create.roblox.com/docs/production/monetization)):
- Be transparent.
- Use only genuine discounts: no permanent "sales" and no high-pressure short ones.
- **No false urgency**: no fake scarcity, and no countdown timers that are wrong or reset themselves.
- Use calm wording for minors ("View Item," not "GET IT NOW").
- Serve two kinds of players: **"tourists," who want items with an immediate effect, and "locals," who want long-term value such as battle passes.**
- Lean on limited-time items and trading.
- Update weekly, and never less than monthly.

**Paid random items** (eggs, crates, spins, and rerolls bought with Robux) must show every outcome's **numerical odds, adding to 100%, before purchase**. Luck boosts and pity systems must state their effect. Every such item must be gated through **PolicyService**. If `ArePaidRandomItemsRestricted` is true for a player, you must offer one of these instead:
- A free, earnable path.
- A fixed, disclosed order.
- Direct sale of specific items at their expected value.
- Hiding or blocking the item ([Paid random items docs](https://create.roblox.com/docs/production/monetization/paid-random-items)).

Once a game passes about **60,000 transactions in 30 days**, Managed Pricing can A/B-test pass and product prices automatically. It applies new prices only if total revenue rises, and keeps 2% of users on original prices as a holdout. Prices must be set by script ([Price optimization docs](https://create.roblox.com/docs/production/monetization/price-optimization)). Regional pricing, which lowers prices in poorer markets, launched in April 2025 ([Tubefilter](https://www.tubefilter.com/2025/04/22/roblox-regional-pricing-in-experience-items/)).

Ads Manager's new "Earnings" campaigns reported that nearly two-thirds of beta games reinvesting up to 4% of earnings reached **ROAS above 100%** (ROAS: ad revenue returned per dollar spent) ([DevForum Ads Manager Recap](https://devforum.roblox.com/t/ads-manager-rdc-recap-earnings-roas-reporting-incrementality/4909790)).

## Successful creators agree: launch fast, measure everything, patch constantly

### Where creators agree

The current "my game makes $X" YouTube creators converge on a performance-marketing workflow. All of their figures are **[self-reported]**.

Tizzy RBLX's advice:
- **Track every onboarding step as a funnel.**
- **Make the first ~90 seconds frictionless.** Auto-equip the first item, preload starter consumables, and deliver a "wow moment" early.
- Teach later systems with contextual tutorials, at the moment they become relevant.
- His D1 retention rose from **~6-8% to ~16%** after an onboarding overhaul. Cutting bounce from **21% to 15%** coincided with CCU rising from about 2.5K to 4.5K.
- He paid testers **1,000-2,000 Robux for about 3 hours** of grinding on fresh accounts, in a published test place, and patched daily after launch.
- Cheap entry tiers starting at **5 Robux** sold 61,000 units.
- His regrets: selling cash packs, which he says hurt the economy, and launching limited items too late ([SozAI: 3 viral games](https://sozai.app/transcript/made-3-viral-roblox-games/index.md); [SozAI: $28,910/mo](https://sozai.app/transcript/roblox-game-earnings-lessons/index.md)).

Kradez built his game in **3-4 days**. His growth began when he replaced a boring round finale with a **1v1 duel**. Most of his revenue came from cheap developer products, while his one game pass earned "almost nothing" ([SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)).

Zyonic built his game solo in about **1 month** and playtested every stage with his Discord. It reached a **7,000+ CCU** peak and 20M visits ([SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)).

On thumbnails, one sponsored-ads explainer recommends:
- Start at **~$16/day**, run for at least 3 days, and prepare **10-20 thumbnails**.
- Write titles at about a 3rd-grade reading level.
- Its case study: a new title and thumbnail raised CTR from **1.54% to 3.27%**.
- Stop ads once Home impressions overtake sponsored impressions ([SozAI](https://sozai.app/transcript/roblox-sponsored-ads-explained/index.md)).

### Where creators disagree

**Paid ads.** Zyonic's ads produced about 50 CCU and high dislikes, and his growth came after he stopped them. Roblox, meanwhile, reports that every recent top-20 earner started with ads ([SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md); [DevForum: Ads RDC Recap](https://devforum.roblox.com/t/ads-for-creators-rdc-recap-and-what%E2%80%99s-next/3929106)). A reasonable reconciliation: ads amplify a game that already retains players and waste money on one that doesn't. That is an inference, not something either source states.

**Cloning vs. originality.** Kradez calls reskinning one loop across themes "the best strategy on Roblox." Another creator warns that copied titles, thumbnails and templates get deprioritized, and recommends "mutating" a saturated loop with a twist (e.g., ice fishing) and original metadata ([SozAI](https://sozai.app/transcript/reason-nobody-finds-roblox-game/)). Roblox's own policy supports the second view ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)). The safe synthesis: reuse proven loops, but make the theme, art, title and thumbnail genuinely your own.

### Older postmortems and why games fail

Older postmortems back up the data-first approach:
- **Dungeon Life** (2019) built many 1-4-week prototypes and picked which to pursue by retention. Being featured didn't save it: retention fell from 10% to 5% within a month. Requests from hardcore fans didn't fix new-player problems ([Game Developer](https://gamedeveloper.com/business/my-roblox-years-dungeon-life-and-new-product-science)).
- **Liftoff** regretted a rushed launch with arbitrary economy values and no way to reset data. A core-mechanic update lifted its D1 from 10% to 15%, and a few meaningful passes outearned many useless ones ([DevForum](https://devforum.roblox.com/t/liftoff-a-case-study/468266)).

Failure threads list the usual causes ([DevForum "So your game died"](https://devforum.roblox.com/t/so-your-game-died-a-thread-on-game-design-and-the-market/2644450); [DevForum "Why did my game fail?"](https://devforum.roblox.com/t/why-did-my-game-fail/2724261)):
- No fun or no clear loop.
- Players who "just don't understand what to do."
- A loop that gets repetitive after about 10 minutes.
- Genre saturation.
- Bugs under load.
- No defense against exploiters.

### Technical consensus

- **Never trust the client.** The server validates every remote. Clients never send prices or currency amounts, and the server checks hit distance against weapon reach ([DevForum sanity checks](https://devforum.roblox.com/t/how-do-i-sanity-check-i-dont-understand-how-it-work/2173037)).
- **Store player data with a session-locking wrapper.** ProfileStore, the successor to ProfileService, is the usual choice for new projects; Suphi's DataStore Module is an alternative ([DevForum ProfileStore](https://devforum.roblox.com/t/profilestore-save-your-player-data-easy-datastore-module/3190543)).
- **Record purchases yourself**, because Roblox doesn't store purchase history for you ([monetization docs](https://create.roblox.com/docs/production/monetization)).

Recommended learning paths are BrawlDev's Beginner, then GUI, then Advanced playlists (2024-2025), Roblox's official coding fundamentals, and project series like GnomeCode's tower defense. Every source warns that tutorials go out of date ([DevForum](https://devforum.roblox.com/t/beginner-scripter-any-good-tutorials-out-there/3924224); [Roblox Creator Docs](https://create.roblox.com/docs/tutorials/fundamentals/coding-1)).

## Conclusion

The center of Roblox discovery has moved from total popularity to whether a game keeps the players Roblox sends it. For a beginner this is good news: a small game with excellent first sessions and strong day-two returns gets tested on new players every day, with no permanent penalty for a weak start. The flip side is that marketing can't rescue a weak loop. Ad-acquired players don't count toward recommendations, and being featured didn't save games whose retention was falling. Your two most important numbers are qPTR, which reflects whether the thumbnail and title tell the truth, and D1, which reflects whether onboarding works. Everything else builds on those.

The 2025 mega-hits also show where the risks are. They were cheap to build, but their value came from relentless live operations, and most of them shrank once the novelty faded. Roblox's newest incentives point somewhere specific: the 42% higher cash-out rate for 18+ spending in "novel" games, the audience aging up, and stricter rules against dark patterns and random paid items. The best long-term bet is a fairly monetized game with genuine depth, regular updates and events, and social hooks that don't rely on open chat. Copying the latest meme template will cash in on short-lived spikes, but it is not where Roblox is steering creators.

## Playbook / checklist

Citations are inline. **[3P]**, **[self-reported]** and **[unverified]** mark non-official figures.

### 1. Idea selection
- [ ] Pick a loop you can describe in one sentence (collect / grow / steal / survive / compete), with visible progression and rarity ([Wikipedia: Grow a Garden](https://en.wikipedia.org/wiki/Grow_a_Garden)).
- [ ] Check demand: search the fantasy in Roblox Search and Charts, and look at competitors' CCU on trackers such as RoStats or RoTrends **[3P]** ([SozAI](https://sozai.app/transcript/reason-nobody-finds-roblox-game/)).
- [ ] In saturated genres, "mutate" the loop with a twist, and use an original title, art and thumbnail. Near-copies are down-ranked ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).
- [ ] Favor genres that last: roleplay/social, anime action, survival/horror with episodic updates, and simulators with live ops. Simulators decay fastest without updates **[3P]** ([GameDevReports/Newzoo](https://gamedevreports.substack.com/p/newzoo-roblox-as-a-platform-in-2025); [RoWatcher](https://rowatcher.com/news/one-year-on-the-charts-what-really-happens-after-a-roblox-game-goes-viral)).
- [ ] Target a Minimal or Mild maturity label for maximum reach. Consider teen and adult appeal, since 18+ is 37% of US age-checked DAU and monetizes 50%+ better ([Gaming.net](https://gaming.net/roblox-q3-revenue-rises-16-as-bookings-fall-12-to-1-7-billion)).

### 2. Prototyping
- [ ] Timebox the first playable version to days or weeks, not months. Grow a Garden took about 3 days; Kradez took 3-4 days **[self-reported]**; Zyonic took about 1 month **[self-reported]** ([Wikipedia](https://en.wikipedia.org/wiki/Grow_a_Garden); [SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)).
- [ ] Build several small prototypes and keep the one with the best measured retention ([Game Developer: Dungeon Life](https://gamedeveloper.com/business/my-roblox-years-dungeon-life-and-new-product-science)).
- [ ] Playtest with friends or Discord at every stage. Use a separate published test place and fresh alt accounts ([SozAI Zyonic](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md); [SozAI Tizzy](https://sozai.app/transcript/made-3-viral-roblox-games/index.md)).
- [ ] Lock in one art style early ([SozAI](https://sozai.app/transcript/successful-roblox-game-proof-not-luck/index.md)).

### 3. Onboarding (the first 3 minutes)
- [ ] Bounce is measured at 60s and 180s ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery)). Put the core loop in the player's hands within seconds and deliver a "wow" moment early.
- [ ] Auto-equip the first item, preload starter consumables, and teach later systems in context when they first matter **[self-reported]** ([SozAI](https://sozai.app/transcript/made-3-viral-roblox-games/index.md)).
- [ ] Log every onboarding step as an analytics funnel step, and fix the largest drop-off first.
- [ ] Design mobile-first (about 80% of users), with readable UI and good low-end performance ([PocketGamer.biz](https://www.pocketgamer.biz/80-of-roblox-users-are-on-mobile-contributing-46-of-robux-revenue)).

### 4. Retention
- [ ] Targets: D1 ≥ ~12% (median among similar games), stretch goal 20%+. D7 ≥ ~5%. Median session ~10 minutes ([GameDev Reports](https://gamedevreports.substack.com/p/gameanalytics-key-roblox-and-roblox); [DevForum benchmarks](https://devforum.roblox.com/t/analytics-similar-experience-benchmarks-broader-access/2210285)).
- [ ] Optimize for returning on more days, not longer sessions. Playtime counts only up to 60 min/day. Use daily rewards, rotating shop stock, offline progress, and timed exclusives ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [Wikipedia](https://en.wikipedia.org/wiki/Grow_a_Garden)).
- [ ] Build friend play in: invites, joining friends, private and reserved servers, trading, and stealing or showing off. Co-play is a ranking signal ([DevForum RFY thread](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441)).
- [ ] Give each round a satisfying climax, as Kradez did with his 1v1 finale **[self-reported]** ([SozAI](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/)).
- [ ] Read Creator Analytics' Home Recommendations tab. Wait 24h to 3 days before judging a change ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [SozAI](https://sozai.app/transcript/roblox-game-earnings-lessons/index.md)).

### 5. Monetization
- [ ] Add monetization only after retention holds, because Roblox weights retention first ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).
- [ ] Lead with cheap, repeatable developer products, for example 5-50 Robux consumables and boosts. Add a few meaningful game passes rather than many weak ones **[self-reported]** ([SozAI Kradez](https://sozai.app/transcript/2k-ccu-roblox-game-earnings/); [DevForum Liftoff](https://devforum.roblox.com/t/liftoff-a-case-study/468266)).
- [ ] Serve both "tourists" (instant-effect items) and "locals" (battle pass, subscriptions). Add limited-time items and trading ([monetization docs](https://create.roblox.com/docs/production/monetization)).
- [ ] No fake timers, fake sales or pressure wording for kids ([monetization docs](https://create.roblox.com/docs/production/monetization)).
- [ ] For any egg or crate: show odds that add to 100% before purchase, check PolicyService, and offer a fallback ([Paid random items docs](https://create.roblox.com/docs/production/monetization/paid-random-items)).
- [ ] Add a Roblox Plus subscription prompt, a Share Link for Creator Rewards, and private servers. Consider Rewarded Video ([Roblox Plus docs](https://create.roblox.com/docs/en-us/production/monetization/roblox-plus); [Creator Rewards docs](https://create.roblox.com/docs/creator-rewards)).
- [ ] Set prices by script so you can use Managed Pricing later, at 60k+ transactions per 30 days ([Price optimization docs](https://create.roblox.com/docs/production/monetization/price-optimization)).
- [ ] Budget expectations: about $2.66 per 1,000 Robux spent at the standard rate; DevEx minimum 30,000 Robux; median creator ~$1,500/yr ([10-K](https://www.sec.gov/Archives/edgar/data/1315098/000131509826000024/rblx-20251231.htm)).

### 6. Thumbnails, titles and ads
- [ ] Use a custom thumbnail (required for RFY). It must honestly show the gameplay. Don't lead with giveaways ([Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)).
- [ ] Prepare 10-20 thumbnail variants with simple, readable titles. Run thumbnail personalization; it is most useful at 1k+ DAU, and each variant needs at least 7 days. In Roblox's experiment, personalization lifted qPTR by 8.5% on average ([SozAI](https://sozai.app/transcript/roblox-sponsored-ads-explained/index.md); [DevForum](https://devforum.roblox.com/t/live-now-personalize-your-thumbnails-to-attract-more-users/3257233)).
- [ ] Treat ads as a test of your thumbnail and retention, not as a way to train RFY. Ad users are excluded from RFY signals. Start small, around $16/day for 3-7 days **[self-reported]**, and stop when Home impressions overtake ad impressions ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq); [SozAI](https://sozai.app/transcript/roblox-sponsored-ads-explained/index.md)).
- [ ] Post short gameplay clips on TikTok, Shorts and Moments, and reach out to YouTubers. This is how Dead Rails and the Brainrot games spread ([GameAnalytics](https://gameanalytics.com/blog/dead-rails-and-the-hit-makers-formula); [Wikipedia: Steal a Brainrot](https://en.wikipedia.org/wiki/Steal_a_Brainrot)).

### 7. Updates and live ops
- [ ] Patch daily in launch week. Then follow a weekly update cadence, with monthly at minimum ([SozAI](https://sozai.app/transcript/roblox-game-earnings-lessons/index.md); [monetization docs](https://create.roblox.com/docs/production/monetization)).
- [ ] Anchor events to real calendar moments: weekends (Saturday is the traffic peak), summer, July 4, Halloween and holidays. Register them as Experience Events to appear on the Live Events surface ([Discovery FAQ](https://create.roblox.com/docs/discovery-faq); [Experience events docs](https://create.roblox.com/docs/en-us/production/promotion/experience-events)).
- [ ] Run "admin abuse" or limited-drop events to create spikes, and plan for CCU to fall back afterward ([Wikipedia: Grow a Garden](https://en.wikipedia.org/wiki/Grow_a_Garden)).
- [ ] Add an in-game feedback channel. Prioritize new-player problems over hardcore fans' requests ([Game Developer](https://gamedeveloper.com/business/my-roblox-years-dungeon-life-and-new-product-science)).

### 8. Technical best practices
- [ ] Make the server authoritative: validate every RemoteEvent and RemoteFunction, and never accept prices, currency or damage from the client ([DevForum](https://devforum.roblox.com/t/how-do-i-sanity-check-i-dont-understand-how-it-work/2173037)).
- [ ] Save data with session locking (ProfileStore). Version your data schema so you can rebalance the economy without a wipe ([DevForum ProfileStore](https://devforum.roblox.com/t/profilestore-save-your-player-data-easy-datastore-module/3190543); [DevForum Liftoff](https://devforum.roblox.com/t/liftoff-a-case-study/468266)).
- [ ] Log purchases and receipts yourself with DataStoreService ([monetization docs](https://create.roblox.com/docs/production/monetization)).
- [ ] Load-test in a published test place before any traffic push. Bugs and exploits under load killed several games ([DevForum "So your game died"](https://devforum.roblox.com/t/so-your-game-died-a-thread-on-game-design-and-the-market/2644450)).
- [ ] Learn in this order: BrawlDev Beginner, then GUI, then Advanced (or Roblox's coding fundamentals), then project-based series. Build your own projects in parallel ([DevForum](https://devforum.roblox.com/t/beginner-scripter-any-good-tutorials-out-there/3924224); [Roblox Creator Docs](https://create.roblox.com/docs/tutorials/fundamentals/coding-1)).

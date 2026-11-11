# Roblox Discovery and Recommendation System and the Metrics That Drive It (2024-2026)

## How does the Home / Recommended For You (RFY) algorithm work today, and which signals does it use?

### Takeaway
Since its global rollout around March 2025, RFY has ranked games by per-user engagement quality of organically acquired players, not by raw popularity or totals. The main signals are qualified play-through rate (qPTR), first-play bounce rate, play days per user (D1, D2-7, D8-28), and playtime per user, which is capped at 60 minutes per user per game per day. Co-play and monetization signals count as secondary. Home is where more than 90% of platform traffic starts.

### Cited Findings
- RFY has two stages. **Retrieval** picks candidate games using signals such as engagement, retention and monetization. **Ranking** then personalizes and orders them. Roblox says it "doesn't count the engagement, monetization, or retention of users first acquired from ads." — [Roblox Creator Hub: Discovery](https://create.roblox.com/docs/discovery)
- Signals the docs list as **most important**: play-through rate; first-play bounce rate (a negative signal, measured in two buckets: under 60 seconds and 61-180 seconds); play days per user (D1, D2-7, D8-28); and playtime per user ("maximum of 60 minutes per user, per game, per day"). Signals listed as **important**: intentional co-play days per user (joins, invites, private servers); qualified play sessions per user; spend days per user; Robux spent per user. — [Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- The March 31, 2025 DevForum announcement defines qPTR as "the number of engaging plays divided by the number of impressions from Recommended For You." It names these signals: 7-day playtime per user (60 min/day cap), 7-day play days per user, 7-day spend days per user, 7-day Robux spent per user, and 7-day intentional co-play days per user. Weights are not disclosed, and Roblox says no single signal dominates. Most signals refresh within 24 hours, and changes usually appear in impressions a few days later. Roblox's example: a qPTR dip on Feb 28 was followed by an impression drop on Mar 3. — [DevForum: Boost Your Discovery with the Improved RFY Algorithm (Mar 31, 2025)](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441)
- A Roblox staff reply in that thread says qPTR moved from a unique-user-level measure to a **session-level** measure (qualified plays divided by impressions), and session-level values are usually lower. — [same DevForum thread](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441)
- Dec 11, 2025 update: signal tweaks and bug fixes. Play in reserved servers now counts as intentional co-play, and clicks and plays are attributed only to RFY for all signals. Roblox said most games should see "minimal to no change." — [same DevForum thread](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441)
- Signals are **per-user averages, not totals**, so "smaller experiences with highly engaged users are not disadvantaged." Roblox says it "is focused on per user engagement, not total engagement." — [Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- Discovery's stated goal is "lasting value," meaning long-term retention plus long-term monetization. Games strong in only one of these still get impressions, but games strong in both get broader distribution. Roblox's advice is to fix core gameplay and retention first, because monetization helps once retention is strong. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- How signals are timed: PTR and bounce cover only the first session of organic RFY users. D1 covers playtime, play days, spend and co-play. Then come D2-7 (play days measured out of 6) and D8-28. New games are scored on early signals right away and do not wait 28 days. A strong D8-28 signal is unlikely if D1 and D2-7 are weak. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- **Explore/expand:** Roblox tests a game on new user cohorts every day. If those cohorts engage and monetize, the game is shown to more similar cohorts. Weak early performance carries no permanent penalty, and retrieval needs only "a very low minimum number of plays," so old games can grow again. — [Creator Hub: Discovery](https://create.roblox.com/docs/discovery); [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- The candidate pool narrows to about 100 games on each user's Home. qPTR may dip temporarily when impressions surge during initial discovery, and Roblox calls this normal. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- Four things move impressions: your own updates, Roblox algorithm changes, total Home traffic (weekly peak on Saturday, plus summer/back-to-school and holidays), and competitors' performance. Roblox's example: a 50% signal gain can produce little impression growth if competitors improve more. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- Genre is not an explicit ranking factor. Story-driven and finite games are not penalized for lower long-term retention. Inaccurate genre tags or descriptions hurt because they cause bounces. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- Scale: discovery serves more than 10.5B impressions per day, up from 7.5B a year earlier, and over 90% of platform traffic begins on Home (as of Mar 19, 2025). — [DevForum: Roblox's 2025 Discovery Roadmap](https://devforum.roblox.com/t/roblox’s-2025-discovery-roadmap-and-ways-to-reach-and-engage-your-audience/3557533)
- Creator Analytics has a "Home Recommendations" tab (Acquisition) showing impressions, plays, per-signal trends, and benchmark comparisons against similar games. Benchmarks "do not impact the Recommended for You algorithm in any way." — [Creator Hub: Discovery](https://create.roblox.com/docs/discovery)
- Outside analysis of the RFY effect (Dubit, Top 20 visits data):
  - Mature games (24+ months old) went from 84% of Top 20 visits before RFY to 18% six months after. Games under 6 months old went from 1.3% to 60.7%.
  - Top 20 total visits rose from 8.0B (Jul 2024) to 28.7B (Aug 2025).
  - The #1 game went from a 2.2B-visit peak (Blox Fruits, Dec 2024) to over 7B. Grow a Garden reached 8.1B visits and a 48.1% share in Jun 2025. Steal a Brainrot hit 9.9B in Aug 2025.
  - Median Top 20 tenure fell from 14 months to 7 months, and only 7 of the Jul 2024 Top 20 remained by Dec 2025.
  - Methodology is only partly disclosed. — [Dubit blog](https://dubit.io/blog/roblox-top-20-rfy)

### Inferences
- In practice, the levers are: (1) the thumbnail/title-to-gameplay promise, which drives qPTR and bounce; (2) the first 3 minutes of onboarding, where bounce is measured at 60s and 180s; (3) reasons to come back daily (play days D1/D2-7/D8-28); (4) friend play (joins, invites, private and reserved servers); (5) monetization only after retention is solid.
- The 60 min/day playtime cap means AFK farming or very long sessions add nothing beyond an hour. Returning on more days matters more than longer single sessions.
- Per-user averaging plus daily explore cohorts makes the system unusually open to new or small games. The Dubit data on Top 20 turnover is consistent with this, though not proof of causation.

### Gaps
- Signal weights and the exact definition of an "engaging/qualified" play (minimum seconds) are not public.
- I found no official qPTR threshold or "good" value. Benchmarks appear only as percentile ranges inside Creator Analytics.
- I found no RDC 2024 talk transcript with additional algorithm detail. This report relies on the docs and DevForum.

## Benchmark values: D1/D7/D30 retention, session time, CCU

### Takeaway
The broadest dataset (GameAnalytics 2026 Roblox Report, Aug 2025-Jul 2026, games with 1M+ MAU) gives a **median D1 of 10.3%, D7 of 1.6% and D30 of 0.5%**. The top 1% reach D1 22.2%, D7 9.1% and D30 4.7%. Median game session length is 9.8 min. Many blogs cite "20% D1 good / 40% excellent," which looks inflated. Roblox's own benchmarks are percentile ranges against similar games.

### Cited Findings
- GameAnalytics 2026 Roblox Report (data Aug 2025-Jul 2026; games with 1M+ MAU only, so medians would be lower across all games), as summarized by GameDev Reports (Sep 25, 2026). — [GameDev Reports summary](https://gamedevreports.substack.com/p/gameanalytics-key-roblox-and-roblox)
  - Retention: D1 median 10.3%, top 1% 22.2%; D7 median 1.6%, top 1% 9.1%; D30 median 0.5%, top 1% 4.7%.
  - Game session length: median 9.8 min, top 5% 16.6 min, top 1% 21.1 min. Player session across all of Roblox: median 7.28 min, top 1% 74.82 min.
  - Sessions per day per game: median 1.56, top 10% 3.22, top 1% 8.3.
  - Playtime per player per day (games): median 22.4 min, top 10% 123.85 min, top 1% 404.98 min.
  - Payer conversion: 3.80% of players spent in 2026, down from 4.2% two years earlier. ARPPU per game: median $0.70, top 10% $2.33, top 1% $55.31.
- Roblox Creator Analytics shows "similar experience" benchmarks at the 50th-90th percentile for D1/D7/D30 retention, average session time and monetization. A DevForum example gives a D1 range of 12.4%-24.1% for p50-p90. Benchmark scorecards require 100+ DAU. (The benchmark feature launched in 2023 and the overview was refreshed in Aug 2024.) — [DevForum: Similar experience benchmarks](https://devforum.roblox.com/t/analytics-similar-experience-benchmarks-broader-access/2210285); [DevForum: New Experience Overview with Insights, Benchmarks, Realtime](https://devforum.roblox.com/t/analytics-new-experience-overview-with-insights-benchmarks-realtime/3108840)
- Third-party blogs give much higher numbers. Examples: top-100 games at D1 45-60%, D7 25-35%, D30 12-20%; average games at D1 15-25%; a healthy obby at D1 25-35% and D7 10-15%. These sources are less rigorous and use unclear samples, so treat them with caution. — [Endsights](https://endsights.com/roblox-games-fail); [RoWatcher genre benchmarks](https://rowatcher.com/news/retention-benchmarks-by-roblox-genre-what-good-actually-looks-like)
- Platform scale context: 111.8M DAU in Q2 2025, up 41% YoY. — [DevForum: RDC25 What we announced](https://devforum.roblox.com/t/rdc25-what-we-announced/3920245)

### Inferences
- Working targets: D1 above about 12% puts a game at least at p50 in Roblox's example range, and about 22-24% is p90 / top-1% territory. D7 above about 5% and D30 above about 2% appear strongly above median on the GameAnalytics data.
- The large gap between GameAnalytics and the blogs likely reflects survivorship bias in the blogs, which sample games that are already in the top 100.

### Gaps
- I found no reliable published CCU benchmarks for "successful" games, such as a CCU needed to hit the front page.
- No official Roblox-published platform-wide retention medians were found.
- The GameAnalytics figures come via a secondary Substack summary. The primary report PDF was not fetched.

## Role of thumbnails, icons, titles, updates, events, ads, search, social features, Today's Picks and Sorts

### Takeaway
A custom thumbnail is mandatory for RFY impressions. Thumbnail personalization raised qPTR by about 8.5% on average. Ads bring users, but those users are excluded from RFY signals. Events, Today's Picks, Charts and Search are secondary surfaces. Social co-play is an explicit ranking signal.

### Cited Findings
- **Thumbnails, titles and metadata:**
  - "A custom thumbnail is required for your game to receive impressions from homepage recommendations." — [Creator Hub: Discovery](https://create.roblox.com/docs/discovery)
  - Games get less exposure if their metadata leads with monetary rewards or giveaways, is mismatched or misleading, or if the game is non-unique. Near-identical copies are down-ranked in favor of whichever game first had the unique metadata or placefile. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
- **Thumbnail personalization (live since late 2024):**
  - It uses a multi-armed bandit rather than an A/B test. Traffic starts evenly split and shifts to winners within hours.
  - In the experiment phase, qPTR rose by +8.5% on average, and some games saw +50%.
  - Games under 1,000 DAU may not see meaningful results, and Roblox's top tip is not to restart the test every day. — [DevForum: Personalize your thumbnails](https://devforum.roblox.com/t/live-now-personalize-your-thumbnails-to-attract-more-users/3257233); [DevForum: 5 Tips From Roblox Staff](https://devforum.roblox.com/t/5-tips-from-roblox-staff-to-get-the-most-out-of-thumbnail-personalization/3471689); [GamesBeat](https://gamesbeat.com/roblox-will-let-game-devs-personalize-thumbnails-to-attract-more-players/)
  - Keep each variation live for at least 7 days between changes. — [DevForum 2025 Roadmap](https://devforum.roblox.com/t/roblox’s-2025-discovery-roadmap-and-ways-to-reach-and-engage-your-audience/3557533)
  - A later update made personalization remember existing winning thumbnails. — [DevForum](https://devforum.roblox.com/t/thumbnail-personalization-now-remembers-your-existing-winning-thumbnails/3793665)
  - Some developers report the system picking lower-qPTR thumbnails, for example 0.5% vs 0.35%. — [DevForum bug thread](https://devforum.roblox.com/t/thumbnail-personalization-consistently-picking-worst-performing-qptr-thumbnail-is-this-a-bug/3272087)
- **Updates:** Updates and gameplay changes affect Home signals and can raise impressions, but competitors' gains can offset them. Quality is reclassified with each update. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq); [Creator Hub: Discovery](https://create.roblox.com/docs/discovery)
- **Ads / Sponsored:**
  - Ads do not hurt RFY. Ad-acquired users' engagement, retention and spend are excluded from RFY signals, and those users generally won't see the game in RFY, so RFY impressions can dip while total acquisition rises. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq)
  - RDC 2025 ads recap (Sep 10, 2025):
    - Cost per play is "over 71% cheaper," and a player can be acquired for under $0.01.
    - The 5 newest games to reach the top 20 by earnings all started with Sponsored Experience ads.
    - In lift studies, a typical advertised game saw +150% impressions, +24% plays and +16% playtime.
    - Over 45,000 creators used Ads Manager, up 70% YoY.
    - 1 Ad Credit now costs 263 Robux, down from 285.
    - A "Maximize Spend" objective was planned for early 2026. — [DevForum: Ads for Creators RDC Recap](https://devforum.roblox.com/t/ads-for-creators-rdc-recap-and-what%E2%80%99s-next/3929106)
  - Ads Manager bids are expressed as CPM. 17+ experiences can't use the Visits objective. — [Creator Hub: Ads Manager](https://create.roblox.com/docs/production/promotion/ads-manager)
- **Events:**
  - The updated event promotion system raised experience-event participation by 266% during its experiment (DevForum, date not confirmed, likely late 2024). — [DevForum: updated event promotion system](https://devforum.roblox.com/t/join-us-we%E2%80%99ve-updated-our-event-promotion-system/3282942)
  - The Home "Live Events" surface lists games with limited-time events and allows up to 5 event thumbnails. — [Creator Hub: Discovery](https://create.roblox.com/docs/discovery)
  - A Charts sort, "Trending Events in Experiences," ranks active events by DAU. — [Creator Hub: Experience events](https://create.roblox.com/docs/en-us/production/promotion/experience-events)
  - A developer reported that Today's Picks and Roblox site-event teleports hurt their RFY signals: -58% WoW impressions and some signals down up to 80%. This is an unverified developer report. — [DevForum report](https://devforum.roblox.com/t/todays-picks-and-site-events-negatively-effecting-a-games-home-recommendation-signals/4042042)
- **Today's Picks / curated:**
  - Today's Picks is a curated Home sort, piloted in 2024. — [DevForum: Introducing Today's Picks (Pilot)](https://devforum.roblox.com/t/introducing-today%E2%80%99s-picks-a-new-curated-sort-on-home-pilot/2910867)
  - It got personalized position on Home on Mar 28, 2025. — [DevForum: Personalized Discovery](https://devforum.roblox.com/t/building-the-future-of-roblox-home-and-search-introducing-personalized-discovery/3432124)
  - "Standout Games" is a hand-curated surface for novel mechanics and underrepresented genres. — [Creator Hub: Discovery](https://create.roblox.com/docs/discovery)
- **Search:**
  - Search now uses semantic search across supported languages, so natural-language queries like "food games" work. — [Creator Hub: Discovery](https://create.roblox.com/docs/discovery)
  - "Recently Visited" was added to Search (Jan 2025). — [DevForum: Personalized Discovery](https://devforum.roblox.com/t/building-the-future-of-roblox-home-and-search-introducing-personalized-discovery/3432124)
  - One-click genre tags were added to the Search landing page (Dec 12, 2025), and Roblox said it would invest more in search and genre discovery in 2026. — [DevForum: Personalized Discovery](https://devforum.roblox.com/t/building-the-future-of-roblox-home-and-search-introducing-personalized-discovery/3432124)
  - Search ads were due to move into the new Ads Manager in late 2025. — [DevForum: Ads RDC Recap](https://devforum.roblox.com/t/ads-for-creators-rdc-recap-and-what%E2%80%99s-next/3929106)
- **Social:**
  - Intentional co-play days per user (joins, invites, private servers, and reserved servers since Dec 2025) is a ranking signal. — [DevForum RFY thread](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441)
  - Home has Friends List and "People You May Know" rows, which have been dynamically positioned since Jan 2025. — [DevForum: Personalized Discovery](https://devforum.roblox.com/t/building-the-future-of-roblox-home-and-search-introducing-personalized-discovery/3432124)
  - A Friend Referral system (referral links in invite prompts) was on the 2025 roadmap. — [DevForum 2025 Roadmap](https://devforum.roblox.com/t/roblox’s-2025-discovery-roadmap-and-ways-to-reach-and-engage-your-audience/3557533)
- **Charts / Sorts (Discover page):**
  - The 2024 test added Top Charts and new sorts: Top Trending, Top Revisited, Fun with Friends. — [DevForum: Enhanced Discover Page test](https://devforum.roblox.com/t/testing-an-enhanced-discover-page-top-charts-and-new-sorts/2954676)
  - A CCU-based sort ("Hot Right Now," later "Top Playing Now") went live globally around Apr 29, 2025. — [DevForum: Top Playing Now](https://devforum.roblox.com/t/introducing-top-playing-now-on-charts/3529809)
  - Genre filters and console/VR support were planned for Charts. — [DevForum 2025 Roadmap](https://devforum.roblox.com/t/roblox’s-2025-discovery-roadmap-and-ways-to-reach-and-engage-your-audience/3557533)

### Inferences
- Thumbnail work feeds directly into qPTR, which is the first gate. Personalization is most useful above about 1k DAU, and each variant needs at least 7 days.
- Paid ads are a way to get initial plays, not a way to "train" RFY, because ad users are excluded from signals. Organic RFY growth still depends on retention from organic cohorts.

### Gaps
- No official numbers were found on how much traffic Today's Picks or Live Events deliver.
- No current official CPM/CPP price list exists. Ads Manager shows live estimates in-account.

## Recent changes to discovery (2024-2026)

### Takeaway
The main changes:
- 2024: Charts and Discover page revamp, then thumbnail personalization in late 2024.
- Jan 2025: dynamic Home row positioning.
- Mar 2025: improved RFY with per-user signals and a creator analytics tab.
- Apr 2025: CCU chart.
- Aug 2025: tile subtitle tests with genre and social-proof labels.
- Sep 2025: Roblox Moments short-video beta and cheaper ads.
- Dec 2025: signal refinements plus Search genre tags.
- 2026: homepage ad unit and more search investment.

### Cited Findings
- Jan 31, 2025: "People You May Know" and "Continue" are dynamically positioned. RFY itself is unchanged by this. Mar 28, 2025: Today's Picks got personalized positioning, and dynamic Sponsored ranking was planned. Dec 12, 2025: the first two Continue slots are fixed to the user's last two played games, and genre tags were added to Search. — [DevForum: Personalized Discovery](https://devforum.roblox.com/t/building-the-future-of-roblox-home-and-search-introducing-personalized-discovery/3432124)
- Mar 19, 2025 roadmap: improved RFY prioritizing organic long-term retention, Friend Referral system, written user feedback after ratings, an Ads Manager upgrade, down-ranking of misleading titles and thumbnails, and "Recommended Paid Access Experiences." — [DevForum 2025 Roadmap](https://devforum.roblox.com/t/roblox’s-2025-discovery-roadmap-and-ways-to-reach-and-engage-your-audience/3557533)
- Mar 31, 2025: the improved RFY algorithm and the Home Recommendations analytics tab. Dec 11, 2025: signal refinements (reserved-server co-play, RFY-only attribution). — [DevForum RFY thread](https://devforum.roblox.com/t/boost-your-discovery-with-the-improved-recommended-for-you-algorithm-and-analytics-for-creators/3587441)
- Nov 2024 (preceded by a Jul 2024 test): thumbnail personalization went live. — [DevForum](https://devforum.roblox.com/t/live-now-personalize-your-thumbnails-to-attract-more-users/3257233); [Jul 2024 test](https://devforum.roblox.com/t/testing-personalized-thumbnails-in-home-this-july/3039419)
- Aug 29, 2025: Roblox began testing RFY tile subtitles that show genre (e.g., "Survival") or social-proof labels ("Top Trending," "Up-and-Coming") instead of ratings. The goals are higher engagement and qPTR, and no results have been published. — [DevForum: Improving Game Discovery With Relevant Information](https://devforum.roblox.com/t/upcoming-tests-improving-game-discovery-with-relevant-information/3907203)
- Sep 5, 2025 (RDC25): Roblox Moments beta launched as a short-form gameplay-clip feed. Clips are up to 30s, and viewers can tap "Join" to enter the game. It is 13+ only, according to secondary press. Moments APIs were announced as "coming soon," and Roblox is sharing the source of its Moments experience. "Experience Betas" will let creators test with small audiences without entering search or discovery. — [DevForum: RDC25 What we announced](https://devforum.roblox.com/t/rdc25-what-we-announced/3920245); [Roblox newsroom RDC 2025](https://about.roblox.com/newsroom/2025/09/roblox-rdc-2025); [Canaltech](https://canaltech.com.br/games/roblox-aposta-em-ia-para-acelerar-criacao-de-jogos-e-lanca-moments-seu-tiktok/)
- CES 2026: Roblox announced a CPM-based Homepage ad format. This comes from secondary press and was not verified against a primary source. — [Outlook Respawn](https://respawn.outlookindia.com/amp/story/gaming/gaming-news/roblox-unveils-homepage-ad-format-and-expands-buying-at-ces-2026)
- Fairness for small games: Roblox's official position is per-user averages, daily exploration of new cohorts, and a very low play minimum for retrieval. — [Discovery FAQ](https://create.roblox.com/docs/discovery-faq). Dubit's Top 20 data shows new games (under 6 months) rising to 60.7% of Top 20 visits after RFY. — [Dubit](https://dubit.io/blog/roblox-top-20-rfy)

### Inferences
- Discovery has moved from popularity-based sorts to personalized, engagement-quality ranking. Charts (CCU, trending) are now secondary surfaces where popularity still matters.

### Gaps
- **The removal of an "Up-Votes" / "Top Rated" sort and a new "Most Engaging" sort could not be confirmed.** I found no official Roblox post on either. Some developers claim "Friends Playing" and Up-and-Coming visibility were removed or reduced, but this is unverified and the posts are older.
- No 2026 primary-source changes to the RFY algorithm itself were found beyond the Dec 2025 refinement. No results have been published for Moments-driven discovery traffic or for the subtitle test.

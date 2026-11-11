# Game design, retention and release

## Start with a testable promise — recommended
Describe the game in one sentence: a player does an action, gets legible feedback, makes progress and chooses what to do next. Decide what makes that action enjoyable before creating a long upgrade ladder.

Examples for prototypes:
| Genre | Small complete loop | Main learning risk |
|---|---|---|
| Obby | Reach checkpoint, fail, retry, finish | Fair controls and readable hazards |
| Tycoon | Earn, buy, see production change | Whether upgrades change decisions |
| Tower defense | Place, defend one wave, upgrade | Clear targeting and pacing |
| Horror | Explore, detect a threat, escape | Readability and predictable rules |
| Simulator | Perform action, earn, spend, unlock | Repetition without meaningful choice |

These are scope examples, not claims about what will become popular. Build one loop, one map segment and one progression choice before expanding.

## Retention and funnels — documented
D1/D7/D30 retention follows cohorts from their first visit; later cohorts need enough elapsed time before their later-day values appear. Roblox highlights core loop, first-session experience and performance when improving D1. [Retention, S17](https://create.roblox.com/docs/production/analytics/retention).

Funnel events track progression through onboarding, game progression or a shop. [Funnel events, S18](https://create.roblox.com/docs/production/analytics/funnel-events). Recommended first-session funnel:
```text
join -> controls available -> first meaningful action
     -> first reward -> first upgrade/choice -> loop repeated
```
Give events unambiguous definitions. Record build version, acquisition source, device and cohort sizes where supported/appropriate. Avoid logging private free-text player content.

## Turn reports into experiments — recommended
For each change, write a hypothesis, primary metric, guardrail and observation window before shipping. Compare equivalent traffic/cohorts and keep sample counts. Friends, testers, a marketing campaign or a device mix change can distort averages. A before/after chart without controlled traffic is suggestive, not causal proof.

Example: “A visible first objective reduces exits before the first reward.” Measure objective completion and early exits; also check performance and later progression. Do not use a revenue metric as the only signal that an onboarding change helped.

Community reports show both claimed gains and no improvement from daily rewards. Read [05-community-evidence](05-community-evidence.md). Try rewards only after finding the actual bottleneck; do not promise a retention percentage.

## Discovery and presentation — documented plus recommendation
Roblox describes discovery as systems that surface and rank experiences, with evaluation of user engagement. Its FAQ should be rechecked rather than treating an old creator's algorithm theory as a permanent rule. [Discovery FAQ, S19](https://create.roblox.com/docs/discovery-faq).

Make icons, thumbnails and descriptions accurately communicate the playable experience. Test whether new visitors understand that promise and reach the corresponding moment. Paid acquisition should be an explicit budgeted experiment after basic quality/analytics are ready; this research did not purchase ads.

## Publishing and live operation — documented plus recommendation
New games are initially restricted; publishing a place and releasing it to the public are separate steps. Games can contain multiple places. Verify current account, audience and content requirements in Creator Hub. [Publishing, S20](https://create.roblox.com/docs/production/publishing/publish-games-and-places).

Before release: archive a known-good version, record configuration/asset ownership, finish the acceptance matrix, check content disclosures and define rollback/recovery. Roll out changes cautiously. A source-code rollback may be incompatible with migrated saves, so test that boundary separately.

Studio supports simultaneous collaboration, with current eligibility/access requirements. [Collaboration, S21](https://create.roblox.com/docs/projects/collaboration). Git source collaboration still needs the file/branch discipline in this snapshot's [protocol](COLLABORATION.md).

# Learning-experience reviews

Twenty-two reviews of the learning system, each from a different angle, done while building the site.

**How to read the estimate.** The percentage is a judgement of how likely a motivated person who studies daily is to
learn and keep the course content. It is an informed estimate made by the builder, not a measurement: no real learners
have used the site yet. The target was 76%; whenever the estimate was below that, the system was changed.

Evidence came from three places: the automated tests and learner simulations (`node tests.mjs`), an audit script that
counts exercise types over simulated months, and using the site in a browser.

| # | Angle | What was checked | Finding and change | Estimate |
|---|-------|------------------|--------------------|----------|
| 1 | Recall vs recognition | Simulated 60 days and counted exercise types | Reviews stayed multiple-choice until the third review, about 11 days in. Changed so the first review is cued recall and production starts at the second. | 62% |
| 2 | First lesson | Fresh start in the browser | The learner was dropped straight onto a word card with no orientation. Added a short "How lessons work" card to the first lesson. | 64% |
| 3 | Pronunciation without sound | The test machine has only an English voice | Without a voice there was no pronunciation guidance at all. Added a "How it sounds" card to the first lesson and a full sound guide in the Library. | 64% |
| 4 | Words in context | Looked at the new-word card | Words appeared in isolation. New-word cards now show an example sentence from the same unit when one exists (152–182 of 280 words, depending on language). | 66% |
| 5 | Speaking share | Audit of "speak and write" mode | Only about 11% of steps asked the learner to speak. Recall now mixes speaking with typing; speaking is about 15% of steps, plus saying each new item aloud. | 68% |
| 6 | Multiple-choice quality | Browser, first lesson | A wrong option came from a later, unseen unit, so the answer could be found by elimination. Wrong options now come from the same unit first. | 69% |
| 7 | Fairness of typed answers | Tests with slips and variants | A long sentence failed on three small slips, and a correct variant (for example a feminine form) was rejected. Tolerance now scales with sentence length, accepted slips show the exact form, and a "My answer was right" button exists. | 70% |
| 8 | Workload vs chosen time | Simulated all paces | Average session length stayed at or under the chosen time at every pace. No change needed. | 70% |
| 9 | Struggling learner | Simulated 60% accuracy | New material slows automatically when reviews pile up; sessions run about 40% over on the 10-minute plan. Left as is; slower is the right response. | 70% |
| 10 | Missed days | Simulated skipping every third day | Sessions stay bounded and new material is throttled. Added a "Short on time? Reviews only" session so a busy day still keeps the habit. | 71% |
| 11 | Monotony | Speak-only lesson in the browser | The lesson ended with a dozen identical "say it" steps. Recall is now spread through the lesson, each group recalled after the next one, which also spaces practice within a session. | 73% |
| 12 | Coming back the next day | Browser with dates shifted by one day | Reviews of yesterday's items come first, then new items. Works as intended. | 73% |
| 13 | Interruptions | Reloaded mid-lesson; paused with Esc | The lesson resumes on the same step and a message confirms the place is saved. Works as intended. | 73% |
| 14 | Listening | English course, which has a voice on the test machine | Listening and dictation steps work. Added "Listen and repeat" for each unit in the Library, with a pause after each sentence. | 75% |
| 15 | Grammar | Read the notes for each language | Six short notes per language appear once in a lesson and stay in the Library. Enough for a beginner course; no change. | 75% |
| 16 | Motivation | Looked at the end-of-session screen | Added a milestone when a unit is completed, next to the streak and session figures. | 76% |
| 17 | Honest numbers | Progress page after an all-correct lesson | It showed 67% correct because tip and intro cards were counted as unanswered. Fixed; only graded steps count. | 76% |
| 18 | Keyboard comfort | Typed a wrong answer with a real keyboard | Focus was lost after a wrong typed answer. Fixed; Continue is focused. | 76% |
| 19 | Learners who know some already | Tests of placement | Someone at elementary level starts at unit 9; skipped units return as reviews to confirm them. Works as intended. | 76% |
| 20 | Learning from a related language | Italian explained in French | Some pairs are identical (tu = tu), which makes those items trivial. New material comes 25% faster for these learners. Noted, no change. | 76% |
| 21 | Content accuracy | Re-read the sentences; automated checks for duplicates and ambiguous options | No duplicate or ambiguous items in any language pair. The translations were written by the builder and have not been checked by native speakers. | 76% |
| 22 | Overall, with and without a voice | Compared the audio and no-audio paths | With a voice on the device: about 78%. Without one, reading and writing still work but speaking and listening goals are at about 60%. Made the voice setup help prominent, with steps per system and a re-check button. | 78% with a voice |

## What still limits learning

- **No voice, no sound.** The site never uses online voices, so audio depends on a voice being installed on the device.
- **Speaking is self-graded.** Nothing on the site listens to the learner; speech recognition in browsers needs a server.
- **The course is a foundation.** 460 words and sentences per language is beginner level. The plan page says so.
- **The interface is English.** Translations can be shown in any of the six languages, but menus and instructions are in English.
- **Translations are unverified.** They were written carefully and checked mechanically, not reviewed by native speakers.

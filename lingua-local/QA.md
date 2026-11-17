# Quality review

## 22 source and data checks

These focused checks ran in JavaScript orchestration. They are not 22 user studies and do not establish a learning probability.

1. 48 complete expressions: PASS
2. 6 language selectors: PASS
3. No external resource URLs: PASS
4. No external library imports: PASS
5. Local voice filter: PASS
6. No speech recognition: PASS
7. 15 minute minimum: PASS
8. Separate writing mode: PASS
9. Multiple known languages: PASS
10. Self-reported levels: PASS
11. Multiple target courses: PASS
12. Resume saved session: PASS
13. Persistent progress: PASS
14. Storage failure notice: PASS
15. Backup export: PASS
16. Backup validation: PASS
17. Import preserves existing profiles: PASS
18. Delayed recall scheduling: PASS
19. Mistake retry: PASS
20. Accent-aware answers: PASS
21. Accessible feedback: PASS
22. No fluency guarantee: PASS

JavaScript parsed successfully with the Function constructor.

## Live browser review — 17 November 2026

Deployment confirmed reachable at https://brknue.github.io/Claude/lingua-local/ after GitHub Pages finished its build. Initial pre-deployment visit returned 404.

TinyFish run: https://agent.tinyfish.ai/runs/75849ef2-4309-400a-aa25-37e854dbd49c

Walkthrough 1 observed: profile creation, German/Spanish targets, 15 minute writing plan, lesson start, wrong-answer feedback, reveal, Again rating, pause and resume, phrase search, switching to Spanish.

Walkthrough 2 observed: second profile, 30 minute speaking-only plan, absence of typing input, six-expression German unit completion, settings and return to first profile. The tester left default German selected alongside Turkish, so Turkish-specific speaking practice was NOT completed. Known-language A2 selection was not conclusively documented. Pause/resume was observed, but the report does not establish a full reload test.

Final desktop visual review: readable headings, calm colors, working navigation, generous spacing, no reported horizontal overflow. No functional errors reported in these observed flows.

## Remaining verification and scope

Not verified: actual network-disabled reload, downloadable-file persistence, installed voice playback, backup export/import round trip, actual mobile viewport/device, full keyboard traversal, durable persistence after a full browser restart. Source inspection cannot substitute for these checks. No claim of production readiness or comprehensive browser compatibility is made.

Curriculum contains 48 expressions per language across eight beginner units. It is a foundation, not a complete fluency course. Self-reported levels are stored but do not implement diagnostic placement or advanced lessons. Speaking is self-assessed. No evidence supports a numerical 76% learning-success estimate.

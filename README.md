# CCAR-F prep kit

A local toolkit for preparing for the **Claude Certified Architect – Foundations (CCAR-F)** exam.

| What | Where |
|---|---|
| How to prepare: blueprint, answer heuristics, study plan, exam-day tips, from official docs and real takers | [docs/PREPARATION_GUIDE.md](docs/PREPARATION_GUIDE.md) |
| Comparison of existing prep solutions | [docs/COMPARISON.md](docs/COMPARISON.md) |
| Raw research notes with sources | [docs/research/](docs/research/) |
| Local exam emulator | [emulator/](emulator/) |

## Run the emulator

Requires Node 18+. No dependencies to install.

```bash
cd emulator && npm start
```

Then open <http://127.0.0.1:4317>. Set the `PORT` environment variable to change the port.

```bash
cd emulator && npm test
```

```bash
cd emulator && npm run validate
```

`npm test` runs the engine tests; `npm run validate` checks the question bank and prints coverage.

## Exam behaviour the emulator reproduces

| Real exam (official guide v1.1 + taker reports) | Emulator |
|---|---|
| 60 items, 120 min, clock doesn't pause | ✅ countdown, warnings at 15/5/1 min, auto-submit at 0. The clock keeps running if you close the tab, and the session resumes on reload |
| 4 scenarios drawn at random from 6; items framed by a scenario | ✅ random 4-of-6 draw, items grouped in scenario blocks, scenario text shown on each item |
| Domain weights 27/18/20/20/15 | ✅ greedy blueprint-weighted selection within the drawn scenarios |
| Multiple choice + multiple response ("Select TWO") | ✅ enforces the exact number of selections, no partial credit |
| Confidentiality agreement before the exam | ✅ simulated NDA screen (declining ends the session) |
| Flag for review, review screen, move back and forth | ✅ flag (`F`), review grid by scenario, filters for flagged/unanswered |
| End exam, then no return | ✅ double confirmation, then locked |
| Scaled score 100–1000, pass 720 | ✅ approximate scaling. The raw cut is configurable (default 72%) because the real cut is unpublished |
| Score report with % per domain | ✅ by domain, scenario and task statement, plus a weakest-domain drill |
| Answer options shuffled | ✅ per form, reproducible from the seed |
| Option elimination | ✅ right-click an option to strike it through |

Extra study modes: practice sets with instant per-option feedback, domain drills, scenario drills, a "missed questions" retry, and a history chart of your scores against the 720 line.

## The question bank

There are **149 original questions** (22–28 per scenario, 11 of them multiple-response), written against the public exam guide's 30 task statements. Every option has a "why" rationale. They are **not** real exam items. Anthropic's policy forbids sharing those, so dump material is deliberately excluded.

The bank is too small to keep forms fresh for long. Each form draws 60 of the roughly 100 questions in its four scenarios, so overlap starts early: even with repeat avoidance, your second mock repeats about 14 of 60 questions and your third about 36. Treat your **first** full mock as the honest reading, use later ones for timing and domain review, and switch to other sources for fresh items (see the comparison doc).

Items are picked round-robin across the four drawn scenarios toward the blueprint weights. Average coverage per form is about D1 16, D2 10, D3 12, D4 13, D5 9, against the blueprint's 16/11/12/12/9. A test checks all 15 possible scenario combinations and requires every domain to reach at least 60% of its target on each form. The weakest combinations get 8 D2 or 8 D3 items.

### Quality checks

The bank is calibrated against the 12 official sample questions in the exam guide (v1.1). Their lengths were measured from the PDF and are accurate to about ±10%. `npm test` includes `tests/bank-quality.test.mjs`, which fails the build if any of these drift:

| Check | Official samples | This bank | Test limit |
|---|---|---|---|
| Question text, median words | ~55 | 55 | 48–65 |
| Questions of 60+ words | ~40% | 34% (max 100) | 30–60% |
| Answer option, average words | ~18 | 17 | median 14–24 |
| Words per question (text + options) | ~125–130 | 126 | — |
| Words per 60-item exam | ~7,800–8,000 | ~7,600 | — |
| Scenario intro, words | ~50 | ~40 | ≤ 65 |
| Correct answer is the single longest option | not systematic | 26% | ≤ 35% |
| Correct ÷ wrong option length (median) | ≈ 1 | 1.00 | 0.8–1.25 |
| Wrong options under 8 words | none | 0 | ≤ 5% |

**How the questions are written**, following the official samples and takers' reports:
- **Detail lives in the question, not the scenario intro.** Questions restate the situation with concrete metrics, targets, tool names, log lines and constraints. Scenario intros are short framing.
- **Several plausible answers.** The wrong options are mostly real techniques, such as few-shot examples, prompt-based rules, classifiers, retries, caching, a bigger context window or consensus voting. They're wrong because the question states a constraint that rules them out: "zero tolerance", "no new infrastructure", "API can't change", "a 4-minute target", "one file to maintain". About 40% of questions include a distractor that is explicitly "partly right" (it would help, just not best). To get these right, read the constraint, not just the technique.

**Naive strategies score below the pass mark:** always longest 28%, always shortest 27%, random about 24% (ties broken randomly). Picking options that contain words like *hook*, *structured*, *explicit* or *calibrated* scores about 37%. That means the bank still rewards the exam's core principles somewhat directly, so treat a score here as optimistic, and confirm readiness on banks by other authors (see [Other exam engines to try](docs/COMPARISON.md#other-exam-engines-to-try-and-in-what-order)).

**Add questions** by dropping any `*.json` file into `emulator/questions/`:

```json
{ "questions": [ {
  "id": "MY-001", "scenario": "S1", "domain": "D1", "task": "1.4",
  "select": 1,
  "stem": "Markdown text with `code`…",
  "options": [ { "text": "…", "correct": true, "why": "…" }, { "text": "…", "why": "…" },
               { "text": "…", "why": "…" }, { "text": "…", "why": "…" } ],
  "explanation": "…", "ref": "Exam Guide task 1.4" } ] }
```

Run `npm run validate` afterwards to check it. Scenarios and domains are defined in `questions/00-blueprint.json`.

History is stored in `emulator/data/history.json` (git-ignored). The in-progress session is stored in the browser's localStorage.

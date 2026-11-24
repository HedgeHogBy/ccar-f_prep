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

There are **133 original questions** (22–23 per scenario, 11 of them multiple-response), written against the public exam guide's 30 task statements. Every option has a "why" rationale. They are **not** real exam items. Anthropic's policy forbids sharing those, so dump material is deliberately excluded.

The bank is too small to keep forms fresh for long. After 5–6 full mocks you'll start recognising items, which is when you should switch to other sources (see the comparison doc). With the current bank, average domain coverage per form is about D1 18, D2 11, D3 11, D4 10, D5 10, close to the blueprint's 16/11/12/12/9.

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

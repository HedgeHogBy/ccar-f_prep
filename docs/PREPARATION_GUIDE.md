# How to prepare for CCAR-F (Claude Certified Architect – Foundations)

This guide combines the official exam guide (v1.1, Nov 2026) with the reports of people who have taken the exam. Every claim links to its source, and the detailed notes with sources are in [`research/`](research/).

> **Confidence legend:** ✅ official · 🟡 several independent accounts agree · 🟠 a single account or vendor claim

---

## 1. What you're up against

| | |
|---|---|
| Format | 60 items, multiple choice and multiple response ("Select TWO"). Each item says how many answers to pick ✅ |
| Time | 120 min, so **2 min per item** ✅ |
| Structure | **4 scenarios drawn at random from 6.** Every question is framed by one of them ✅ |
| Pass | **720 scaled** on 100–1000, criterion-referenced ✅ |
| Report | Pass/fail, scaled score, and % correct per domain ✅. Most takers saw it **immediately** 🟡 (one said 1–2 weeks 🟠) |
| Cost | $125 per attempt, retakes included. Waits are 14, then 30, then 90 days. Max 4 attempts per 12 months ✅ |
| Access | **Claude Partner Network members only**, registered via the Partner Academy (Skilljar) with a company email ✅ |
| Validity | 12 months. Renewal is a free, unproctored assessment if you renew on time ✅ |
| Delivery | Pearson VUE OnVUE (online) or a test center ✅ |

**"Foundations" does not mean easy.** The Udacity passer called it "not entry-level despite the name". One taker scored **900 on a practice test and then 670 (a fail) on the real exam in the same week** ([Rick High](https://rickhigh.substack.com/p/anthropics-claude-certified-architect)). Several takers found the real exam denser than the mocks ([ITOne](https://itone.substack.com/p/lessons-from-the-anthropic-architect), [Udacity](https://www.udacity.com/blog/the-claude-certified-architect-exam-explained-by-someone-who-passed-it/)) 🟡.

## 2. Blueprint and where the points are

| Domain | Weight | ≈ items |
|---|---|---|
| D1 Agentic Architecture & Orchestration | 27% | 16 |
| D3 Claude Code Configuration & Workflows | 20% | 12 |
| D4 Prompt Engineering & Structured Output | 20% | 12 |
| D2 Tool Design & MCP Integration | 18% | 11 |
| D5 Context Management & Reliability | 15% | 9 |

The six scenarios are support agent, code generation with Claude Code, multi-agent research, developer productivity, Claude Code in CI, and structured extraction. Because you get 4 at random, you can't skip any of them. "Understand all 6 scenarios" is the most repeated piece of advice 🟡.

The full list of task statements is in [`research/official-sources.md`](research/official-sources.md#2-blueprint-5-domains-30-task-statements).

## 3. How the exam "thinks": the answer heuristics

These come from the 12 official sample questions plus the passers' write-ups. They are the most valuable part of preparation.

1. **Deterministic beats probabilistic.**
   - If a rule *must* hold (identity verified before refund, refund cap), enforce it in code with a hook or prerequisite gate.
   - "Add it to the system prompt" or "add few-shot examples" is the classic distractor ✅ (sample Q1).
2. **Fix the root cause with the proportionate first step.**
   - Tools get misrouted? Improve the tool **descriptions** before building a routing classifier or merging tools ✅ (Q2).
3. **Be wary of self-reported confidence and sentiment.**
   - Use them for routing only if they are calibrated on labelled data. Escalation should follow explicit criteria plus examples ✅ (Q3, 5.2).
4. **Structural fixes beat "be careful" instructions.**
   - Prefer schemas, tool boundaries, explicit IDs and categorical criteria over "be conservative" or "only report high-confidence issues" 🟡 ([dev.to](https://dev.to/suraj_khaitan_f893c243958/i-passed-the-claude-certified-architect-foundations-cca-f-exam-my-journey-lessons-and-98j)).
5. **Errors should be structured and honest.**
   - Report the failure type, the attempted query, partial results and alternatives.
   - Never return an empty result as "success", never hide the error, and don't kill the whole workflow over one failure ✅ (Q8).
6. **Practise least privilege and small toolsets.**
   - Give each agent 4–5 scoped tools, plus a narrow cross-role tool such as `verify_fact` when round trips hurt ✅ (Q9).
7. **Independent review beats self-review.**
   - The model that generated the work keeps its reasoning and misses its own errors. Use a second instance, and use per-file passes plus an integration pass for big PRs ✅ (Q12).
8. **Match the API to the latency need.**
   - The Batches API is 50% cheaper with up to a 24-hour window and no SLA. Use it for overnight jobs, never for blocking pre-merge checks ✅ (Q11).
9. **Know the Claude Code file locations.** Team assets go in the repo; personal ones go in `~/`.
   - `.claude/commands/` (shared) vs `~/.claude/commands/` (personal).
   - `.claude/rules/*.md` with `paths:` globs for conventions scattered across the codebase.
   - `.mcp.json` (project) vs `~/.claude.json` (user) ✅ (Q4, Q6).
10. **Plan mode for big or ambiguous work, direct execution for well-scoped changes** ✅ (Q5).
11. **CI means non-interactive.**
    - Use `claude -p` with `--output-format json` and `--json-schema`.
    - Distractors include made-up flags such as `--batch` or `CLAUDE_HEADLESS` ✅ (Q10).
12. **Loops end on `stop_reason`.**
    - Not on parsed text, and not on an iteration cap used as the main stop condition ✅ (1.1).
13. **Diagnose the system you're given rather than matching a pattern.**
    - The failed taker's lesson was that the question describes a failing system and you must find *why* it fails. The technique named in the question isn't necessarily the answer 🟠 ([Rick High](https://rickhigh.substack.com/p/anthropics-claude-certified-architect)).
14. **Cross-domain traps.**
    - A question framed as prompt engineering may really be about tool design or context management 🟡 ([Learning Tree](https://www.learningtree.com/blog/my-journey-claude-certified-architect-foundations-certification/)).

**Distractor anatomy.** Wrong answers are usually *technically valid but not production-grade*. They tend to be over-engineered (a new classifier, model or service), under-powered (a prompt tweak), or invented (a flag or file that doesn't exist) 🟡.

**Answer-position quirk.** In the official guide, 11 of 12 sample answers are "A". The live exam shuffles answers, so this tells you nothing and you shouldn't rely on it.

## 4. Study plan (about 6–10 weeks, 30–60 hours)

Reported effort ranges from 30–40 focused hours ([Learning Tree](https://www.learningtree.com/blog/my-journey-claude-certified-architect-foundations-certification/)) to about 6 weeks (Udacity) or about 10 weeks (dev.to). The official guide recommends 6+ months of hands-on work with the Claude APIs, Agent SDK, Claude Code and MCP.

**Weeks 1–2: foundations**
- Read the official exam guide end to end, especially §6 (task statements), §9 (sample questions) and §17 (scope).
- Take the free Anthropic Academy courses: Building with the Claude API, Intro to MCP, and Claude Code in Action. If you're a partner, take the Partner Academy "Claude Architect" path.
- Take the **emulator diagnostic** (`npm start`, then *Full exam*) cold, to get a baseline.

**Weeks 3–5: build (this matters most)**
Do the four official exercises from guide §8:
1. A multi-tool Agent SDK agent with escalation. Include a prerequisite gate, a PostToolUse normalisation hook and structured MCP errors.
2. A Claude Code team setup on a real repo: CLAUDE.md hierarchy, `.claude/rules` with globs, a shared command, a skill with `context: fork`, and an `.mcp.json` that uses `${ENV}`.
3. An extraction pipeline: `tool_use` with a JSON schema, nullable fields, validation-retry with the errors fed back, and a Batches API run correlated by `custom_id`.
4. A coordinator–subagent research pipeline with parallel Task calls, explicit context passing, provenance and coverage annotations.

ITOne warns that habits from Cursor or Codex can mislead you, so learn *Claude's* conventions specifically.

**Weeks 6–8: practise like the exam**
- Use the emulator's **domain drill** for your weakest domain each day, with explanations on.
- Twice a week, sit a **full timed exam** in exam mode (no feedback, 120 minutes, flag and review).
- Keep an "anti-patterns" sheet of every distractor that fooled you, and why it was wrong.
- Optionally take a second opinion from a free mock such as [ccaf.cyberskill.world](https://ccaf.cyberskill.world) or the [utkarsh1agarwal 6×60 player](https://github.com/utkarsh1agarwal/claude-architect-exam-guide).

**Rotate question banks.** Once this emulator's items start to feel familiar (after about 5–6 full mocks), move to banks by other authors. For an honest score, use [utkarsh1agarwal's 6×60 player](https://github.com/utkarsh1agarwal/claude-architect-exam-guide), [ccaf.cyberskill.world](https://ccaf.cyberskill.world) and the [Practice Field Manual](https://lakkanna.github.io/architect-practice-lab/), and optionally a paid Udemy or Tutorials Dojo set. The recommended order and how to use several banks are in [COMPARISON.md → Other exam engines to try](COMPARISON.md#other-exam-engines-to-try-and-in-what-order).

**Readiness bar:** a consistent **≥ 820** on unseen full mocks before booking. Takers say the real exam is harder than the mocks, so leave a buffer of about 100 points.

## 5. Exam day

- **Pace:** about 2 minutes per item. Do a first pass in about 75 minutes, flagging anything over 3 minutes, then review. Most passers finished with 10–30 minutes to spare 🟡. *(The flag feature was reported by takers; the official guide doesn't mention it.)*
- **Multi-response items:** the stem says how many to pick. Choose exactly that many, and judge each option on its own merits.
- **Long scenarios:** read the scenario once at the start of its block and note the tool names and constraints, such as the 80% first-contact-resolution target or the $500 refund cap. Questions reuse them.
- **OnVUE checklist** ([ITOne](https://itone.substack.com/p/lessons-from-the-anthropic-architect), guide §13–14):
  - Run the system test days ahead and turn off your VPN.
  - Clear the desk, use one monitor (unplug any others and show the proctor), and take off your watch.
  - Bring a government ID whose name exactly matches your registration.
  - You must accept the NDA, or the session ends with no refund.
- **Scheduling:** OnVUE can be cancelled up to 1 hour before; a test center needs 48 hours.

## 6. Resources to avoid

Anthropic's policy treats exam content as confidential. Sanctions include invalidation, revocation and a ban. Avoid "dump" sites. ITOne also found that their answers were often wrong. Any repo that claims to hold *real exam questions* is both a misconduct risk and unreliable. Practise with original questions only; the emulator in this repo uses only original items written against the public blueprint.

## 7. Sources
- **Official:** [Exam Guide v1.1 PDF](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946250/Claude_Certified_Architect_-_Foundations_Exam_Guide.pdf), [Pearson VUE](https://www.pearsonvue.com/us/en/anthropic.html), [claude.com announcement](https://claude.com/resources/articles/four-role-based-claude-certifications), [Credly](https://www.credly.com/org/anthropic/badge/claude-certified-architect-foundations), [Anthropic Academy](https://academy.claude.com).
- **Experiences:** [Udacity](https://www.udacity.com/blog/the-claude-certified-architect-exam-explained-by-someone-who-passed-it/), [Learning Tree](https://www.learningtree.com/blog/my-journey-claude-certified-architect-foundations-certification/), [ITOne](https://itone.substack.com/p/lessons-from-the-anthropic-architect), [dev.to](https://dev.to/suraj_khaitan_f893c243958/i-passed-the-claude-certified-architect-foundations-cca-f-exam-my-journey-lessons-and-98j), [Rick High](https://rickhigh.substack.com/p/anthropics-claude-certified-architect), [Educative guide](https://www.educative.io/blog/claude-certified-architect-certification-guide).
- **Gaps:** no Reddit or HN threads were found, and the Skilljar pages could not be fetched automatically. Re-check the certification page for content changes (Pearson lists Dec 7, 2026 updates for other Claude exams).

# CCAR-F prep solutions compared (as of 2026-11-23)

"?" means the research couldn't verify it. Star counts come from the GitHub API. Udemy figures come from search snippets and are unverified. "Fidelity" is my judgement of how closely the tool reproduces the real exam's mechanics: 60 items, 120 minutes, 4 of 6 scenarios, multi-response, flag/review, scaled 720/1000, and a per-domain report.

## Practice exams and question banks

| Solution | Type | Cost | # Qs | Offline | Explanations | Timed 120 min | 4-of-6 scenarios | Multi-response | Flag/review | Scaled score + domain report | Exam fidelity | Last update | Caveats |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **This repo: `ccar-f_prep` emulator** | Local web app (Node, zero deps) | Free | bundled original bank, extensible JSON | ✅ | ✅ per option | ✅ | ✅ weighted draw | ✅ | ✅ + review screen | ✅ + history and weak-area tracking | High (mechanics) | 2026-11-23 | Bank is smaller than commercial ones. Add questions via JSON |
| [Official exam guide sample Qs](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946250/Claude_Certified_Architect_-_Foundations_Exam_Guide.pdf) | PDF | Free | 12 | ✅ | ✅ | ❌ | n/a | ❌ | ❌ | ❌ | Content: authoritative | 2026-11 (v1.1) | Too few to practise timing. Old practice exam retired |
| [utkarsh1agarwal/claude-architect-exam-guide](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) | GitHub browser player | Free (MIT) | 360 (6×60) | ✅ clone | ✅ | ✅ | ✅ (mocks 2–3) | ? | question map | per-scenario/domain | High | 2026-07-28 | 47★, little social proof |
| [hamzafarooq/claude-certified-architect](https://github.com/hamzafarooq/claude-certified-architect) | Single HTML app | Free (MIT) | 64 | ✅ | ✅ | ? | ❌ | ? | ? | domain study mode | Medium | 2026-09-10 | Author is affiliated with a partner firm |
| [paullarionov/claude-certified-architect](https://github.com/paullarionov/claude-certified-architect) | Guide, Anki, HTML tests | Free (no licence) | ? | ✅ | ? | ? | ? | ? | ? | ? | ? | 2026-10-02 | 5.3k★. ⚠ Claims its questions are "from real exam materials" (NDA risk) |
| [avidevelops/claude-architect-exam-prep](https://github.com/avidevelops/claude-architect-exam-prep) | Markdown Q&A | Free | 33 | ✅ | ✅ detailed why-wrong | ❌ | ❌ | ❌ | ❌ | ❌ | Low (mechanics) / good content | 2026-06-19 | Cited by a passer |
| [OlivierAlter/…-Exam](https://github.com/OlivierAlter/Claude-Certified-Architect-Foundations-Certification-Exam) | MD + Claude Code skill | Free | 71–77 | partly | ✅ | ❌ | ❌ | ? | ❌ | 5 domains | Low | 2026-03-15 | Question count inconsistent |
| [SGridworks training](https://github.com/SGridworks/claude-certified-architect-training) | HTML game + plan | Free | 110 | ✅ | ? | ? | ? | ? | ? | ? | ? | 2026-03-14 | Not inspected |
| [ccaf.cyberskill.world](https://ccaf.cyberskill.world) | Hosted web | Free | 60 | ❌ | ✅ per option | ✅ | ? | ? | ? | /1000 | Medium-high | ? | Author says fidelity is untested |
| [Practice Field Manual](https://lakkanna.github.io/architect-practice-lab/) | Hosted web | Free | 213 bank (24 per session) | ❌ | ✅ immediate | ? | ✅ 4 scenarios | ? | ? | ? | Medium | ? | Licence unstated |
| [Connectry MCP tutor](https://glama.ai/mcp/servers/Connectry-io/connectrylab-architect-cert-mcp) | MCP server in Claude | Free | 60 per exam | needs Claude | ? | ? | ? | ? | ? | /1000 | ? | ? | Unusual domain split (16/11/12/12/9) |
| [Udemy "6 Practice Exams"](https://www.udemy.com/course/anthropic-claude-certified-architect-3-full-practice-exams/) | Commercial | ~$15–90 (Udemy) | 360 | ❌ | ✅ | ✅ | ? | ✅ | ✅ (Udemy player) | % only | Medium | ? | 4.4★ / ~5.6k ratings (unverified) |
| [Udemy "CCAF Tests 2026"](https://www.udemy.com/course/claude-certified-architect-ccaf-tests/) | Commercial | Udemy pricing | 6 exams | ❌ | ✅ per option | ✅ | ? | ✅ | ✅ | % only | Medium | ? | 21 ratings |
| [Tutorials Dojo CCAR-F](https://tutorialsdojo.com/ccar-f-claude-certified-architect-foundations-study-guide/) | Commercial | ? | ? | ❌ | ? | ? | ? | ? | ? | ? | ? | guide 2026-08-11 | Strong brand in AWS prep. Product not verified |
| [CertLand](https://certland.net/blog/cca-f-exam-day-experience-what-to-expect/) | Commercial | ? (first 10 free) | 606 | ❌ | ? | ? | ? | ? | ? | ? | ? | 2026-04 | Marketing. Stories are composites |

## Courses and notes (learning, not exam simulation)

| Solution | Type | Cost | Length | Best for | Last update |
|---|---|---|---|---|---|
| Official Exam Guide §6–§8 | PDF | Free | 42 pp | Task statements and the 4 hands-on exercises | 2026-11 |
| Partner Academy "Claude Architect" path | Official course | Free (partners) | ~12 h + capstone | Official coverage | ? |
| Anthropic Academy (API, MCP, Claude Code in Action) | Official courses | Free | several h | Foundations | ongoing |
| [freeCodeCamp, Andrew Brown](https://www.youtube.com/watch?v=reDRM0tqhNs) | YouTube | Free | 13 h | Broad free walkthrough | 2026-07-23 |
| [daronyondem guide](https://github.com/daronyondem/claude-architect-exam-guide) | MD/PDF/EPUB | Free (CC BY 4.0) | 11 areas | "Common Pitfalls" and the cheat sheet | 2026-11-19 |
| [Educative course](https://www.educative.io/courses/claude-certified-architect-foundations) | Commercial | subscription | ~12 h, 43 quizzes | Structured reading | ? |
| [Learning Tree](https://www.learningtree.com/courses/claude-architect-foundations-prep/) / [Pluralsight](https://www.pluralsight.com/professional-services/data-machine-learning/claude-certified-architect-foundations-CCAR-F-certification-prep) / [CBT Nuggets](https://www.cbtnuggets.com/it-training/ai/cca-foundations) | Instructor-led | $$$ | up to 3 days | Teams | ? |
| [timothywarner-org notebooks](https://github.com/timothywarner-org/claude-architect), [aderegil labs](https://github.com/aderegil/claude-certified-architect) | Hands-on labs | Free | 30 tasks / 5 domains | Building the exercises | 2026-09 / 2026-05 |

## Other exam engines to try, and in what order

Any single question bank teaches its author's blind spots. Rotating through banks from different authors is the cheapest way to avoid that, and to avoid simply memorising items. This repo's bank has 149 questions, and a second mock already repeats about a quarter of the first, so only your first full mock is a clean reading. Plan the sequence below.

| # | Engine | Why try it | When | Cost |
|---|---|---|---|---|
| 1 | **Official Exam Guide sample questions** (12) | The only items written by the exam authors. They calibrate what "correct" means | Week 1, then again in the last week | Free |
| 2 | **This emulator**, practice and drill modes | Explanations for every option, weakest-domain drills, a "missed questions" loop | Weeks 2–6 | Free |
| 3 | **[utkarsh1agarwal mock player](https://github.com/utkarsh1agarwal/claude-architect-exam-guide)** | 360 new questions (6 × 60) with a timer and per-scenario scoring. Mocks 4–6 are deliberately harder. It is the closest free match to the exam's mechanics | Once this emulator's items feel familiar | Free (MIT), offline after cloning |
| 4 | **[ccaf.cyberskill.world](https://ccaf.cyberskill.world)** | A full 60-question, 120-minute mock with a /1000 score and per-option explanations, from a different author | As a cold, timed checkpoint, about 2 weeks before booking | Free, no login |
| 5 | **[Practice Field Manual](https://lakkanna.github.io/architect-practice-lab/)** | A 213-question community bank served in short 24-question sessions across 4 scenarios | Daily warm-ups in the final weeks | Free |
| 6 | **[Udemy "6 Practice Exams"](https://www.udemy.com/course/anthropic-claude-certified-architect-3-full-practice-exams/)** (360 questions) or **[Udemy "CCAF Tests 2026"](https://www.udemy.com/course/claude-certified-architect-ccaf-tests/)** | The largest commercial pool, with reviews from many buyers. Useful if you want more volume | Optional. Buy on a Udemy sale (often about $15) | Paid |
| 7 | **[Tutorials Dojo CCAR-F](https://tutorialsdojo.com/ccar-f-claude-certified-architect-foundations-study-guide/)** | A vendor with a strong record in AWS practice exams. Product details weren't verified | Optional, as an alternative to Udemy | Paid (?) |
| 8 | **[hamzafarooq single-file exam](https://github.com/hamzafarooq/claude-certified-architect)** | 64 questions plus domain cheat sheets in one HTML file | For a quick extra set | Free (MIT) |
| 9 | **Tutor-style: [Connectry MCP](https://glama.ai/mcp/servers/Connectry-io/connectrylab-architect-cert-mcp), [abiodedeyi Claude Code skill](https://github.com/abiodedeyi/cca-f-exam-prep)** | Claude quizzes you, explains, and follows up on your weak spots (the skill uses spaced repetition) | For conversational review of weak domains | Free |

**How to use several banks well**
- **Your first attempt on a new bank is the only honest readiness signal.** A retake scores memory, not skill. Record first-attempt scores separately.
- **Treat every bank's answer key with scepticism**, this one included. When banks disagree, settle it with the exam guide's task statements and the official samples. Don't settle it by majority vote.
- **Calibrate by bank.** The real exam is reported to be harder than most mocks. Aim for at least about 80% on first attempts of *unseen* banks, not on ones you've retaken.
- **Log your misses by distractor type** (prompt-only fix, over-engineered fix, invented flag, wrong layer). That pattern transfers across banks; the specific questions don't.

**Avoid:** "dump" sites and any repo that claims to contain real exam items. The paullarionov repo makes that claim about its practice tests, though its study guide and Anki decks are fine. Using real items breaches Anthropic's certification policy, and takers report that dump answers are often wrong.

## Recommendation
- **Content truth:** use the official guide and its 12 samples.
- **Hands-on:** do the guide's four exercises, using the aderegil or timothywarner labs as scaffolds.
- **Timed practice:** follow the engine sequence above. Start with this emulator, then move to banks by other authors for honest first-attempt scores.
- **Cheat sheet:** daronyondem's guide.
- **Skip:** dump sites and any resource that claims to hold real exam items.

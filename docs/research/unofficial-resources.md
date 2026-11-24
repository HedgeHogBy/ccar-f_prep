# Unofficial prep resources for CCAR-F (research notes, 2026-11-23)

> Raw research notes collected by a research agent. Vendor blogs are marketing; unverified claims are marked. Check numbers against the official exam guide (see `official-sources.md`).

## Method and limits
- GitHub data came from the GitHub search API (stars and last push, November 2026).
- No Reddit, Hacker News or X threads turned up. Sources were LinkedIn, Skool, Medium, Substack, dev.to and vendor blogs. Reddit coverage is a gap.
- Udemy, Medium, Towards AI and Skool returned 403. Udemy figures come from search snippets and are **unverified**.

## 1. Facts consistent across unofficial sources
Sources: [Educative](https://www.educative.io/blog/claude-certified-architect-certification-guide), [Learning Tree](https://www.learningtree.com/blog/my-journey-claude-certified-architect-foundations-certification/), [ITOne](https://itone.substack.com/p/lessons-from-the-anthropic-architect), [dev.to](https://dev.to/suraj_khaitan_f893c243958/i-passed-the-claude-certified-architect-foundations-cca-f-exam-my-journey-lessons-and-98j).
- 60 questions in 120 minutes. Formats are multiple choice and multiple response. Closed book. Proctored online via Pearson VUE, or at a test center.
- Scaled score 100–1000, 720 to pass.
- 6 scenarios exist and 4 are drawn at random per sitting: customer support resolution agent, code generation with Claude Code, multi-agent research system, developer productivity, Claude Code for CI, and structured data extraction.
- Domain weights (Educative and Learning Tree):

  | Domain | Weight |
  |---|---|
  | Agentic Architecture & Orchestration | 27% |
  | Claude Code Configuration & Workflows | 20% |
  | Prompt Engineering & Structured Output | 20% |
  | Tool Design & MCP | 18% |
  | Context Management & Reliability | 15% |

  dev.to gives a different split, 25/20 for some domains.
- $125 per attempt (one Udemy snippet says $99, a conflict). Retake waits are 14, then 30, then 90 days, with at most 4 attempts per 12 months.
- Validity is 12 months (ITOne, daronyondem). Udacity says 6 months, a conflict.
- Registration requires Claude Partner Network affiliation via the Anthropic Partner Academy (Skilljar).
- Accounts conflict on whether a standalone official practice exam still exists. The sample questions are in the exam guide.

## 2. GitHub repositories
| Repo | Stars | Last push | Format | Content | Licence |
|---|---|---|---|---|---|
| [paullarionov/claude-certified-architect](https://github.com/paullarionov/claude-certified-architect) | 5.3k | 2026-10-02 | MD, PDF/EPUB, Anki, HTML tests | Guide in 15 languages, Anki, HTML tests. ⚠ Claims its questions come from real exam materials, which is an NDA risk. | none |
| [daronyondem/claude-architect-exam-guide](https://github.com/daronyondem/claude-architect-exam-guide) | 1.1k | 2026-11-19 | MD, PDF/EPUB | 11 knowledge areas, "Common Pitfalls", cheat sheet. No questions. | CC BY 4.0 |
| [avidevelops/claude-architect-exam-prep](https://github.com/avidevelops/claude-architect-exam-prep) | 603 | 2026-06-19 | MD | 33 scenario Q&As with why-right/why-wrong, cheat sheet | unclear |
| [OlivierAlter/...Certification-Exam](https://github.com/OlivierAlter/Claude-Certified-Architect-Foundations-Certification-Exam) | 245 | 2026-03-15 | MD + Claude Code skill | Claims 77 Qs (the per-domain counts sum to 71) | none |
| [hamzafarooq/claude-certified-architect](https://github.com/hamzafarooq/claude-certified-architect) | 174 | 2026-09-10 | Single-file HTML | 64-Q practice exam, cheat sheets | MIT |
| [utkarsh1agarwal/claude-architect-exam-guide](https://github.com/utkarsh1agarwal/claude-architect-exam-guide) | 47 | 2026-07-28 | Browser mock player | 6 timed mocks, 360 Qs, question map, per-scenario/domain scoring | MIT |
| [aderegil/claude-certified-architect](https://github.com/aderegil/claude-certified-architect) | 115 | 2026-05-19 | Python labs | 6 scenarios, 30 tasks | ? |
| [timothywarner-org/claude-architect](https://github.com/timothywarner-org/claude-architect) | 101 | 2026-09-19 | Jupyter | 5 domains, practice scenarios | MIT |
| [SGridworks/...-training](https://github.com/SGridworks/claude-certified-architect-training) | 39 | 2026-03-14 | HTML | 12-week plan, game, 110 Qs | none |
| [Amey-Thakur/CLAUDE-CERTIFICATIONS](https://github.com/Amey-Thakur/CLAUDE-CERTIFICATIONS) | 158 | 2026-11-17 | MD | All 4 Claude certifications, flashcards | MIT |
| [abiodedeyi/cca-f-exam-prep](https://github.com/abiodedeyi/cca-f-exam-prep) | 24 | 2026-06-08 | Claude Code skill | Spaced repetition, distractor library | MIT |
| [hong-chu/...-llm-wiki](https://github.com/hong-chu/claude-certified-architect-foundations-llm-wiki) | 31 | 2026-06-12 | Obsidian | Domain notes | CC-BY-4.0 |
| [scholarly360/...](https://github.com/scholarly360/claude-certified-architect-foundations) | 21 | 2026-11-14 | MD | Guide + practice exams | MIT |
| [preporato/claude-certification-guide](https://github.com/preporato/claude-certification-guide) | 204 | 2026-10-13 | HTML | All 4 Claude certifications | ? |

MCP-based tutors: [Connectry architect-cert-mcp](https://glama.ai/mcp/servers/Connectry-io/connectrylab-architect-cert-mcp) (60 Qs, score out of 1000) and [szymonpaluch practice exam](https://mcpservers.org/servers/szymonpaluch-com-claude-certified-architect-practice-exam).

## 3. Commercial
- **Udemy** (unverified snippets): "6 Practice Exams" has 360 Qs, rated 4.4 from about 5.6k ratings. "CCAF Tests 2026" has 6 timed exams, rated 4.8 from 21 ratings. A 1500-question listing is a red flag for padding.
- **Tutorials Dojo**: [study guide](https://tutorialsdojo.com/ccar-f-claude-certified-architect-foundations-study-guide/) and a practice-exam product. Price and question count are unknown.
- **CertLand**: 606-question bank, first 10 free. The blog is marketing with composite stories.
- **Educative**: [course](https://www.educative.io/courses/claude-certified-architect-foundations), 46 lessons, 43 quizzes, about 12 hours.
- **Instructor-led**: Pluralsight, CBT Nuggets, Learning Tree (3 days).

## 4. Free sites and video
- [freeCodeCamp 13-hour course by Andrew Brown](https://www.youtube.com/watch?v=reDRM0tqhNs) (2026-07-23).
- [ccaf.cyberskill.world](https://ccaf.cyberskill.world): 60 Qs, 120-minute timer, scored out of 1000, explanations per option.
- [Practice Field Manual](https://lakkanna.github.io/architect-practice-lab/): 213-question bank, 24 per session across 4 scenarios.

## 5. Real-person experiences
- **Udacity passer**: studied about 6 weeks and finished in about 90 of 120 minutes. "Not entry-level despite the name." Several answers are plausible, and the exam wants the *most reliable production* design. Weak areas were team Claude Code repos, CI/CD and testing at scale. Found LLM-generated practice questions too fact-focused.
- **Learning Tree**: 30–40 hours plus Skilljar courses, a self-built project and a Discord study group. Dense scenarios and multi-answer questions. The surprise was cross-domain reasoning: a question that looks like prompt engineering can really be tool design or context management. Flagged and reviewed in the last 15 minutes. Score report was immediate, broken down by domain.
- **ITOne**: passed modestly with about 10 minutes left. The real exam was denser than the mocks. Did *worse* in areas used daily because Cursor/Codex habits differ from Claude conventions. Many questions were "deterministic code around the model": escalation, observability, governance. Proctoring rules: no VPN, clear desk, one monitor (unplug the second), no watch.
- **dev.to passer**: about 10 weeks. Distractors were "technically correct but not robust or production-grade". Likely wrong answers: prompt-based enforcement, arbitrary iteration caps, trusting self-reported metadata, ambiguous text fields instead of explicit IDs. Likely right answers: schemas, tool boundaries, deterministic enforcement, trimming context, parallelising independent tool calls.
- **Rick High**: scored 900 on a practice exam and **670 live** (fail) in the same week. The lesson: diagnose the failing system instead of pattern-matching the named technique.
- **Unverified snippets**: practice exams were easier than the real one, and every wrong answer "sounded believable".

## 6. Brain-dump warning
Anthropic's [certification policy](https://anthropic-partners.skilljar.com/page/policies-certifications) treats exam content as confidential. Sharing or reproducing it in any form can lead to sanctions. Avoid "exam dump" sites; ITOne found their content partly wrong as well.

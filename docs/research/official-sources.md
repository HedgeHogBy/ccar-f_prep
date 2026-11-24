# CCAR-F: official sources (research notes, 2026-11-23)

**Primary source:** the official *Claude Certified Architect – Foundations Exam Guide*, **v1.1, November 2026**, 42 pages.
[PDF](https://cc.sj-cdn.net/instructor/6nizmqk8tpzpfjvt6qmmav7rh/public/1794946250/Claude_Certified_Architect_-_Foundations_Exam_Guide.pdf). v1.0 (July 2026) differed only in formatting; v1.1 updated the registration, ID and support text.

Other official pages:
- [Pearson VUE: Anthropic](https://www.pearsonvue.com/us/en/anthropic.html)
- [claude.com: four role-based certifications](https://claude.com/resources/articles/four-role-based-claude-certifications)
- [Credly badge](https://www.credly.com/org/anthropic/badge/claude-certified-architect-foundations)
- [Academy FAQ](https://academy.claude.com/help/faq)
- Partner Academy (Skilljar) pages blocked automated fetching. Facts taken from them are marked *[search summary]*.

## 1. Logistics
| Item | Fact |
|---|---|
| Items | 60. Multiple choice and multiple response; each item states how many responses to select |
| Structure | 4 scenarios drawn at random from a bank of 6 |
| Time | 120 minutes |
| Fee | $125 USD per attempt, including retakes |
| Pass | Scaled 720 on a 100–1000 scale. Criterion-referenced; forms are equated |
| Report | Pass/fail, scaled score, and % correct per domain (the domain figures are informational only) |
| Validity | 12 months. On-time renewal is a free non-proctored assessment; a lapsed credential needs the full exam again |
| Delivery | Pearson VUE: OnVUE online or a test center. Badge via Credly |
| Retakes | Wait 14 days, then 30, then 90. Max 4 attempts per rolling 12 months. No retake after a pass |
| Eligibility | Claude Partner Network members only; company email domain; 18+ with government ID *[search summary]* |
| Recommended experience | 6+ months building with Claude APIs, Agent SDK, Claude Code and MCP |
| ID | Name must exactly match registration. Self-service name edit is allowed once |
| Conduct | Clear desk, no phones, watches, smart glasses, headphones or second monitors. Stay on camera. You must accept an NDA (declining forfeits the fee) |
| Scheduling | OnVUE: cancel or reschedule up to 1 hour before. Test center: 48 hours |
| Not stated officially | Languages, result timing, breaks, flag/back-navigation, unscored items ("approximate proportion of scored items" hints they exist), per-scenario item split |

## 2. Blueprint (5 domains, 30 task statements)
| # | Domain | Weight | ≈ items out of 60 |
|---|---|---|---|
| 1 | Agentic Architecture & Orchestration | 27% | 16 |
| 2 | Tool Design & MCP Integration | 18% | 11 |
| 3 | Claude Code Configuration & Workflows | 20% | 12 |
| 4 | Prompt Engineering & Structured Output | 20% | 12 |
| 5 | Context Management & Reliability | 15% | 9 |

### D1 Agentic Architecture & Orchestration
- **1.1 Agentic loops.**
  - Continue on `stop_reason == "tool_use"` and stop on `"end_turn"`. Append tool results to history.
  - Anti-patterns: parsing natural language to decide termination, iteration caps as the *primary* stop condition, and treating assistant text as the completion signal.
- **1.2 Coordinator–subagent (hub-and-spoke).**
  - Subagents have isolated context. The coordinator decomposes, delegates and aggregates.
  - Beware decomposition that is too narrow. Partition scope to avoid duplicated work.
  - Route all communication through the coordinator.
- **1.3 Subagent invocation.**
  - Subagents are spawned with the Task tool, so `allowedTools` must include `"Task"`.
  - Pass context **explicitly** in the prompt. Define agents with `AgentDefinition` (description, system prompt, tool restrictions).
  - Spawn in parallel with several Task calls in one response.
  - Coordinator prompts should state goals and quality criteria, not step-by-step procedures.
- **1.4 Enforcement and handoff.**
  - Programmatic gates (hooks, prerequisites) beat prompt instructions, which have a non-zero failure rate.
  - Example: block `process_refund` until `get_customer` returns a verified ID.
  - Human handoff should be a structured summary.
- **1.5 Agent SDK hooks.**
  - PostToolUse hooks normalise data (timestamps, status codes).
  - Interception hooks block policy violations, such as refunds over $500, and redirect to escalation.
- **1.6 Task decomposition.**
  - Prompt chaining versus adaptive decomposition.
  - Per-file passes plus a cross-file integration pass.
  - For open-ended work: map, prioritise, adapt.
- **1.7 Sessions.**
  - `--resume <name>` and `fork_session`.
  - Tell a resumed session which files changed.
  - A fresh session with a structured summary beats resuming with stale tool results.

### D2 Tool Design & MCP Integration
- **2.1 Tool descriptions.**
  - The description is the primary selection mechanism. Include input formats, examples, edge cases and boundaries.
  - Overlapping descriptions cause misrouting, so split or rename generic tools.
- **2.2 Structured MCP errors.**
  - Set `isError`. Categories are transient, validation, business and permission. Include `errorCategory`, `isRetryable` and a readable message.
  - Recover locally from transient errors and propagate unresolved ones with partial results.
  - Distinguish an access failure from a valid empty result.
- **2.3 Tool distribution.**
  - 4–5 tools per agent, not 18. Scope tools to the role, with a limited cross-role tool (e.g. `verify_fact`).
  - `tool_choice` takes `auto`, `any` or a forced tool.
- **2.4 MCP in Claude Code.**
  - Project scope is `.mcp.json`; user scope is `~/.claude.json`. Use `${ENV_VAR}` expansion for secrets.
  - Tools are discovered at connection time. Use MCP resources for catalogs.
  - Improve MCP tool descriptions so the agent doesn't fall back to Grep. Prefer community servers for standard integrations.
- **2.5 Built-in tools.**
  - Grep searches file contents; Glob matches paths.
  - Edit needs unique anchor text, with Read+Write as the fallback.
  - Explore incrementally.

### D3 Claude Code Configuration & Workflows
- **3.1 CLAUDE.md hierarchy.**
  - User level (`~/.claude/CLAUDE.md`, not shared), project level and directory level.
  - `@import` and `.claude/rules/`. Use `/memory` to see which files are loaded.
- **3.2 Commands and skills.**
  - Commands live in `.claude/commands/` (team) or `~/.claude/commands/` (personal).
  - Skills live in `.claude/skills/<name>/SKILL.md`, with frontmatter such as `context: fork`, `allowed-tools` and `argument-hint`.
  - Skills load on demand; CLAUDE.md is always loaded.
- **3.3 Path rules.** `.claude/rules/*.md` with `paths:` glob frontmatter load only for matching files. They beat subdirectory CLAUDE.md for scattered files.
- **3.4 Plan mode vs direct execution.**
  - Use plan mode for large, multi-file or architectural work, or when choosing between approaches. Execute directly for well-scoped changes.
  - The Explore subagent isolates verbose discovery.
- **3.5 Iterative refinement.**
  - Give 2–3 concrete input/output examples, iterate test-first, or use the interview pattern.
  - Batch interacting issues in one message; handle independent issues one at a time.
- **3.6 CI/CD.**
  - Run `-p`/`--print` with `--output-format json` and `--json-schema`. CLAUDE.md gives CI its context.
  - Use an independent review instance. Pass prior findings so only new issues are reported, and pass existing tests.

### D4 Prompt Engineering & Structured Output
- **4.1 Explicit criteria.**
  - Categorical criteria beat "be conservative".
  - False positives erode trust, so temporarily disable noisy categories.
- **4.2 Few-shot.**
  - Use 2–4 targeted examples for ambiguous cases and show the reasoning.
  - Demonstrate the output format. Cover varied document structures.
- **4.3 Structured output.**
  - `tool_use` with a JSON schema is the most reliable approach. Schemas fix syntax, not semantics.
  - Nullable fields prevent fabrication. Enums can include `"unclear"` and `"other"` plus a detail field.
- **4.4 Validation and retry.**
  - Retry with the specific errors appended. Retrying cannot recover information that is absent from the source.
  - Use self-check fields such as `calculated_total` vs `stated_total` and `conflict_detected`.
- **4.5 Batches API.**
  - 50% cheaper, up to a 24-hour window, no latency SLA. Not for blocking checks.
  - No multi-turn tool use. Correlate results by `custom_id`.
  - Resubmit failures only, and refine the prompt on a sample first.
- **4.6 Multi-pass review.** Independent instances beat self-review. Combine per-file and integration passes, with confidence per finding.

### D5 Context Management & Reliability
- **5.1 Long context.**
  - Progressive summarisation loses numbers and dates. Watch for lost-in-the-middle.
  - Trim bloated tool results. Keep a persistent "case facts" block, with key info first and section headers.
- **5.2 Escalation.**
  - Escalate when the customer asks for a human (honour it immediately), on a policy gap, or when there is no progress.
  - Sentiment and self-confidence are unreliable signals. Ask for identifiers when there are multiple matches.
- **5.3 Error propagation.**
  - Return structured error context. Separate access failures from empty results.
  - Anti-patterns: generic statuses, silently suppressing errors, killing the whole workflow. Annotate coverage.
- **5.4 Large codebase exploration.**
  - Use scratchpad files and subagent delegation, and summarise between phases.
  - Recover crashes from a manifest. Use `/compact`.
- **5.5 Human review.**
  - An aggregate figure like 97% can hide weak segments. Use stratified sampling.
  - Calibrate field-level confidence on labelled data, then route low-confidence items to humans.
- **5.6 Provenance.**
  - Keep claim-to-source mappings. Annotate conflicts rather than picking one.
  - Require dates. Separate established findings from contested ones.

## 3. The six scenarios (4 drawn per sitting)
1. **Customer Support Resolution Agent.** Agent SDK; tools `get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`; target 80%+ first-contact resolution. Domains D1, D2, D5.
2. **Code Generation with Claude Code.** Commands, CLAUDE.md, plan mode. Domains D3, D5.
3. **Multi-Agent Research System.** Coordinator with search, analysis, synthesis and report subagents. Domains D1, D2, D5.
4. **Developer Productivity with Claude.** Agent SDK, built-in tools, MCP. Domains D2, D3, D1.
5. **Claude Code for Continuous Integration.** Review, test generation, low false positives. Domains D3, D4.
6. **Structured Data Extraction.** JSON schema, validation, edge cases. Domains D4, D5.

## 4. Official sample questions (12, paraphrased; the answer is A in 11 of 12)
1. A support agent skips `get_customer` in 12% of cases. Fix: a programmatic prerequisite gate.
2. The agent confuses two tools with minimal descriptions. Fix: expand the descriptions.
3. First-contact resolution is 55% against an 80% target. Fix: explicit escalation criteria plus few-shot examples (not self-confidence or sentiment).
4. Where should a shared `/review` command live? In `.claude/commands/` in the repo.
5. A monolith-to-microservices restructure. Use plan mode first.
6. Test-file conventions are scattered across directories. Use `.claude/rules/` with glob `paths`.
7. A research report covers only the visual arts. Cause: the coordinator's decomposition was too narrow (answer **B**).
8. A search subagent times out. Return structured error context to the coordinator.
9. Fact-check round trips add 40% latency. Give synthesis a scoped `verify_fact` tool.
10. `claude "..."` hangs in CI. Use `-p`/`--print`.
11. Batches for both a pre-merge check and an overnight report. Batch only the overnight report.
12. A 14-file PR gets an inconsistent review. Use per-file passes plus an integration pass.

## 5. Official preparation
- **Exam Guide §7, hands-on.**
  - Build an Agent SDK agent with a loop, subagents, error handling and sessions.
  - Configure Claude Code on a real repo: CLAUDE.md, rules, skills and an MCP server.
  - Build MCP tools with error categories.
  - Build an extraction pipeline with tool_use, validation-retry and batches.
  - Practise few-shot and explicit review criteria, context patterns, and escalation.
- **Exam Guide §8, four exercises.**
  1. Multi-tool agent with escalation.
  2. Claude Code team workflow.
  3. Extraction pipeline.
  4. Multi-agent research pipeline.
- **Partner Academy** *[search summary]*: free prep courses, plus the "Claude Architect" path (about 12 hours, capstone and assessment): <https://anthropic-partners.skilljar.com/path/claude-architect>.
- **Anthropic Academy** (free): <https://academy.claude.com>. Courses include Claude 101, Building with the Claude API, Intro to MCP, and Claude Code in Action.
- The **old standalone practice exam was retired** *[search summary]*. The sample questions in the guide are the official ones.

## 6. Scope (Appendix)
- **In scope:** Agent SDK (loops, hooks, Task, `allowedTools`), MCP (tools, resources, `isError`, `.mcp.json`), Claude Code (CLAUDE.md, rules, commands, skills, plan mode, `/memory`, `/compact`, `--resume`, `fork_session`, `-p`, `--output-format json`, `--json-schema`), the API (`tool_use`, `tool_choice`, `stop_reason`, `max_tokens`), the Batches API, JSON Schema, Pydantic retry, few-shot, context management, confidence and sampling.
- **Out of scope:** fine-tuning, auth/billing, framework specifics, deploying MCP servers, model internals and RLHF, embeddings and vector DBs, computer use, vision, streaming, rate limits and pricing maths, OAuth, cloud configuration, benchmarking, prompt-caching implementation (beyond knowing it exists), tokenisation.
- **Watch:** Pearson says some Claude exams get updated content on Dec 7, 2026. CCAR-F is *not* listed, but re-check the certification page.

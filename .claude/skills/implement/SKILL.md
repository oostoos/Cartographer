---
name: implement
description: >
  Use this skill when asked to implement a written plan or design — e.g.
  a plan file saved by Claude Code's Plan Mode under `~/.claude/plans/`,
  or a design pasted or described inline. Also invoke manually
  ("/implement"). Breaks the plan into an ordered task list, decides
  which pieces are mechanical enough to delegate to the JuniorDeveloper
  subagent for lower token cost versus which need real judgment, and
  executes both. Usable directly by the main agent or by the
  SeniorDeveloper subagent for a full plan; JuniorDeveloper should only
  be handed an already-decomposed sub-scope from this skill's output, not
  the top-level decomposition job.
---

# implement

Implement a written plan or design end to end: break it into ordered
tasks, decide what needs real judgment versus what's mechanical enough to
hand off, execute both, and verify nothing broke along the way.

## Input

Accepts either or both:
- A plan file path (e.g. under `~/.claude/plans/`, or wherever the caller
  points you) — read it in full before starting.
- An inline plan/design passed directly as this skill's arguments/prompt.

If both are given, treat the inline text as clarification or amendment
layered on top of the file, not a replacement for it. If neither is
present, stop and report that instead of guessing at scope.

## Steps

1. **Read the plan and the ground rules.** Load the plan file (if given)
   in full and/or the inline design. Read `.ajx/AustinsSweManifesto.md`
   and `.ajx/CodeStyle.md` via the root `CLAUDE.md` chain, so every task
   you plan and dispatch is measured against the same rules. Never edit
   `.ajx/AustinsSweManifesto.md`.

2. **Decompose into an ordered task list.** Break the plan into concrete,
   independently describable steps — file or feature-area granularity, in
   dependency order. For anything beyond a trivial one-step plan, track
   this list with `TodoWrite` so progress and the do/delegate split stay
   visible for the rest of the run.

3. **Classify each task.** For every task, decide do-directly vs.
   delegate-to-JuniorDeveloper using the heuristic below, before
   executing anything — deciding mid-flight risks disrupting the plan's
   dependency order.

4. **Execute directly.** For tasks you keep: implement them with the
   normal toolset, invoking `refactor` / `update-library` / this skill
   recursively (for a sub-plan that still needs its own decomposition) as
   appropriate. Apply the judgment expected of whoever's running this
   skill — e.g. don't force an abstraction over superficially similar
   code the manifesto's own guidance argues against over-abstracting;
   don't delete looks-like-duplication code without checking whether a
   test relies on its specific behavior.

5. **Delegate mechanical tasks.** For tasks classified as delegate-able:
   dispatch `JuniorDeveloper` via the `Agent` tool, naming a specific
   skill (e.g. `refactor`, `update-library`) or a fully-specified
   mechanical change plus the exact scope — mirroring the phrasing
   pattern already established in `refactor/SKILL.md`'s "Delegating a
   larger pass" section, e.g. "run the `refactor` skill against
   `lib/stack/parchment/page_store.py`". Give JuniorDeveloper only the
   sub-scope, never this skill (`implement`) itself to run standalone —
   deciding how to decompose a plan is exactly the judgment-heavy part it
   isn't authorized to do.

6. **Review delegated work before trusting it.** Read each
   JuniorDeveloper diff/report in full before treating it as done. If it
   flagged something as needing judgment, or the diff shows a judgment
   call it shouldn't have made, pull that piece back and redo it yourself
   rather than re-delegating with more instructions.

7. **Verify.** Run the project's existing tests (`pytest`, `npm run test
   --workspace=src/frontend`) before and after the overall pass, same as
   the `refactor` skill's verification step. Flag untested touched code
   instead of writing a new test suite unless asked.

8. **Report.** See "Report" below.

## When to delegate vs. do directly

This is the reusable heuristic for this repo's seniority-tiered agents —
don't re-derive it each run.

Delegate a task to JuniorDeveloper only when it's **both**:
- mechanical/repetitive, with a scope precise enough to state in one
  sentence, and
- coverable by an existing skill's checklist (`refactor`,
  `update-library`) or a fully-specified, unambiguous change with no open
  design choice left in it.

Keep a task yourself when **any** of:
- it requires interpreting ambiguous or underspecified parts of the plan
- it requires choosing between multiple valid approaches (architecture,
  abstraction boundary, library placement judgment call)
- a mechanical-looking pass risks silently breaking a public contract —
  e.g. code that looks like duplication but is exercised by a test
  expecting specific behavior, or two things that look similar but
  shouldn't be forcibly unified (the manifesto's over-abstraction trap)
- the scope can't be pinned down tightly enough to hand off without the
  recipient having to make judgment calls of its own — JuniorDeveloper
  can't ask clarifying questions either, so an ambiguous handoff just
  relocates the problem

## Report

End with:

- **Done directly**: file-by-file summary of what changed and why.
- **Delegated**: each JuniorDeveloper dispatch — scope given, skill used,
  and outcome (plus anything you had to redo after review).
- **Flagged**: anything left undone because it needed authorization or
  clarification beyond this skill's scope (a plan gap, an ambiguous
  requirement, a decision the plan didn't make).

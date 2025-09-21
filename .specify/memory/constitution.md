<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles: New adoption (I–V added)
- Added sections: Core Principles; Operational Constraints; Development Workflow & Quality Gates; Governance
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (version reference updated)
  - ✅ AGENTS.md (already aligned; no changes needed)
  - ✅ .specify/templates/tasks-template.md (no direct version reference; principles aligned)
  - ✅ .specify/templates/spec-template.md (no direct version reference; remains compatible)
  - ⚠ None pending
- Deferred items:
  - TODO(RATIFICATION_DATE): Original adoption date not recorded; maintainers to confirm.
-->

# Godot API Docs MCP Server Constitution

## Core Principles

### I. Offline, Local Source of Truth
- The server MUST read Godot docs only from `GODOT_DOC_DIR` and treat
  that directory as read-only.
- The server MUST NOT perform network calls during normal operation.
- The server MUST resolve classes and symbols exclusively from the local
  XML corpus under `doc/classes/`.
Rationale: Guarantees reproducibility, privacy, and offline availability.

### II. Fast, Accurate Search
- Startup MUST parse and index typical Godot 4.x docs in ≤ 3s on a
  modern laptop; search p95 MUST be ≤ 20ms for simple queries and ≤ 60ms
  for multi-term queries.
- Search MUST support kind filters (`class|method|property|signal|constant`)
  and return stable scores and optional snippets.
- Index MUST be kept in memory and persisted to `.cache/godot-index.json`
  for warm starts when available.
Rationale: Developer UX depends on low-latency, relevant results.

### III. Stable MCP API Surface
- Tool names and shapes are stable: `godot_search`, `godot_get_class`,
  `godot_get_symbol`, `godot_list_classes`.
- Resource URIs MUST follow the `godot://` scheme documented in AGENTS.md.
- Inputs MUST be validated and errors returned with clear codes
  (e.g., `NOT_FOUND`, `INVALID_ARGUMENT`).
- Backward-incompatible tool or schema changes REQUIRE a major version
  bump of this constitution and corresponding documentation updates.
Rationale: Stability enables reliable client integrations.

### IV. Safety, Security, and Determinism
- The server MUST never execute code contained in docs; treat all input
  as plain text.
- File access MUST be confined to `GODOT_DOC_DIR` and `.cache/`.
- Memory overhead SHOULD be ≤ 150MB for the in-memory index; if a change
  risks exceeding this, it MUST be justified in PR description.
- Node.js runtime MUST be v20+; TypeScript ESM only.
Rationale: Limits blast radius and ensures predictable behavior.

### V. Tests & Observability Discipline
- Changes MUST include or update tests for parser, indexer, search,
  resolver, tools, and server surfaces touched by the change.
- Server MUST provide minimal structured logging behind a small logger
  interface and honor `MCP_SERVER_LOG` levels (`silent|error|warn|info|debug`).
- No PII or doc contents are transmitted externally; logs MUST avoid
  leaking large doc fragments.
Rationale: Confidence and diagnosability without compromising privacy.

## Operational Constraints
- Environment defaults: `GODOT_DOC_DIR=./doc`, `GODOT_INDEX_PATH=./.cache/godot-index.json`,
  `MCP_SERVER_LOG=info`, `MCP_STDIO=1`.
- Execute TypeScript directly with `tsx`; no `dist/` build artifacts are required.
- Optional warm start: if index file exists, it MAY be loaded to reduce
  cold start time; correctness over speed if mismatch is detected.
- Optional file watcher MAY rebuild the index when XML changes (non-blocking).
- Security guardrails: reject paths outside allowed roots; disallow network
  fetches; ignore unknown XML sections gracefully.

## Development Workflow & Quality Gates
- Small, focused PRs only; include updated tests and docs where applicable.
- Before merge, verify: principles compliance, search performance targets,
  and no unintended API surface changes.
- If any MCP tool name/params or resource shapes change: provide migration
  notes, bump version per Governance, and update AGENTS.md examples.
- Run `vitest`; ensure Node v20+; maintain TypeScript strict mode and ESM.
- Keep logging minimal and configurable; default `info`, verbose only when
  `MCP_SERVER_LOG=debug`.

## Governance
- This constitution supersedes ad-hoc practices for this repository.
- Amendments REQUIRE a PR that includes: summary of changes, version bump
  rationale (semver), migration notes (if applicable), and updated tests.
- Versioning policy for this document:
  - MAJOR: Backward-incompatible governance or MCP surface changes.
  - MINOR: New principle/section added or materially expanded guidance.
  - PATCH: Clarifications, wording, or non-semantic refinements.
- Compliance review: Reviewers MUST check alignment with Core Principles,
  Operational Constraints, and Quality Gates before approving.
- Reference: See `AGENTS.md` for architectural context and runtime details.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date to confirm | **Last Amended**: 2025-09-21

# Research: Class Doc Retrieval With Ancestors

**Date**: 2025-09-21  
**Context**: Extend MCP server capabilities to fetch a class and its ancestor docs from the local Godot XML corpus.

## Unknowns Resolved
- Default include behavior: Include ancestors by default when explicitly requested via an optional flag; base `getClass` remains backward compatible.
- Depth: Default to full chain; provide optional `maxDepth` (integer ≥1) to cap ancestors.
- Response shape: Combined response containing `inheritanceChain` and `classes[]` aligned to chain order; each `classes[i]` is a `GodotClassDoc`.
- Sections for ancestors: Include full docs by default; a future `sections` filter can narrow payload (defer).

## Decisions
- API surface: Keep tool name `godot_get_class` stable; add optional request fields `{ includeAncestors?: boolean, maxDepth?: number }`.
- Resolver: Use existing class map to walk `inherits` links; stop at root or when reaching `maxDepth`.
- Performance: Reuse in-memory parsed classes; ancestry traversal is O(depth); target ≤ 60ms p95.
- Errors: Return `NOT_FOUND` for missing class; include up to 5 suggestions from search index.

## Alternatives Considered
- New tool `godot_get_class_with_ancestors`: Rejected to avoid surface proliferation; optional params are simpler and backward compatible.
- Auto-expansion on plain search results: Deferred; keep search fast and let clients call `getClass` with ancestry explicitly.

## Risks & Mitigations
- Larger payload for deep chains → Allow `maxDepth` and future `sections` filter.
- Client expectations of old shape → Maintain the original `GodotClassDoc` response when `includeAncestors` is false/omitted.
- Nonexistent parent in corpus → Return chain with missing parent name and omit its doc; include a `warnings[]` array.

## Acceptance Criteria Trace
- Includes queried class and ancestors in order (nearest → root).
- Provides explicit `inheritanceChain` and per-class docs.
- Validates inputs and returns helpful errors/suggestions.
- No network access; performance targets intact.

## Open Questions (tracked)
- Should ancestry be included by default if clients don’t pass the flag? Chosen: No; opt-in via `includeAncestors` to preserve existing behavior.
- Do we expose `sections` filter now? Chosen: No; defer to a later MINOR change if needed.

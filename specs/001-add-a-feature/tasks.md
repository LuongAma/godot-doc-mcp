# Tasks: Class Doc Retrieval With Ancestors

**Input**: Design documents from `/specs/001-add-a-feature/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup
- [X] T001 [P] Biome lint check passes on `server/src` (`pnpm run check:biome`)

## Phase 3.2: Tests First (TDD)
- [X] T002 Add resolver ancestry tests in `server/test/resolver-ancestry.test.ts`
- [X] T003 Add tool contract tests for `godot_get_class` with `includeAncestors` in `server/test/tools-ancestry.test.ts`

## Phase 3.3: Core Implementation
- [X] T004 Update `server/src/adapters/godotTools.ts`: extend `getClass` to accept `{ name, includeAncestors?, maxDepth? }`
- [X] T005 Implement ancestry traversal in `server/src/resolver/symbolResolver.ts` (new helper `getClassChain(name, maxDepth?)` and structured response)
- [X] T006 Wire ancestry parameters through `server/src/index.ts` façade (types only)
- [X] T007 [P] Optional: support resource query `godot://class/<Name>?ancestors=1&maxDepth=0` in `server/src/mcp/stdio.ts`

## Phase 3.4: Integration
- [ ] T008 Ensure error codes and suggestions align with contract (`NOT_FOUND`, `INVALID_ARGUMENT`)
- [ ] T009 Verify performance budgets with sample corpus (<60ms p95 for ancestry retrieval)

## Phase 3.5: Polish
- [X] T010 [P] Unit tests for edge cases (missing parent, depth limit) in `server/test/resolver-ancestry.test.ts`
- [X] T011 Update `AGENTS.md` usage examples and note optional params
- [X] T012 Update `scripts/mcp-client.mjs` to demo `includeAncestors`
- [X] T013 [P] Update `specs/001-add-a-feature/quickstart.md` if behavior changes
- [ ] T014 Ensure logs respect `MCP_SERVER_LOG` and avoid large payloads

## Dependencies
- T002–T003 (tests) before T004–T007 (implementation)
- T004 blocks T006; T005 blocks T004
- T007 optional and independent once T004 is done

## Parallel Example
```
# Run in parallel after tests are green (failing initially):
Task: "Implement ancestry traversal in server/src/resolver/symbolResolver.ts"
Task: "Wire ancestry params through server/src/index.ts"
```

## Validation Checklist
- [ ] Tests precede implementation and initially fail
- [ ] Optional params are backward compatible
- [ ] No network calls added
- [ ] Performance targets met
- [ ] Error codes and suggestions present

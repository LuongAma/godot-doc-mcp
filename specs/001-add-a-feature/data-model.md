# Data Model: Class Doc Retrieval With Ancestors

**Date**: 2025-09-21

## Entities
-
- ClassDoc
  - name: string
  - inherits?: string
  - brief?: string
  - description?: string
  - methods: Method[]
  - properties: Property[]
  - signals: Signal[]
  - constants: Constant[]
  - since?: string

- InheritanceChain
  - ordered list of class names, starting with the queried class followed by
    ancestors up to the root

- AncestryResponse
  - inheritanceChain: string[]
  - classes: ClassDoc[] (aligned to `inheritanceChain` order)
  - warnings?: string[]

## Validation Rules
- `classes.length` MUST equal `inheritanceChain.length` when all ancestors exist.
- When a parent class is missing from the local corpus, include its name in
  `inheritanceChain` and add a warning; omit the missing ClassDoc from `classes`.
- `inheritanceChain[0]` MUST equal the requested class name (case-insensitive match).
- `maxDepth` (if provided) MUST be an integer ≥ 1.

## Relationships
- ClassDoc (parent) ← ClassDoc (child) via `inherits`.
- AncestryResponse aggregates ClassDoc instances by walking `inherits` links.

## State Transitions (conceptual)
- Request(name, includeAncestors=false) → returns ClassDoc (single)
- Request(name, includeAncestors=true, maxDepth?) → returns AncestryResponse

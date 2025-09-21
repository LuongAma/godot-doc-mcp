# Contract: godot_get_class (with ancestry)

This extends the existing MCP tool `godot_get_class` with optional parameters to
retrieve the queried class and its ancestor classes.

## Request
```json
{
  "name": "Button",
  "includeAncestors": true,
  "maxDepth": 0
}
```

Notes:
- `includeAncestors` (optional, boolean): when true, return the class plus
  ancestors. Default: false (preserve existing behavior).
- `maxDepth` (optional, integer ≥ 0): 0 = full chain; 1 = only immediate parent;
  N = up to N ancestors.

## Success Response (includeAncestors=false or omitted)
```json
{
  "name": "Button",
  "inherits": "BaseButton",
  "brief": "...",
  "description": "...",
  "methods": [],
  "properties": [],
  "signals": [],
  "constants": []
}
```

## Success Response (includeAncestors=true)
```json
{
  "inheritanceChain": ["Button", "BaseButton", "Control", "CanvasItem", "Node", "Object"],
  "classes": [
    { "name": "Button", "inherits": "BaseButton", "methods": [], "properties": [], "signals": [], "constants": [] },
    { "name": "BaseButton", "inherits": "Control", "methods": [], "properties": [], "signals": [], "constants": [] }
    // ... continues per chain
  ],
  "warnings": []
}
```

## Error Responses
- INVALID_ARGUMENT: missing or empty `name`
- NOT_FOUND: class not found (include suggestions)

Example NOT_FOUND
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Class 'Buton' not found",
    "suggestions": ["Button", "BaseButton", "BitMap"]
  }
}
```

## Compatibility
- Backward compatible: requests without `includeAncestors` return the original
  `GodotClassDoc` shape.
- Clients MAY detect the ancestry shape by checking for `inheritanceChain`.

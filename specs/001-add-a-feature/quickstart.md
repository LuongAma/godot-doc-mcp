# Quickstart: Class Doc Retrieval With Ancestors

## Prerequisites
- Node.js v20+
- pnpm installed
- Local Godot docs at `./doc`

## Run the MCP server (stdio)
```
export GODOT_DOC_DIR=./doc
pnpm install
pnpm dev
```

## Try it with the sample MCP client
```
node --import tsx scripts/mcp-client.mjs
```

## Example: Retrieve a class with ancestors
Using an MCP client, call the `godot_get_class` tool with additional parameters:
```
Tool: godot_get_class
Args: { "name": "Button", "includeAncestors": true, "maxDepth": 0 }
```
Expected response shape:
```
{
  "inheritanceChain": ["Button", "BaseButton", ...],
  "classes": [{ "name": "Button", ... }, { "name": "BaseButton", ... }],
  "warnings": []
}
```

If `includeAncestors` is omitted or false, the response is the single
`GodotClassDoc` for the queried class.

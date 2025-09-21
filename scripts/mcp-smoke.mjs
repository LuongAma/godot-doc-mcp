import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListToolsResultSchema, ReadResourceResultSchema } from '@modelcontextprotocol/sdk/types.js';

function parseJsonTextContent(result) {
  const item = result.content && result.content[0];
  if (!item || item.type !== 'text') return null;
  try { return JSON.parse(item.text); } catch { return null; }
}

async function main() {
  const cwd = process.cwd();
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['--import','tsx','server/src/cli.ts'],
    cwd,
    env: { ...process.env, GODOT_DOC_DIR: 'server/test/fixtures', MCP_STDIO: '1', MCP_SERVER_LOG: 'error' },
    stderr: 'pipe'
  });
  if (transport.stderr) {
    transport.stderr.on('data', (d) => {
      try { process.stderr.write(String(d)); } catch {}
    });
  }

  const client = new Client({ name: 'smoke-client', version: '0.0.1' });
  await client.connect(transport);

  // List tools
  const toolsResult = await client.request({ method: 'tools/list' }, ListToolsResultSchema);
  const toolNames = toolsResult.tools.map(t => t.name).sort();
  console.log('TOOLS:', toolNames.join(', '));

  // Tool: list_classes
  const listRes = await client.callTool({ method: 'tools/call', params: { name: 'godot_list_classes', arguments: { prefix: 'Vec' } } });
  const classes = parseJsonTextContent(listRes) || [];
  console.log('LIST_CLASSES(Vec):', classes);

  // Tool: get_class
  const clsRes = await client.callTool({ method: 'tools/call', params: { name: 'godot_get_class', arguments: { name: 'Vector2' } } });
  const cls = parseJsonTextContent(clsRes) || {};
  console.log('GET_CLASS(Vector2): methods=', (cls.methods||[]).length, 'properties=', (cls.properties||[]).length);

  // Tool: search
  const searchRes = await client.callTool({ method: 'tools/call', params: { name: 'godot_search', arguments: { query: 'pressed', kind: 'signal', limit: 3 } } });
  const search = parseJsonTextContent(searchRes) || [];
  console.log('SEARCH(pressed signal):', search.map(x=>x.name));

  // Resource: read class
  const readClass = await client.readResource({ method: 'resources/read', params: { uri: 'godot://class/Vector2' } }, { timeout: 5000 });
  // Validate schema and show size
  const validated = ReadResourceResultSchema.parse(readClass);
  const textItem = validated.contents[0];
  console.log('READ_RESOURCE(class): bytes=', (textItem.text||'').length);

  await client.close();
}

main().catch(err => { console.error('[SMOKE ERROR]', err); process.exit(1); });

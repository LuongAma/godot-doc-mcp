import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['--import','tsx','server/src/cli.ts'],
    env: {
      // Use the real docs corpus in ./doc
      GODOT_DOC_DIR: './doc',
      MCP_STDIO: '1',
      MCP_SERVER_LOG: 'warn',
    },
    stderr: 'pipe',
    cwd: process.cwd(),
  });

  const client = new Client({ name: 'mcp-smoke-client', version: '0.1.0' });

  try {
    // Stream server stderr for visibility
    const err = transport.stderr;
    if (err) {
      err.on('data', (chunk) => {
        try { process.stderr.write(String(chunk)); } catch {}
      });
    }

    console.log('Starting + connecting to server process...');
    await client.connect(transport);
    console.log('Server pid:', transport.pid);
    console.log('Initialized.');
    // Wait a tick to let server warm its index after initialize
    await new Promise(r => setTimeout(r, 250));

    // List tools
    const tools = await client.listTools();
    console.log('Tools:', tools.tools.map(t => t.name).join(', '));

    // Call list classes with prefix
    const listRes = await client.callTool({
      name: 'godot_list_classes',
      arguments: { prefix: 'Vec', limit: 10 },
    });
    const listPayload = JSON.parse(listRes.content?.[0]?.text ?? '[]');
    console.log('Classes starting with "Vec":', listPayload);

    // Fetch a class via tool (single doc)
    const classRes = await client.callTool({
      name: 'godot_get_class',
      arguments: { name: 'Vector2' },
    });
    const classDoc = JSON.parse(classRes.content?.[0]?.text ?? '{}');
    console.log('Vector2 methods:', classDoc.methods?.length, 'properties:', classDoc.properties?.length);

    // Fetch a class with ancestors
    const classAncRes = await client.callTool({
      name: 'godot_get_class',
      arguments: { name: 'Button', includeAncestors: true, maxDepth: 0 },
    });
    const classAnc = JSON.parse(classAncRes.content?.[0]?.text ?? '{}');
    if (Array.isArray(classAnc.inheritanceChain)) {
      console.log('Button chain length:', classAnc.inheritanceChain.length);
    }

    // Fetch a symbol via tool
    const symRes = await client.callTool({
      name: 'godot_get_symbol',
      arguments: { qname: 'Button.pressed' },
    });
    const symDoc = JSON.parse(symRes.content?.[0]?.text ?? '{}');
    console.log('Symbol kind:', symDoc.kind, 'name:', symDoc.name, 'class:', symDoc.className);

    // Read a class via resource
    const classResource = await client.readResource({ uri: 'godot://class/Node' });
    const nodeDoc = JSON.parse(classResource.contents?.[0]?.text ?? '{}');
    console.log('Node brief:', (nodeDoc.brief || '').slice(0, 80));

    // Read a class with ancestors via resource query
    const classResourceAnc = await client.readResource({ uri: 'godot://class/Button?ancestors=1&maxDepth=0' });
    const buttonAnc = JSON.parse(classResourceAnc.contents?.[0]?.text ?? '{}');
    console.log('Button chain (resource):', Array.isArray(buttonAnc.inheritanceChain) ? buttonAnc.inheritanceChain.length : 'n/a');

    // Search via resource URI
    const searchResource = await client.readResource({ uri: 'godot://search?q=pressed&kind=signal&limit=3' });
    const searchResults = JSON.parse(searchResource.contents?.[0]?.text ?? '[]');
    console.log('Search pressed signals:', searchResults.map(r => r.name));

  } finally {
    await client.close();
    // Drain any stderr from server for debugging
    const stderr = transport.stderr;
    if (stderr) {
      try { stderr.resume(); } catch {}
    }
  }
}

main().catch(err => { console.error('[MCP CLIENT ERROR]', err); process.exit(1); });

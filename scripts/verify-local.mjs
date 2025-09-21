import { createServer } from '../server/src/index.ts';

async function main() {
  const { tools } = await createServer({ MCP_STDIO: '0', GODOT_DOC_DIR: 'server/test/fixtures' });
  const list = await tools.listClasses({ prefix: 'Vec' });
  console.log('list(Vec):', list);
  const cls = await tools.getClass({ name: 'Vector2' });
  console.log('getClass(Vector2).methods:', cls.methods.length);
  const sym = await tools.getSymbol({ qname: 'Vector2.x' });
  console.log('getSymbol(Vector2.x).kind:', sym.kind);
  const search = await tools.search({ query: 'pressed', kind: 'signal', limit: 2 });
  console.log('search pressed signals:', search.map(x=>x.name));
}

main().catch(err => { console.error('[VERIFY ERROR]', err); process.exit(1); });

import { createServer } from '../server/src/index.ts';

const name = process.argv[2] || 'Button';

async function main() {
  const GODOT_DOC_DIR = process.env.GODOT_DOC_DIR || './doc';
  const { tools } = await createServer({ MCP_STDIO: '0', GODOT_DOC_DIR });
  const cls = await tools.getClass({ name });
  console.log(JSON.stringify(cls, null, 2));
}

main().catch(err => { console.error('[PRINT-CLASS ERROR]', err); process.exit(1); });

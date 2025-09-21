import { spawn } from 'node:child_process';
import process from 'node:process';

function frame(obj) {
  return Buffer.from(JSON.stringify(obj) + "\n", 'utf8');
}

class ReadBuffer {
  constructor() { this.buf = Buffer.alloc(0); }
  append(chunk) { this.buf = Buffer.concat([this.buf, chunk]); }
  read() {
    const text = this.buf.toString('utf8');
    const i = text.indexOf('\n');
    if (i === -1) return null;
    const line = text.slice(0, i).replace(/\r$/, '');
    this.buf = Buffer.from(text.slice(i+1), 'utf8');
    return JSON.parse(line);
  }
}

async function main() {
  const child = spawn('node', ['--import','tsx','server/src/cli.ts'], {
    env: { ...process.env, GODOT_DOC_DIR: 'server/test/fixtures', MCP_STDIO: '1', MCP_SERVER_LOG: 'error' }
  });
  child.on('spawn', ()=>console.error('[manual] child spawned pid', child.pid));
  child.on('close', (code)=>console.error('[manual] child closed code', code));
  child.on('error', (e)=>console.error('[manual] child error', e));
  child.stderr.on('data', (d)=>process.stderr.write(String(d)));
  const rb = new ReadBuffer();
  child.stdout.on('data', (d)=>{ rb.append(d); let msg; while ((msg = rb.read())) { console.log('RECV', JSON.stringify(msg)); } });

  const init = { jsonrpc:'2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: { tools: {}, resources: {}, prompts: {} }, clientInfo: { name: 'manual', version: '0.0.1' } } };
  child.stdin.write(frame(init));

  setTimeout(()=>{
    const list = { jsonrpc:'2.0', id: 2, method: 'tools/list', params: {} };
    child.stdin.write(frame(list));
  }, 150);

  setTimeout(()=>{ try { child.kill(); } catch {} }, 1500);
}

main().catch(err => { console.error(err); process.exit(1);});

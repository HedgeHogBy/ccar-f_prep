// CCAR-F exam emulator: zero-dependency local server.
// Serves the UI, the question bank, and persists attempt history to data/history.json.
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, 'public');
const QUESTIONS = join(ROOT, 'questions');
const DATA = join(ROOT, 'data');
const HISTORY = join(DATA, 'history.json');
const PORT = Number(process.env.PORT || 4317);
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export async function loadBank() {
  const files = (await readdir(QUESTIONS)).filter((f) => f.endsWith('.json')).sort();
  const bank = { scenarios: [], domains: [], questions: [], errors: [] };
  for (const f of files) {
    try {
      const json = JSON.parse(await readFile(join(QUESTIONS, f), 'utf8'));
      if (json.scenarios) bank.scenarios.push(...json.scenarios);
      if (json.domains) bank.domains.push(...json.domains);
      if (json.questions) bank.questions.push(...json.questions.map((q) => ({ ...q, source: f })));
    } catch (e) {
      bank.errors.push(`${f}: ${e.message}`);
    }
  }
  bank.errors.push(...validate(bank));
  return bank;
}

export function validate(bank) {
  const errs = [];
  const scen = new Set(bank.scenarios.map((s) => s.id));
  const dom = new Set(bank.domains.map((d) => d.id));
  const ids = new Set();
  for (const q of bank.questions) {
    const where = `${q.source}:${q.id}`;
    if (ids.has(q.id)) errs.push(`${where} duplicate id`);
    ids.add(q.id);
    if (!scen.has(q.scenario)) errs.push(`${where} unknown scenario ${q.scenario}`);
    if (!dom.has(q.domain)) errs.push(`${where} unknown domain ${q.domain}`);
    const correct = (q.options || []).filter((o) => o.correct).length;
    const need = q.select || 1;
    if (!Array.isArray(q.options) || q.options.length < 4) errs.push(`${where} needs >= 4 options`);
    if (correct !== need) errs.push(`${where} has ${correct} correct options but select=${need}`);
  }
  return errs;
}

async function readHistory() {
  if (!existsSync(HISTORY)) return [];
  try { return JSON.parse(await readFile(HISTORY, 'utf8')); } catch { return []; }
}

function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 5e6) throw new Error('body too large');
  }
  return data ? JSON.parse(data) : null;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/bank') return send(res, 200, await loadBank());
    if (url.pathname === '/api/history' && req.method === 'GET') return send(res, 200, await readHistory());
    if (url.pathname === '/api/history' && req.method === 'POST') {
      const attempt = await readBody(req);
      const hist = await readHistory();
      hist.push(attempt);
      await mkdir(DATA, { recursive: true });
      await writeFile(HISTORY, JSON.stringify(hist, null, 2));
      return send(res, 200, { ok: true, count: hist.length });
    }
    if (url.pathname === '/api/history' && req.method === 'DELETE') {
      await mkdir(DATA, { recursive: true });
      await writeFile(HISTORY, '[]');
      return send(res, 200, { ok: true });
    }
    let p = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = normalize(join(PUBLIC, decodeURIComponent(p)));
    if (!file.startsWith(PUBLIC) || !existsSync(file)) return send(res, 404, 'Not found', 'text/plain');
    return send(res, 200, await readFile(file), MIME[extname(file)] || 'application/octet-stream');
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => {
    console.log(`CCAR-F emulator running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });
}

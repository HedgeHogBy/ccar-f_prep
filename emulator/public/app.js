import { EXAM, buildExam, buildFixedForm, score, isCorrect } from './engine.js';

const $app = document.getElementById('app');
const LS_SESSION = 'ccarf.session.v1';
const LS_SETTINGS = 'ccarf.settings.v1';
const LETTERS = 'ABCDEFGH';

const S = {
  bank: null, byId: {}, history: [], screen: 'home', session: null, timer: null, warned: {},
  settings: { rawCut: EXAM.defaultRawCut, avoidRecent: true, practiceTimer: false, ...JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}') },
};

// ---------- utils ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function md(s) {
  const blocks = [];
  let t = esc(s).replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _l, code) => { blocks.push(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`); return `\u0000${blocks.length - 1}\u0000`; });
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.split(/\n{2,}/).map((p) => {
    if (/^\u0000\d+\u0000$/.test(p.trim())) return p;
    const lines = p.split('\n');
    if (lines.every((l) => /^\s*- /.test(l))) return `<ul>${lines.map((l) => `<li>${l.replace(/^\s*- /, '')}</li>`).join('')}</ul>`;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[i]);
}
const fmtTime = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
const pct = (c, t) => (t ? Math.round((100 * c) / t) : 0);
const domName = (id) => S.bank.domains.find((d) => d.id === id)?.name || id;
const scen = (id) => S.bank.scenarios.find((s) => s.id === id);
const save = () => { if (S.session) localStorage.setItem(LS_SESSION, JSON.stringify(S.session)); else localStorage.removeItem(LS_SESSION); };
const saveSettings = () => localStorage.setItem(LS_SETTINGS, JSON.stringify(S.settings));
function toast(msg, ms = 4000) { const el = document.getElementById('toast'); el.innerHTML = `<div class="t">${esc(msg)}</div>`; setTimeout(() => { el.innerHTML = ''; }, ms); }
function modal(html, bind) {
  const m = document.getElementById('modal'); document.getElementById('modal-card').innerHTML = html; m.classList.remove('hidden');
  const close = () => m.classList.add('hidden');
  bind?.(document.getElementById('modal-card'), close);
  return close;
}
const confirmModal = (title, body, okLabel, onOk, danger = false) => modal(
  `<h3>${esc(title)}</h3><div>${body}</div><div class="row" style="margin-top:18px"><span class="spacer"></span><button data-x>Cancel</button><button class="${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button></div>`,
  (el, close) => { el.querySelector('[data-x]').onclick = close; el.querySelector('[data-ok]').onclick = () => { close(); onOk(); }; });

async function api(path, opts) { const r = await fetch(path, opts); if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); }

// ---------- boot ----------
async function boot() {
  try { S.bank = await api('/api/bank'); } catch (e) { $app.innerHTML = `<div class="wrap"><div class="card"><h2>Could not load the question bank</h2><p>${esc(e.message)}</p><p>Start the app with <code>npm start</code> inside <code>emulator/</code> and open the printed URL.</p></div></div>`; return; }
  S.byId = Object.fromEntries(S.bank.questions.map((q) => [q.id, q]));
  try { S.history = await api('/api/history'); } catch { S.history = []; }
  const saved = JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
  if (saved && !saved.result && saved.form.items.every((i) => S.byId[i.id])) {
    S.session = saved;
    if (saved.deadline && Date.now() >= saved.deadline) { finish(true); return; }
    S.screen = saved.screen || 'exam';
    toast('Resumed your unfinished session. The exam clock kept running while you were away.');
  }
  render();
}

// ---------- session lifecycle ----------
function recentIds() {
  const ids = new Set();
  S.history.slice(-2).forEach((h) => h.items?.forEach((i) => ids.add(i.id)));
  return ids;
}
function missedIds() {
  const last = {};
  S.history.forEach((h) => h.items?.forEach((i) => { last[i.id] = i.ok; }));
  return Object.entries(last).filter(([id, ok]) => !ok && S.byId[id]).map(([id]) => id);
}

function start(mode, opts = {}) {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  let form;
  if (mode === 'missed') {
    const ids = missedIds();
    if (!ids.length) { toast('No missed questions yet. Take an exam first.'); return; }
    form = buildFixedForm(S.bank, ids, { seed });
  } else {
    form = buildExam(S.bank, { seed, avoid: S.settings.avoidRecent ? recentIds() : new Set(), ...opts });
  }
  if (!form.items.length) { toast('No questions match that selection.'); return; }
  const timed = mode === 'exam' || (mode !== 'exam' && S.settings.practiceTimer);
  const minutes = mode === 'exam' ? EXAM.minutes : Math.round((form.items.length * EXAM.minutes) / EXAM.totalItems);
  S.session = { mode, form, answers: {}, flags: {}, struck: {}, checked: {}, idx: 0, timeLimitMin: timed ? minutes : null, deadline: null, startedAt: null, screen: mode === 'exam' ? 'nda' : 'exam', label: opts.label || '' };
  S.warned = {};
  if (mode !== 'exam') beginClock();
  S.screen = S.session.screen;
  save(); render();
}
function beginClock() {
  const s = S.session; s.startedAt = Date.now();
  if (s.timeLimitMin) s.deadline = s.startedAt + s.timeLimitMin * 60000;
}
function go(screen) { S.screen = screen; if (S.session) S.session.screen = screen; save(); render(); }

async function finish(timeUp = false) {
  const s = S.session; stopTimer();
  s.result = score(S.bank, s.form, s.answers, S.settings.rawCut);
  s.endedAt = Date.now(); s.timeUp = timeUp;
  const attempt = {
    at: new Date(s.endedAt).toISOString(), mode: s.mode, label: s.label, seed: s.form.seed, scenarios: s.form.scenarios,
    durationSec: Math.round((s.endedAt - (s.startedAt || s.endedAt)) / 1000), timeUp,
    scaled: s.result.scaled, passed: s.result.passed, correct: s.result.correct, total: s.result.total,
    perDomain: s.result.perDomain, perScenario: s.result.perScenario, items: s.result.results.map(({ id, ok }) => ({ id, ok })),
    flagged: Object.keys(s.flags).filter((k) => s.flags[k]).length,
  };
  S.history.push(attempt);
  try { await api('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attempt) }); } catch { toast('Could not save history (server offline?)'); }
  localStorage.removeItem(LS_SESSION);
  S.screen = s.mode === 'exam' ? 'result' : 'result';
  render();
}

// ---------- timer ----------
function startTimer() {
  stopTimer();
  if (!S.session?.deadline) return;
  const tick = () => {
    const left = S.session.deadline - Date.now();
    const el = document.getElementById('timer');
    if (el) { el.textContent = fmtTime(left); el.classList.toggle('low', left <= 5 * 60000); }
    for (const m of [15, 5, 1]) if (left <= m * 60000 && !S.warned[m] && S.session.timeLimitMin > m) { S.warned[m] = true; toast(`${m} minute${m > 1 ? 's' : ''} remaining`); }
    if (left <= 0) { toast('Time has expired. Your exam has been submitted.', 6000); finish(true); }
  };
  tick(); S.timer = setInterval(tick, 1000);
}
function stopTimer() { if (S.timer) clearInterval(S.timer); S.timer = null; }

// ---------- render ----------
function render() {
  stopTimer();
  const views = { home, nda, exam, review, result, answers, history };
  $app.innerHTML = (views[S.screen] || home)();
  bind[S.screen]?.();
  if (['exam', 'review'].includes(S.screen)) startTimer();
  window.scrollTo(0, 0);
}

function home() {
  const b = S.bank, last = S.history.filter((h) => h.mode === 'exam').slice(-1)[0];
  const counts = (key) => Object.fromEntries([...new Set(b.questions.map((q) => q[key]))].map((k) => [k, b.questions.filter((q) => q[key] === k).length]));
  const sc = counts('scenario'), dc = counts('domain');
  const missed = missedIds().length;
  return `<div class="wrap">
    <h1>CCAR-F Exam Emulator</h1>
    <p class="muted">Claude Certified Architect – Foundations. An unofficial simulator built from the public exam guide (v1.1). All questions are original and are not real exam items.</p>
    ${b.errors.length ? `<div class="card fail"><strong>Question bank problems:</strong><ul>${b.errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
    <div class="grid">
      <div class="card mode"><h3>Full exam simulation</h3><p>60 items · 120 min · 4 of 6 scenarios at random · blueprint-weighted · no feedback until the end · flag & review · scaled 100–1000 (pass 720).</p><button class="primary" data-start="exam">Start exam</button></div>
      <div class="card mode"><h3>Practice set</h3><p>Same draw logic with instant per-option feedback. Choose the size.</p>
        <div class="row"><select id="pn"><option>15</option><option selected>30</option><option>60</option></select><button data-start="practice">Start</button></div></div>
      <div class="card mode"><h3>Domain drill</h3><p>Questions from one domain across all scenarios, with feedback.</p>
        <select id="dd">${b.domains.map((d) => `<option value="${d.id}">${d.id} ${esc(d.name)} (${dc[d.id] || 0})</option>`).join('')}</select><button data-start="domain">Drill domain</button></div>
      <div class="card mode"><h3>Scenario drill</h3><p>Every question in one scenario, with feedback.</p>
        <select id="sd">${b.scenarios.map((s) => `<option value="${s.id}">${esc(s.title)} (${sc[s.id] || 0})</option>`).join('')}</select><button data-start="scenario">Drill scenario</button></div>
      <div class="card mode"><h3>Missed questions</h3><p>Questions you got wrong on their most recent attempt (${missed}).</p><button data-start="missed" ${missed ? '' : 'disabled'}>Retry missed</button></div>
      <div class="card mode"><h3>History & weak areas</h3><p>${S.history.length} attempts${last ? ` · last exam ${last.scaled} (${last.passed ? 'PASS' : 'FAIL'})` : ''}.</p><button data-go="history">Open</button></div>
    </div>
    <div class="card"><h3>Settings</h3>
      <div class="row"><label>Assumed raw cut score <input type="number" id="cut" min="0.5" max="0.9" step="0.01" value="${S.settings.rawCut}"></label>
      <span class="muted small">Anthropic doesn't publish the raw % that maps to 720. The default assumes 72%. Raise it to practise with a safety margin.</span></div>
      <label class="chk"><input type="checkbox" id="avoid" ${S.settings.avoidRecent ? 'checked' : ''}> Avoid questions seen in the last 2 attempts when possible</label>
      <label class="chk"><input type="checkbox" id="ptimer" ${S.settings.practiceTimer ? 'checked' : ''}> Timer in practice modes (2 min per item)</label>
    </div>
    <div class="card small muted">Bank: ${b.questions.length} questions across ${b.scenarios.length} scenarios. Add more by dropping JSON files in <code>emulator/questions/</code>.
      Keyboard: <span class="kbd">A</span>–<span class="kbd">E</span> or <span class="kbd">1</span>–<span class="kbd">5</span> select · <span class="kbd">→</span>/<span class="kbd">N</span> next · <span class="kbd">←</span>/<span class="kbd">P</span> previous · <span class="kbd">F</span> flag · <span class="kbd">R</span> review screen · right-click an option to strike it out.</div>
  </div>`;
}

function nda() {
  return `<div class="wrap"><div class="card">
    <h2>Candidate agreement</h2>
    <p>The real exam opens with a confidentiality agreement (NDA) that you must accept before starting. If you decline, the session ends and the fee is forfeited. This simulation reproduces that step.</p>
    <ul>
      <li>The exam contains <strong>${S.session.form.items.length} items</strong> and you have <strong>${S.session.timeLimitMin} minutes</strong>. The clock starts when you accept and <strong>does not pause</strong>.</li>
      <li>Items are grouped by <strong>scenario</strong>. You'll get ${S.session.form.scenarios.length} of the 6 scenarios, chosen at random. Each scenario sets the production context for its items.</li>
      <li>Some items need more than one answer, and the item says how many. There's <strong>no partial credit</strong> in this simulation.</li>
      <li>You can flag items, move freely between them, and use the review screen before you end the exam. Once you end it, you can't go back.</li>
      <li>No notes, second monitor, phone, watch or headphones. Rehearse it the way you'll take it.</li>
      <li>Unanswered items are scored as incorrect, so answer every item.</li>
    </ul>
    <div class="row"><button class="danger" data-decline>Decline</button><span class="spacer"></span><button class="primary" data-accept>I accept · Begin exam</button></div>
  </div></div>`;
}

function topbar() {
  const s = S.session, it = s.form.items[s.idx];
  const label = { exam: 'CCAR-F · Claude Certified Architect – Foundations', practice: 'Practice set', domain: 'Domain drill', scenario: 'Scenario drill', missed: 'Missed questions' }[s.mode];
  return `<div class="topbar"><span class="title">${esc(label)}</span><span class="spacer"></span>
    ${S.screen === 'exam' ? `<span>Item ${s.idx + 1} of ${s.form.items.length}</span>
    <button data-flag class="${s.flags[it.id] ? 'flagged' : ''}">⚑ ${s.flags[it.id] ? 'Flagged' : 'Flag for review'}</button>` : ''}
    ${s.deadline ? `<span>Time remaining <span class="timer" id="timer">${fmtTime(s.deadline - Date.now())}</span></span>` : ''}</div>`;
}

function optionHtml(q, it, i, displayPos, { reveal, selected, struck, multi }) {
  const o = q.options[i]; const isSel = selected.includes(i);
  let cls = 'opt'; if (isSel) cls += ' selected'; if (struck.includes(i)) cls += ' struck';
  if (reveal) cls += o.correct ? ' correct' : isSel ? ' wrong' : '';
  return `<div class="${cls}" tabindex="0" data-opt="${i}" role="${multi ? 'checkbox' : 'radio'}" aria-checked="${isSel}">
    <input type="${multi ? 'checkbox' : 'radio'}" ${isSel ? 'checked' : ''} tabindex="-1"><span class="letter">${LETTERS[displayPos]}.</span>
    <div class="otext">${md(o.text)}${reveal && o.why ? `<div class="why ${o.correct ? 'ok' : 'bad'}">${o.correct ? '✔ ' : '✘ '}${md(o.why)}</div>` : ''}</div></div>`;
}

// When the answer is wrong, spell out why each picked option fails and why the correct one wins.
function mistakeSummary(q, it, sel) {
  if (isCorrect(q, sel)) return '';
  const letter = (i) => LETTERS[it.optionOrder.indexOf(i)];
  const line = (i, ok) => `<li><strong>${letter(i)}</strong>: ${md(q.options[i].why || (ok ? 'Correct.' : 'Incorrect.'))}</li>`;
  const wrongPicks = sel.filter((i) => !q.options[i].correct);
  const missed = q.options.map((o, i) => (o.correct && !sel.includes(i) ? i : -1)).filter((i) => i >= 0);
  return `<div class="mistake">
    ${!sel.length ? '<p class="fail">You left this item unanswered. It is scored as incorrect.</p>' : ''}
    ${wrongPicks.length ? `<p class="fail"><strong>Why your choice is wrong:</strong></p><ul>${wrongPicks.map((i) => line(i, false)).join('')}</ul>` : ''}
    ${missed.length ? `<p class="pass"><strong>Why the correct answer${missed.length > 1 ? 's are' : ' is'} better:</strong></p><ul>${missed.map((i) => line(i, true)).join('')}</ul>` : ''}
  </div>`;
}

function questionBody(q, it, { reveal }) {
  const s = S.session, sel = s.answers[q.id] || [], struck = s.struck[q.id] || [], need = q.select || 1, multi = need > 1;
  const sc = scen(q.scenario);
  const prev = s.form.items[s.idx - 1];
  const newScenario = !prev || S.byId[prev.id].scenario !== q.scenario;
  return `<details class="scenario" ${newScenario || S.screen === 'answers' ? 'open' : ''}><summary>Scenario: ${esc(sc?.title)}</summary><div class="body">${md(sc?.context)}</div></details>
    <div class="stem">${md(q.stem)}</div>
    ${multi ? `<div class="instr">Select ${['', 'ONE', 'TWO', 'THREE', 'FOUR'][need]}.</div>` : ''}
    ${it.optionOrder.map((i, pos) => optionHtml(q, it, i, pos, { reveal, selected: sel, struck, multi })).join('')}
    ${reveal ? `<div class="explain"><strong>${isCorrect(q, sel) ? '<span class="pass">Correct</span>' : '<span class="fail">Incorrect</span>'}</strong>${mistakeSummary(q, it, sel)} <span class="muted small">${esc(q.domain)} ${esc(domName(q.domain))}${q.task ? ` · Task ${esc(q.task)}` : ''}</span>${md(q.explanation)}${q.ref ? `<div class="small muted">Reference: ${esc(q.ref)}</div>` : ''}</div>` : ''}`;
}

function exam() {
  const s = S.session, it = s.form.items[s.idx], q = S.byId[it.id];
  const practice = s.mode !== 'exam', reveal = practice && s.checked[q.id];
  const last = s.idx === s.form.items.length - 1;
  return `${topbar()}<div class="exam">${questionBody(q, it, { reveal })}</div>
    <div class="bottombar"><button data-prev ${s.idx === 0 ? 'disabled' : ''}>◀ Previous</button>
      <button data-review>Review screen</button><span class="spacer"></span>
      ${practice && !reveal ? `<button data-check ${(s.answers[q.id] || []).length ? '' : 'disabled'}>Check answer</button>` : ''}
      ${last ? `<button class="primary" data-review>Review & end</button>` : `<button class="primary" data-next>Next ▶</button>`}</div>`;
}

function review() {
  const s = S.session, items = s.form.items;
  const unanswered = items.filter((i) => !(s.answers[i.id] || []).length).length;
  const flagged = items.filter((i) => s.flags[i.id]).length;
  let n = 0;
  const blocks = s.form.scenarios.map((sid) => {
    const its = items.map((it, idx) => ({ it, idx })).filter(({ it }) => S.byId[it.id].scenario === sid);
    if (!its.length) return '';
    return `<h3>${esc(scen(sid)?.title)}</h3><div class="navgrid">${its.map(({ it, idx }) => {
      n++; const a = (s.answers[it.id] || []).length; let c = a ? 'answered' : ''; if (s.flags[it.id]) c += ' flag';
      if (s.mode !== 'exam' && s.checked[it.id]) c += isCorrect(S.byId[it.id], s.answers[it.id]) ? ' ok' : ' no';
      return `<button class="${c}" data-goto="${idx}" title="${a ? 'Answered' : 'Unanswered'}${s.flags[it.id] ? ', flagged' : ''}">${idx + 1}</button>`;
    }).join('')}</div>`;
  }).join('');
  return `${topbar()}<div class="exam"><h2>Review screen</h2>
    <p class="legend small muted"><span>■ answered</span><span>□ unanswered</span><span>⚑ flagged</span></p>
    <p>${items.length - unanswered} of ${items.length} answered · <strong>${unanswered}</strong> unanswered · <strong>${flagged}</strong> flagged</p>
    <div class="row" style="margin-bottom:14px"><button data-first="all">Review all</button><button data-first="flag" ${flagged ? '' : 'disabled'}>Review flagged</button><button data-first="unans" ${unanswered ? '' : 'disabled'}>Review unanswered</button></div>
    <div class="card">${blocks}</div></div>
    <div class="bottombar"><button data-back>◀ Return to item ${s.idx + 1}</button><span class="spacer"></span><button class="danger" data-end>End exam</button></div>`;
}

function bars(map, nameFn, weights) {
  return `<table><tr><th>Area</th><th style="width:40%">Correct</th><th>%</th><th>Items</th>${weights ? '<th>Weight</th>' : ''}</tr>${Object.entries(map).sort().map(([k, v]) => {
    const p = pct(v.correct, v.total);
    return `<tr><td>${esc(nameFn(k))}</td><td><div class="bar ${p < 70 ? 'weak' : ''}"><div style="width:${p}%"></div></div></td><td>${p}%</td><td>${v.correct}/${v.total}</td>${weights ? `<td>${Math.round((weights[k] || 0) * 100)}%</td>` : ''}</tr>`;
  }).join('')}</table>`;
}

function result() {
  const s = S.session, r = s.result, mins = Math.round((s.endedAt - (s.startedAt || s.endedAt)) / 60000);
  const weakest = Object.entries(r.perDomain).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0];
  return `<div class="wrap">
    <div class="card"><div class="muted small">Score report · ${new Date(s.endedAt).toLocaleString()}${s.timeUp ? ' · <strong class="fail">time expired</strong>' : ''}</div>
      <p class="big ${r.passed ? 'pass' : 'fail'}">${r.passed ? 'PASS' : 'FAIL'}</p>
      <h2 style="margin:4px 0">Scaled score: ${r.scaled} <span class="muted small">/ 1000 (passing: ${EXAM.passScaled})</span></h2>
      <p class="muted">${r.correct}/${r.total} correct (${pct(r.correct, r.total)}%) · ${mins} min used${s.timeLimitMin ? ` of ${s.timeLimitMin}` : ''} · scenarios: ${s.form.scenarios.map((x) => esc(scen(x)?.title)).join(', ')}</p>
      <p class="small muted">The scaled score is an approximation that assumes a raw cut of ${Math.round(S.settings.rawCut * 100)}%. The real exam equates forms using a standard-setting study. Like the real report, the per-domain percentages below are for information only.</p>
      ${weakest ? `<p>Weakest domain: <strong>${esc(weakest[0])} ${esc(domName(weakest[0]))}</strong>. <button data-drill="${weakest[0]}">Drill it now</button></p>` : ''}
    </div>
    <div class="card"><h3>Performance by domain</h3>${bars(r.perDomain, (k) => `${k} ${domName(k)}`, EXAM.weights)}</div>
    <div class="card"><h3>Performance by scenario</h3>${bars(r.perScenario, (k) => scen(k)?.title || k)}</div>
    <div class="card"><h3>Performance by task statement</h3>${bars(r.perTask, (k) => k)}</div>
    <div class="row"><button class="primary" data-answers>Review answers & explanations</button><button data-home>Back to home</button></div>
  </div>`;
}

function answers() {
  const s = S.session, filter = s.answerFilter || 'all';
  const list = s.form.items.map((it, idx) => ({ it, idx, q: S.byId[it.id], ok: isCorrect(S.byId[it.id], s.answers[it.id]) }))
    .filter((x) => filter === 'all' || (filter === 'wrong' ? !x.ok : s.flags[x.it.id]));
  const keep = s.idx; let out = '';
  for (const x of list) { s.idx = x.idx; out += `<div class="card"><div class="muted small">Item ${x.idx + 1}${s.flags[x.it.id] ? ' · ⚑ flagged' : ''}</div>${questionBody(x.q, x.it, { reveal: true })}</div>`; }
  s.idx = keep;
  return `<div class="wrap"><div class="row"><h2>Answer review</h2><span class="spacer"></span>
    <select id="af"><option value="all" ${filter === 'all' ? 'selected' : ''}>All items</option><option value="wrong" ${filter === 'wrong' ? 'selected' : ''}>Incorrect only</option><option value="flag" ${filter === 'flag' ? 'selected' : ''}>Flagged only</option></select>
    <button data-result>Score report</button><button data-home>Home</button></div>${out || '<p>Nothing to show.</p>'}</div>`;
}

function history() {
  const h = S.history.slice().reverse();
  const agg = {};
  S.history.forEach((a) => Object.entries(a.perDomain || {}).forEach(([d, v]) => { agg[d] ??= { correct: 0, total: 0 }; agg[d].correct += v.correct; agg[d].total += v.total; }));
  const exams = S.history.filter((a) => a.mode === 'exam');
  const spark = exams.slice(-20).map((a) => a.scaled);
  const W = 600, H = 120, pts = spark.map((v, i) => `${spark.length > 1 ? (i * W) / (spark.length - 1) : W / 2},${H - ((v - 100) / 900) * H}`).join(' ');
  const cutY = H - ((720 - 100) / 900) * H;
  return `<div class="wrap"><div class="row"><h2>History</h2><span class="spacer"></span><button data-home>Home</button><button class="danger" data-clear ${h.length ? '' : 'disabled'}>Clear history</button></div>
    ${spark.length ? `<div class="card"><h3>Full-exam scaled scores (last ${spark.length})</h3><svg viewBox="-10 -10 ${W + 20} ${H + 20}" style="width:100%;max-height:170px">
      <line x1="0" x2="${W}" y1="${cutY}" y2="${cutY}" stroke="var(--bad)" stroke-dasharray="4 4"/><text x="${W}" y="${cutY - 4}" text-anchor="end" font-size="11" fill="var(--bad)">720</text>
      <polyline fill="none" stroke="var(--brand)" stroke-width="2.5" points="${pts}"/>${spark.map((v, i) => { const [x, y] = pts.split(' ')[i].split(','); return `<circle cx="${x}" cy="${y}" r="4" fill="${v >= 720 ? 'var(--ok)' : 'var(--bad)'}"><title>${v}</title></circle>`; }).join('')}</svg></div>` : ''}
    ${Object.keys(agg).length ? `<div class="card"><h3>All-time accuracy by domain</h3>${bars(agg, (k) => `${k} ${domName(k)}`, EXAM.weights)}</div>` : ''}
    <div class="card"><table><tr><th>When</th><th>Mode</th><th>Score</th><th>Correct</th><th>Time</th><th>Flagged</th></tr>
    ${h.map((a) => `<tr><td>${new Date(a.at).toLocaleString()}</td><td>${esc(a.mode)}${a.label ? ` · ${esc(a.label)}` : ''}</td><td class="${a.passed ? 'pass' : 'fail'}">${a.scaled}${a.timeUp ? ' ⏱' : ''}</td><td>${a.correct}/${a.total}</td><td>${Math.round(a.durationSec / 60)} min</td><td>${a.flagged ?? ''}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No attempts yet.</td></tr>'}</table></div></div>`;
}

// ---------- events ----------
const on = (sel, fn) => document.querySelectorAll(sel).forEach((el) => el.addEventListener('click', fn));
function select(i) {
  const s = S.session, q = S.byId[s.form.items[s.idx].id];
  if (s.mode !== 'exam' && s.checked[q.id]) return;
  const need = q.select || 1; let cur = s.answers[q.id] || [];
  if (need === 1) cur = [i];
  else if (cur.includes(i)) cur = cur.filter((x) => x !== i);
  else if (cur.length < need) cur = [...cur, i];
  else { toast(`This item needs exactly ${need} selections. Deselect one first.`, 2500); return; }
  s.answers[q.id] = cur; s.struck[q.id] = (s.struck[q.id] || []).filter((x) => x !== i);
  save(); render();
}
function move(d) { const s = S.session; const n = s.idx + d; if (n >= 0 && n < s.form.items.length) { s.idx = n; save(); render(); } else if (n >= s.form.items.length) go('review'); }

const bind = {
  home() {
    on('[data-go]', (e) => go(e.currentTarget.dataset.go));
    on('[data-start]', (e) => {
      const k = e.currentTarget.dataset.start;
      if (S.session && !S.session.result) { toast('Finish or abandon your current session first.'); return; }
      if (k === 'exam') start('exam');
      if (k === 'practice') start('practice', { totalItems: Number(document.getElementById('pn').value), label: `${document.getElementById('pn').value} items` });
      if (k === 'domain') { const d = document.getElementById('dd').value; start('domain', { domainIds: [d], totalItems: 999, label: d }); }
      if (k === 'scenario') { const sc = document.getElementById('sd').value; start('scenario', { scenarioIds: [sc], totalItems: 999, label: scen(sc)?.title }); }
      if (k === 'missed') start('missed', { label: 'missed' });
    });
    document.getElementById('cut').onchange = (e) => { S.settings.rawCut = Math.min(0.95, Math.max(0.4, Number(e.target.value) || EXAM.defaultRawCut)); saveSettings(); };
    document.getElementById('avoid').onchange = (e) => { S.settings.avoidRecent = e.target.checked; saveSettings(); };
    document.getElementById('ptimer').onchange = (e) => { S.settings.practiceTimer = e.target.checked; saveSettings(); };
  },
  nda() {
    on('[data-accept]', () => { beginClock(); go('exam'); });
    on('[data-decline]', () => confirmModal('Decline the agreement?', '<p>On the real exam, declining ends the session and the fee is forfeited.</p>', 'Decline & exit', () => { S.session = null; save(); go('home'); }, true));
  },
  exam() {
    const s = S.session;
    document.querySelectorAll('[data-opt]').forEach((el) => {
      el.addEventListener('click', () => select(Number(el.dataset.opt)));
      el.addEventListener('contextmenu', (ev) => { ev.preventDefault(); const q = s.form.items[s.idx].id, i = Number(el.dataset.opt); const st = s.struck[q] || []; s.struck[q] = st.includes(i) ? st.filter((x) => x !== i) : [...st, i]; save(); render(); });
    });
    on('[data-prev]', () => move(-1)); on('[data-next]', () => move(1)); on('[data-review]', () => go('review'));
    on('[data-flag]', () => { const id = s.form.items[s.idx].id; s.flags[id] = !s.flags[id]; save(); render(); });
    on('[data-check]', () => { s.checked[s.form.items[s.idx].id] = true; save(); render(); });
    document.querySelectorAll('.scenario').forEach((d) => d.addEventListener('toggle', () => {}));
  },
  review() {
    const s = S.session;
    on('[data-goto]', (e) => { s.idx = Number(e.currentTarget.dataset.goto); go('exam'); });
    on('[data-back]', () => go('exam'));
    on('[data-first]', (e) => {
      const k = e.currentTarget.dataset.first;
      const idx = s.form.items.findIndex((it) => k === 'all' || (k === 'flag' ? s.flags[it.id] : !(s.answers[it.id] || []).length));
      if (idx >= 0) { s.idx = idx; go('exam'); }
    });
    on('[data-end]', () => {
      const un = s.form.items.filter((i) => !(s.answers[i.id] || []).length).length;
      const fl = s.form.items.filter((i) => s.flags[i.id]).length;
      confirmModal('End exam?', `<p>You have <strong>${un}</strong> unanswered and <strong>${fl}</strong> flagged items.</p><p>Once you end the exam you can't return to any item.</p>`, 'End exam', () => {
        if (s.mode === 'exam') confirmModal('Are you sure?', '<p>This is your final confirmation. Your exam will be submitted for scoring.</p>', 'Yes, end and score', () => finish(false), true);
        else finish(false);
      }, true);
    });
  },
  result() {
    on('[data-answers]', () => go('answers')); on('[data-home]', () => { S.session = null; save(); go('home'); });
    on('[data-drill]', (e) => { const d = e.currentTarget.dataset.drill; S.session = null; save(); start('domain', { domainIds: [d], totalItems: 999, label: d }); });
  },
  answers() {
    on('[data-result]', () => go('result')); on('[data-home]', () => { S.session = null; save(); go('home'); });
    document.getElementById('af').onchange = (e) => { S.session.answerFilter = e.target.value; render(); };
  },
  history() {
    on('[data-home]', () => go('home'));
    on('[data-clear]', () => confirmModal('Clear all history?', '<p>This permanently deletes every saved attempt in <code>data/history.json</code>.</p>', 'Delete history', async () => { await api('/api/history', { method: 'DELETE' }); S.history = []; render(); }, true));
  },
};

document.addEventListener('keydown', (e) => {
  if (!document.getElementById('modal').classList.contains('hidden')) { if (e.key === 'Escape') document.getElementById('modal').classList.add('hidden'); return; }
  if (S.screen !== 'exam' || e.metaKey || e.ctrlKey || e.altKey || /input|select|textarea/i.test(e.target.tagName)) return;
  const s = S.session, it = s.form.items[s.idx], k = e.key.toLowerCase();
  // A–E and 1–8 select options; F is reserved for flagging.
  let pos = 'abcde'.indexOf(k); if (/^[1-8]$/.test(k)) pos = Number(k) - 1;
  if (pos >= 0 && pos < it.optionOrder.length) { select(it.optionOrder[pos]); return; }
  if (k === 'arrowright' || k === 'n') move(1);
  else if (k === 'arrowleft' || k === 'p') move(-1);
  else if (k === 'f') { s.flags[it.id] = !s.flags[it.id]; save(); render(); }
  else if (k === 'r') go('review');
  else if (k === 'enter' && s.mode !== 'exam' && (s.answers[it.id] || []).length) { s.checked[it.id] = true; save(); render(); }
});
window.addEventListener('beforeunload', (e) => { if (S.session && !S.session.result && S.session.mode === 'exam' && S.session.startedAt) { e.preventDefault(); e.returnValue = ''; } });

boot();

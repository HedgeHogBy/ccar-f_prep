import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBank } from '../server.mjs';
import { buildExam, score, scaleScore, domainTargets, isCorrect, EXAM } from '../public/engine.js';

const bank = await loadBank();

test('bank validates', () => assert.deepEqual(bank.errors, []));

test('domain targets sum to 60 and follow blueprint', () => {
  const t = domainTargets(60);
  assert.equal(Object.values(t).reduce((a, b) => a + b, 0), 60);
  assert.deepEqual(t, { D1: 16, D2: 11, D3: 12, D4: 12, D5: 9 });
});

test('full exam: 4 distinct scenarios, 60 unique items, roughly balanced', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const f = buildExam(bank, { seed });
    assert.equal(f.scenarios.length, 4);
    assert.equal(new Set(f.scenarios).size, 4);
    assert.equal(f.items.length, Math.min(60, bank.questions.filter((q) => f.scenarios.includes(q.scenario)).length));
    assert.equal(new Set(f.items.map((i) => i.id)).size, f.items.length);
    const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
    for (const i of f.items) assert.ok(f.scenarios.includes(byId[i.id].scenario));
    // items grouped by scenario in contiguous blocks
    const seq = f.items.map((i) => byId[i.id].scenario).filter((s, k, a) => s !== a[k - 1]);
    assert.equal(seq.length, 4);
  }
});

test('seeded forms are reproducible', () => {
  assert.deepEqual(buildExam(bank, { seed: 42 }), buildExam(bank, { seed: 42 }));
});

test('scenario draw is roughly uniform', () => {
  const c = {};
  for (let seed = 1; seed <= 3000; seed++) buildExam(bank, { seed }).scenarios.forEach((s) => (c[s] = (c[s] || 0) + 1));
  for (const v of Object.values(c)) assert.ok(v > 1700 && v < 2300, JSON.stringify(c)); // expected 2000
});

test('scale: cut maps to 720, bounds hold', () => {
  assert.equal(scaleScore(EXAM.defaultRawCut), 720);
  assert.equal(scaleScore(0), 100);
  assert.equal(scaleScore(1), 1000);
  assert.ok(scaleScore(0.71) < 720 && scaleScore(0.73) > 720);
});

test('multi-response has no partial credit', () => {
  const q = bank.questions.find((x) => x.select === 2);
  const right = q.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
  assert.ok(isCorrect(q, right));
  assert.ok(!isCorrect(q, [right[0]]));
});

test('perfect and empty answer sheets', () => {
  const f = buildExam(bank, { seed: 7 });
  const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
  const perfect = Object.fromEntries(f.items.map((i) => [i.id, byId[i.id].options.map((o, k) => (o.correct ? k : -1)).filter((k) => k >= 0)]));
  const r = score(bank, f, perfect);
  assert.equal(r.scaled, 1000); assert.ok(r.passed);
  const e = score(bank, f, {});
  assert.equal(e.scaled, 100); assert.ok(!e.passed);
});

test('every 4-scenario combination covers each domain at >= 60% of its blueprint target', () => {
  // Guards against bank gaps (e.g. a domain that only appears in two scenarios) that a
  // better draw cannot fix: if this fails, add questions in that domain to the weak scenarios.
  const ids = bank.scenarios.map((s) => s.id);
  const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
  const targets = domainTargets(60);
  const combos = [];
  const walk = (start, acc) => {
    if (acc.length === 4) return combos.push(acc);
    for (let i = start; i < ids.length; i++) walk(i + 1, [...acc, ids[i]]);
  };
  walk(0, []);
  assert.equal(combos.length, 15);
  for (const scenarioIds of combos) {
    for (let seed = 1; seed <= 20; seed++) {
      const f = buildExam(bank, { seed, scenarioIds });
      const c = Object.fromEntries(Object.keys(targets).map((d) => [d, 0]));
      for (const i of f.items) c[byId[i.id].domain]++;
      for (const [d, t] of Object.entries(targets)) {
        assert.ok(c[d] >= Math.ceil(0.6 * t), `${scenarioIds.join('+')} seed ${seed}: ${d} has ${c[d]} items (target ${t})`);
      }
    }
  }
});

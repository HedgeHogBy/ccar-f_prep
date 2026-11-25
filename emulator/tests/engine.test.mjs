import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBank } from '../server.mjs';
import { buildExam, buildFixedForm, snapshotQuestions, withSnapshot, score, scaleScore, domainTargets, isCorrect, EXAM } from '../public/engine.js';

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
        // Fresh forms reach the full target whenever the drawn scenarios hold enough items.
        const supply = bank.questions.filter((q) => q.domain === d && scenarioIds.includes(q.scenario)).length;
        assert.ok(c[d] >= Math.min(t, supply), `${scenarioIds.join('+')} seed ${seed}: ${d} has ${c[d]} items, but ${Math.min(t, supply)} are reachable`);
      }
    }
  }
});

test('repeat avoidance never pushes a domain below its floor on 2nd and 3rd mocks', () => {
  // The app avoids items from the last two attempts. Coverage must still win over freshness.
  const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
  const targets = domainTargets(60);
  for (let seed = 1; seed <= 300; seed++) {
    const seen = new Set();
    for (let mock = 0; mock < 3; mock++) {
      const f = buildExam(bank, { seed: seed + mock * 100000, avoid: new Set(seen) });
      const c = Object.fromEntries(Object.keys(targets).map((d) => [d, 0]));
      for (const i of f.items) { c[byId[i.id].domain]++; seen.add(i.id); }
      for (const [d, t] of Object.entries(targets)) {
        assert.ok(c[d] >= Math.ceil(0.6 * t), `seed ${seed} mock ${mock + 1} (${f.scenarios.join('+')}): ${d} has ${c[d]} items`);
      }
    }
  }
});

test('missed-questions drill shuffles options like an exam', () => {
  const ids = bank.questions.slice(0, 40).map((q) => q.id);
  const f = buildFixedForm(bank, ids, { seed: 5 });
  assert.deepEqual(f.items.map((i) => i.id), ids);
  assert.deepEqual(f, buildFixedForm(bank, ids, { seed: 5 }));
  const moved = f.items.filter((i) => i.optionOrder.some((v, k) => v !== k)).length;
  assert.ok(moved >= 30, `only ${moved} of 40 items had their options reordered`);
});

test('stored correct-answer position is spread out (in case anything shows source order)', () => {
  const single = bank.questions.filter((q) => !q.select);
  const pos = {};
  for (const q of single) { const p = q.options.findIndex((o) => o.correct); pos[p] = (pos[p] || 0) + 1; }
  for (const [p, n] of Object.entries(pos)) assert.ok(n / single.length <= 0.4, `correct answer stored at position ${p} in ${n} of ${single.length} items`);
});

test('a session resumed after a bank update is scored against the questions it started with', () => {
  const f = buildExam(bank, { seed: 42 });
  const snapshot = snapshotQuestions(bank, f);
  const perfect = Object.fromEntries(f.items.map((i) => [i.id, snapshot[i.id].options.map((o, k) => (o.correct ? k : -1)).filter((k) => k >= 0)]));
  // Simulate a bank update that reorders every question's options (answers are stored by index).
  const updated = { ...bank, questions: bank.questions.map((q) => ({ ...q, options: [...q.options].reverse() })) };
  assert.ok(score(updated, f, perfect).correct < f.items.length, 'sanity: the update changes the key');
  const r = score(withSnapshot(updated, snapshot), f, perfect);
  assert.equal(r.correct, f.items.length);
  // The snapshot is a copy, not a reference to the live bank.
  updated.questions[0].options.length = 0;
  assert.ok(Object.values(snapshot).every((q) => q.options.length >= 4));
});

test('repeat mocks: no single same-scenario swap could improve coverage without adding a repeat', () => {
  const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
  const targets = domainTargets(60);
  const dist = (c) => Object.entries(targets).reduce((a, [d, t]) => a + Math.abs(c[d] - t), 0);
  for (let seed = 1; seed <= 200; seed++) {
    const seen = new Set();
    for (let mock = 0; mock < 3; mock++) {
      const f = buildExam(bank, { seed: seed + mock * 100000, avoid: new Set(seen) });
      const ids = new Set(f.items.map((i) => i.id));
      const c = Object.fromEntries(Object.keys(targets).map((d) => [d, 0]));
      for (const i of f.items) c[byId[i.id].domain]++;
      for (const i of f.items) {
        const a = byId[i.id];
        for (const b of bank.questions) {
          if (b.scenario !== a.scenario || ids.has(b.id) || b.domain === a.domain) continue;
          if (seen.has(b.id) && !seen.has(a.id)) continue;
          const c2 = { ...c, [a.domain]: c[a.domain] - 1, [b.domain]: c[b.domain] + 1 };
          assert.ok(dist(c2) >= dist(c), `seed ${seed} mock ${mock + 1}: swapping ${a.id} for ${b.id} would improve coverage`);
        }
      }
      f.items.forEach((i) => seen.add(i.id));
    }
  }
});

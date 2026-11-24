// Pure exam logic (no DOM) shared by the UI and the tests.

export const EXAM = {
  totalItems: 60,
  minutes: 120,
  scenariosPerExam: 4,
  scaleMin: 100,
  scaleMax: 1000,
  passScaled: 720,
  // The real raw cut score is not published (it comes from a standard-setting study and
  // is equated across forms). We assume ~72% raw = 720 scaled. Change it in Settings.
  defaultRawCut: 0.72,
  weights: { D1: 0.27, D2: 0.18, D3: 0.20, D4: 0.20, D5: 0.15 },
};

// Deterministic PRNG so an exam form can be re-created from its seed.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Integer per-domain targets for n items using largest-remainder rounding. */
export function domainTargets(n, weights = EXAM.weights) {
  const raw = Object.entries(weights).map(([d, w]) => [d, w * n]);
  const t = Object.fromEntries(raw.map(([d, v]) => [d, Math.floor(v)]));
  let left = n - Object.values(t).reduce((s, v) => s + v, 0);
  raw.sort((x, y) => (y[1] % 1) - (x[1] % 1));
  for (let i = 0; left > 0; i++, left--) t[raw[i % raw.length][0]]++;
  return t;
}

/**
 * Pick items for one domain-balanced block list.
 * Real-exam quirk reproduced: 4 of the 6 scenarios are drawn at random, and the items
 * are spread across them. Within the drawn scenarios we pick greedily, choosing the
 * domain with the largest remaining deficit against the blueprint weights.
 * `avoid` (a Set of ids) deprioritises recently seen questions.
 */
export function buildExam(bank, { seed = Date.now(), totalItems = EXAM.totalItems,
  scenariosPerExam = EXAM.scenariosPerExam, scenarioIds = null, domainIds = null,
  avoid = new Set(), shuffleOptions = true } = {}) {
  const rand = rng(seed);
  let pool = bank.questions;
  if (domainIds) pool = pool.filter((q) => domainIds.includes(q.domain));

  let scenarios;
  if (scenarioIds) scenarios = scenarioIds.slice();
  else if (domainIds) scenarios = [...new Set(pool.map((q) => q.scenario))];
  else {
    const available = bank.scenarios.map((s) => s.id).filter((id) => pool.some((q) => q.scenario === id));
    scenarios = shuffle(available, rand).slice(0, scenariosPerExam);
  }
  scenarios = shuffle(scenarios, rand);
  pool = pool.filter((q) => scenarios.includes(q.scenario));

  const n = Math.min(totalItems, pool.length);
  const targets = domainTargets(n, domainIds
    ? Object.fromEntries(domainIds.map((d) => [d, 1 / domainIds.length]))
    : EXAM.weights);
  // Even split of items across scenarios (e.g. 15 x 4); leftovers go to the scenarios with the most questions.
  const per = Object.fromEntries(scenarios.map((s) => [s, 0]));
  const cap = Object.fromEntries(scenarios.map((s) => [s, pool.filter((q) => q.scenario === s).length]));
  for (let i = 0; i < n; i++) {
    const s = scenarios.filter((x) => per[x] < cap[x]).sort((a, b) => per[a] - per[b] || cap[b] - cap[a])[0];
    per[s]++;
  }

  // Shuffle the pool, then move recently seen questions to the back.
  const ordered = shuffle(pool, rand).sort((a, b) => (avoid.has(a.id) ? 1 : 0) - (avoid.has(b.id) ? 1 : 0));
  const have = Object.fromEntries(Object.keys(targets).map((d) => [d, 0]));
  const cand = Object.fromEntries(scenarios.map((s) => [s, ordered.filter((q) => q.scenario === s)]));
  const picked = Object.fromEntries(scenarios.map((s) => [s, []]));
  const take = (q) => {
    cand[q.scenario].splice(cand[q.scenario].indexOf(q), 1);
    have[q.domain] = (have[q.domain] ?? 0) + 1;
    picked[q.scenario].push(q);
  };

  // Phase 1: reserve domain items one at a time, always for the domain whose remaining need is
  // largest relative to the items still available for it, so a domain that only one drawn
  // scenario supplies isn't crowded out. Pass 1 reaches every domain's floor (60% of target),
  // using recently seen items only when no unseen one is left; pass 2 fills up to the full
  // targets with unseen items only.
  const free = (s) => per[s] - picked[s].length;
  const passes = [[(d) => Math.ceil(0.6 * targets[d]), () => true], [(d) => targets[d], (x) => !avoid.has(x.id)]];
  for (const [goalOf, allowed] of passes) {
    for (;;) {
      const availOf = (d) => ordered.filter((x) => x.domain === d && allowed(x) && free(x.scenario) > 0 && cand[x.scenario].includes(x));
      const open = Object.keys(targets)
        .map((d) => ({ d, need: goalOf(d) - have[d], avail: availOf(d) }))
        .filter((o) => o.need > 0 && o.avail.length);
      // Expected demand on each scenario's free slots from the other open domains.
      const slack = (s, d) => free(s) - open.filter((o) => o.d !== d)
        .reduce((sum, o) => sum + o.need * o.avail.filter((x) => x.scenario === s).length / o.avail.length, 0);
      let best = null, bestUrgency = 0;
      for (const { d, need, avail } of open) {
        const urgency = need / avail.length;
        if (urgency > bestUrgency) {
          bestUrgency = urgency;
          // Take from the least contested scenario, preferring unseen items within it.
          best = avail.sort((a, b) => (slack(b.scenario, d) - slack(a.scenario, d)) || (avoid.has(a.id) - avoid.has(b.id)))[0];
        }
      }
      if (!best) break;
      take(best);
    }
  }

  // Phase 2: fill the remaining slots round-robin across scenarios (one item per scenario per
  // round) rather than filling one scenario at a time.
  for (let progress = true; progress;) {
    progress = false;
    for (const s of scenarios) {
      if (picked[s].length >= per[s] || !cand[s].length) continue;
      // Domain coverage comes first, freshness second: an under-target domain beats any
      // domain already at target, and within each of those tiers unseen items beat recently
      // seen ones. Then the largest deficit wins; ties keep the shuffled order.
      let bestIdx = 0, best = -Infinity;
      cand[s].forEach((q, i) => {
        const deficit = (targets[q.domain] ?? 0) - (have[q.domain] ?? 0);
        const key = (deficit > 0 ? 2000 : 0) + (avoid.has(q.id) ? 0 : 1000) + deficit;
        if (key > best) { best = key; bestIdx = i; }
      });
      take(cand[s][bestIdx]);
      progress = true;
    }
  }
  const chosen = scenarios.flatMap((s) => picked[s]);

  const items = chosen.map((q) => {
    const order = q.options.map((_, i) => i);
    return { id: q.id, optionOrder: shuffleOptions && !q.fixedOrder ? shuffle(order, rand) : order };
  });
  return { seed, scenarios, items };
}

/** A form over a fixed list of question ids (e.g. the missed-questions drill), with the same seeded option shuffle as exams. */
export function buildFixedForm(bank, ids, { seed = Date.now(), shuffleOptions = true } = {}) {
  const rand = rng(seed);
  const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
  const qs = ids.map((id) => byId[id]).filter(Boolean);
  const items = qs.map((q) => {
    const order = q.options.map((_, i) => i);
    return { id: q.id, optionOrder: shuffleOptions && !q.fixedOrder ? shuffle(order, rand) : order };
  });
  return { seed, scenarios: [...new Set(qs.map((q) => q.scenario))], items };
}

export function isCorrect(q, selected) {
  const want = q.options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0).sort();
  const got = [...(selected || [])].sort();
  // Like most vendor exams, multiple-response items get no partial credit.
  return want.length === got.length && want.every((v, i) => v === got[i]);
}

/** Piecewise-linear raw→scaled mapping that puts the raw cut exactly at 720. */
export function scaleScore(rawFraction, rawCut = EXAM.defaultRawCut) {
  const { scaleMin: lo, scaleMax: hi, passScaled: cut } = EXAM;
  const s = rawFraction <= rawCut
    ? lo + (cut - lo) * (rawFraction / rawCut)
    : cut + (hi - cut) * ((rawFraction - rawCut) / (1 - rawCut));
  return Math.round(Math.max(lo, Math.min(hi, s)));
}

export function score(bank, form, answers, rawCut = EXAM.defaultRawCut) {
  const byId = Object.fromEntries(bank.questions.map((q) => [q.id, q]));
  const perDomain = {}, perScenario = {}, perTask = {};
  let correct = 0;
  const results = form.items.map((it) => {
    const q = byId[it.id];
    const ok = isCorrect(q, answers[it.id]);
    if (ok) correct++;
    for (const [map, key] of [[perDomain, q.domain], [perScenario, q.scenario], [perTask, q.task || q.domain]]) {
      map[key] ??= { correct: 0, total: 0 };
      map[key].total++;
      if (ok) map[key].correct++;
    }
    return { id: q.id, ok, answered: (answers[it.id] || []).length > 0 };
  });
  const total = form.items.length;
  const raw = total ? correct / total : 0;
  const scaled = scaleScore(raw, rawCut);
  return { correct, total, raw, scaled, passed: scaled >= EXAM.passScaled, perDomain, perScenario, perTask, results };
}

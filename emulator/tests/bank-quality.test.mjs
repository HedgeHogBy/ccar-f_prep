// Guards against "test-wiseness" cues that let you pass without knowing the material.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadBank } from '../server.mjs';

const { questions } = await loadBank();
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

test('correct option is not systematically the longest', () => {
  const longest = questions.filter((q) => {
    const L = q.options.map((o) => words(o.text)); const max = Math.max(...L);
    return L.filter((x) => x === max).length === 1 && q.options[L.indexOf(max)].correct;
  }).length;
  const rate = longest / questions.length;
  // With 4–5 options and no bias this sits near 20–25%; allow some slack.
  assert.ok(rate <= 0.35, `correct answer is the unique longest option in ${(rate * 100).toFixed(0)}% of items`);
});

test('correct and wrong options have similar length', () => {
  const ratios = questions.map((q) => {
    const c = q.options.filter((o) => o.correct).map((o) => words(o.text));
    const w = q.options.filter((o) => !o.correct).map((o) => words(o.text));
    return (c.reduce((a, b) => a + b) / c.length) / (w.reduce((a, b) => a + b) / w.length);
  });
  const m = median(ratios);
  assert.ok(m >= 0.8 && m <= 1.25, `median correct/wrong length ratio is ${m.toFixed(2)}`);
});

test('wrong options are substantive (no throwaway one-liners)', () => {
  const short = questions.flatMap((q) => q.options.filter((o) => !o.correct && words(o.text) < 8).map(() => q.id));
  assert.ok(short.length <= questions.length * 0.05, `${short.length} wrong options under 8 words: ${[...new Set(short)].slice(0, 10).join(', ')}`);
});

test('every option has a rationale', () => {
  const missing = questions.flatMap((q) => q.options.filter((o) => !o.why).map(() => q.id));
  assert.deepEqual(missing, []);
});

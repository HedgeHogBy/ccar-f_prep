// Validates the question bank and prints coverage stats. Exit code 1 on errors.
import { loadBank } from '../server.mjs';
const bank = await loadBank();
const count = (k) => bank.questions.reduce((m, q) => ((m[q[k]] = (m[q[k]] || 0) + 1), m), {});
console.log(`questions: ${bank.questions.length}`);
console.log('by scenario:', count('scenario'));
console.log('by domain:  ', count('domain'));
console.log('multi-response:', bank.questions.filter((q) => (q.select || 1) > 1).length);
if (bank.errors.length) { console.error('ERRORS:\n' + bank.errors.join('\n')); process.exit(1); }
console.log('OK');

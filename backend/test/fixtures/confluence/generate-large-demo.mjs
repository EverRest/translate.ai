import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const scopes = ['BMA/Login', 'BMA/Dashboard', 'PMA/Settings', 'SEQ/Checkout'];
const lines = ['Scope,Key,Default (EN),Hints'];

for (let i = 1; i <= 850; i += 1) {
  const scope = scopes[i % scopes.length];
  const key = `field_${String(i).padStart(4, '0')}`;
  const text = `Label for ${key}`;
  const hints =
    i % 17 === 0 ? `Keep %%token_${i}%% unchanged` : `Hint for ${key}`;
  lines.push(`${scope},${key},${text},"${hints}"`);
}

writeFileSync(join(dir, 'large-demo.csv'), `${lines.join('\n')}\n`, 'utf8');
console.log('Wrote large-demo.csv with 850 rows');

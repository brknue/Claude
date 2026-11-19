// Copies the large static assets (Stockfish engine, opening and puzzle data) from the
// published site folder (..) into public/ so `npm run build` can bundle them.
import fs from 'node:fs';
for (const dir of ['engine', 'data']) fs.cpSync(new URL(`../../${dir}/`, import.meta.url), new URL(`../public/${dir}/`, import.meta.url), { recursive: true });
console.log('assets copied');

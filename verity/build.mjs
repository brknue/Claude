import {readFile,mkdir,writeFile} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});
const assets={};
for(const name of ['index.html','app.js','style.css']) assets['/'+(name==='index.html'?'':name)] = await readFile('public/'+name,'utf8');
const worker=await readFile('worker.mjs','utf8');
await writeFile('dist/server/index.js','const ASSETS='+JSON.stringify(assets)+';\n'+worker);
console.log('Built Worker with three bundled browser assets.');

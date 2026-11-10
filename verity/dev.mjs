import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import worker from './worker.mjs';
const args=process.argv.slice(2);
const port=Number(args[args.indexOf('--port')+1]||3000);
const host=args.includes('--host')?args[args.indexOf('--host')+1]:'0.0.0.0';
const server=createServer(async(req,res)=>{try{
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 const url='http://localhost:3000'+req.url;
 if(!req.url.startsWith('/api/')){
  const p=new URL(url).pathname;const name=p==='/'?'index.html':p.slice(1);
  if(!['index.html','app.js','style.css'].includes(name)){res.writeHead(404);return res.end('Not found');}
  res.setHeader('Content-Type',name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html');return res.end(await readFile('public/'+name));
 }
 const response=await worker.fetch(new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})}),process.env);
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}catch{res.writeHead(500);res.end('Server error');}});
server.listen(port,host,()=>console.log(`http://${host}:${port}`));

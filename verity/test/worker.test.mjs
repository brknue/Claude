import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{publicUrl,extract,collectSources,normalizeReport,research} from '../worker.mjs';
const message=text=>({type:'message',content:[{type:'output_text',text}]});
test('public URLs reject private, credentialed, non-HTTPS and deceptive numeric addresses',()=>{
 for(const u of ['http://news.org','https://127.0.0.1','https://2130706433','https://0x7f000001','https://[::1]','https://a.local','https://localhost','https://user:pass@news.org','https://news.org:8443','file:///etc/passwd'])assert.throws(()=>publicUrl(u),u);
 assert.equal(publicUrl('https://news.org/article#x'),'https://news.org/article');
});
test('reader never fetches user-provided host directly and requires article body',async()=>{
 let called;const f=async u=>{called=u;return new Response('Title: Report\nMarkdown Content:\n'+('Article body. '.repeat(20)));};
 const r=await extract('https://news.org/story',f);assert.match(called,/^https:\/\/r\.jina\.ai\/https:\/\/news.org/);assert.match(r.text,/Article body/);
 await assert.rejects(()=>extract('https://news.org',async()=>new Response('Title: a'.repeat(50))),/No readable/);
 await assert.rejects(()=>extract('https://news.org',async()=>new Response('captcha'.repeat(50))),/blocked/);
});
test('source list comes only from search tool output and citation annotations',()=>{
 const sources=collectSources({output:[{type:'web_search_call',action:{sources:[{url:'https://agency.org/evidence',title:'Evidence'},{url:'http://127.0.0.1'},{url:'https://agency.org/evidence'}]}}, {type:'message',content:[{annotations:[{type:'url_citation',url:'https://university.edu/paper',title:'Paper'}]}]}]});
 assert.equal(sources.length,2);assert.equal(sources[1].id,'S2');
});
test('invented references and unsettled claims never receive scores; mean excludes unscored',()=>{
 const sources=[{id:'S1',url:'https://agency.org/evidence',title:'Evidence'}];
 const r=normalizeReport({claims:[{claim:'A',score:90,verdict:'supported',sourceIds:['S1'],explanation:'e'},{claim:'B',score:99,verdict:'supported',sourceIds:['FAKE'],explanation:'e'},{claim:'C',score:5,verdict:'contradicted',sourceIds:['S1'],explanation:'e'},{claim:'D',score:null,verdict:'unverifiable',sourceIds:['S1'],explanation:'e'}]},sources);
 assert.equal(r.claims[1].score,null);assert.equal(r.claims[1].verdict,'unverifiable');assert.equal(r.score,48);assert.deepEqual(r.coverage,{scored:2,total:4});
 assert.equal(normalizeReport({claims:[]},[]).score,null);
});
test('live research performs search then structured assessment with enumerated sources',async()=>{
 const requests=[];const fake=async(url,options)=>{requests.push(JSON.parse(options.body));return Response.json(requests.length===1?{output:[{type:'web_search_call',action:{sources:[{url:'https://agency.org/paper',title:'Primary research'}]}},message('Research with source context.')]}:{output:[message(JSON.stringify({title:'Claim check',summary:'Test',claims:[{claim:'A',verdict:'supported',score:90,explanation:'The paper supports A.',sourceIds:['S1']}],context:[],limitations:['Not exhaustive.']}))]});};
 const r=await research({text:'A factual assertion to check.',lang:'de',access:'pasted'}, {OPENAI_API_KEY:'test-key'},fake);
 assert.equal(requests[0].tools[0].type,'web_search');assert.equal(requests[0].tool_choice,'required');assert.equal(requests[1].text.format.type,'json_schema');assert.equal(requests[0].store,false);assert.equal(r.score,90);
});
test('no search sources fails closed rather than producing a score',async()=>{
 await assert.rejects(()=>research({text:'A claim',access:'pasted'}, {OPENAI_API_KEY:'test'},async()=>Response.json({output:[message('No citations')]})),/No traceable/);
});
test('API readiness and missing credential are explicit',async()=>{
 const r=await worker.fetch(new Request('https://verity.site/api/config'),{});assert.equal((await r.json()).ready,false);
 const c=await worker.fetch(new Request('https://verity.site/api/check',{method:'POST'}),{});assert.equal(c.status,503);assert.match((await c.json()).error,/not activated/);
});
test('API requires platform identity and same origin before any paid work',async()=>{
 const r=await worker.fetch(new Request('https://verity.site/api/check',{method:'POST',headers:{Origin:'https://attacker.org'}}),{OPENAI_API_KEY:'test'});assert.equal(r.status,403);
 const s=await worker.fetch(new Request('https://verity.site/api/check',{method:'POST'}),{OPENAI_API_KEY:'test'});assert.equal(s.status,401);
});
test('video URLs cannot be rated from a page title or preview',async()=>{
 const r=await worker.fetch(new Request('https://verity.site/api/check',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'test'},body:JSON.stringify({url:'https://www.youtube.com/watch?v=x'})}),{OPENAI_API_KEY:'test'});
 assert.equal(r.status,422);assert.match((await r.json()).error,/transcript/);
});

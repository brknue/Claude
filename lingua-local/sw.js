'use strict';
const CACHE='lingua-local-v4-'+self.registration.scope;
const PAGE=new URL('./index.html',self.location.href).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([PAGE])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||event.request.mode!=='navigate'||![new URL('./',self.location.href).pathname,new URL(PAGE).pathname].includes(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),2500);
  try{
   const response=await fetch(PAGE,{cache:'no-cache',signal:controller.signal});
   if(!response.ok)throw new Error('Page unavailable');
   await cache.put(PAGE,response.clone());
   return response;
  }catch(error){
   const cached=await cache.match(PAGE);
   if(cached)return cached;
   return new Response('Offline copy is not available yet. Connect once and reload.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }finally{clearTimeout(timer)}
 })());
});
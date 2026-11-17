'use strict';
const CACHE='lingua-local-v1';
const PAGE=new URL('./index.html',self.location.href).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([PAGE])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'&&url.pathname.startsWith(new URL('./',self.location.href).pathname)){
 event.respondWith(caches.open(CACHE).then(cache=>cache.match(PAGE)).then(hit=>hit||fetch(event.request)));
 }
});
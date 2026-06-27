1: // sw.js — Partes IRV-10
2: const CACHE = 'irv10-v20260601';
3: const FILES = ['./','./index.html','./manifest.json','./icon.png'];
4: (vacío)
5: self.addEventListener('install', function(e){
6:   self.skipWaiting();
7:   e.waitUntil(
8:     caches.open(CACHE).then(function(c){ return c.addAll(FILES); })
9:   );
10: });
11: (vacío)
12: self.addEventListener('activate', function(e){
13:   e.waitUntil(
14:     caches.keys().then(function(keys){
15:       return Promise.all(
16:         keys.filter(function(k){ return k !== CACHE; })
17:             .map(function(k){ return caches.delete(k); })
18:       );
19:     }).then(function(){
20:       return self.clients.claim();
21:     })
22:   );
23: });
24: (vacío)
25: self.addEventListener('fetch', function(e){
26:   if(e.request.mode === 'navigate'){
27:     e.respondWith(
28:       fetch(e.request).then(function(r){

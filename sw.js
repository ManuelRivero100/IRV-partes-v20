// sw.js — Partes IRV-10
const CACHE = 'irv10-v20260705d';
const FILES = ['./','./index.html','./manifest.json','./icon.png'];
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(FILES); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});
self.addEventListener('fetch', function(e){
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(function(r){
        var clone = r.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return r;
      }).catch(function(){
        return caches.match('./index.html') || caches.match('./');
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).catch(function(){
        return caches.match('./');
      });
    })
  );
});

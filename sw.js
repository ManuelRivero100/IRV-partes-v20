// sw.js — Partes IRV-10
const CACHE = 'irv10-v20260717c0';
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
// Copia de la página guardada en el móvil: primero './index.html' y, si no está, './'.
function paginaGuardada(){
  return caches.match('./index.html').then(function(r){ return r || caches.match('./'); });
}
self.addEventListener('fetch', function(e){
  if(e.request.mode === 'navigate'){
    var bustedUrl = e.request.url + (e.request.url.indexOf('?') >= 0 ? '&' : '?') + '_sw=' + Date.now();
    // Primero la red (así siempre se tiene la versión más reciente). Si la red falla, o no responde en 6 s (por ejemplo Wi-Fi sin internet
    // real), se usa la copia guardada. Si la petición llega más tarde, deja guardada la versión nueva para la próxima vez.
    e.respondWith(new Promise(function(resolve){
      var resuelto = false;
      var temporizador = setTimeout(function(){
        paginaGuardada().then(function(r){ if(r && !resuelto){ resuelto = true; resolve(r); } });
      }, 6000);
      fetch(bustedUrl, {cache: 'no-store'}).then(function(r){
        // Se renuevan las dos copias de la página ('./index.html' y './'), no solo la de la dirección con la que se abrió: si una se queda
        // atrás, sin conexión la app puede cargar una versión y creer que hay otra distinta.
        if(r.ok){
          var c1 = r.clone(), c2 = r.clone(), c3 = r.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, c1); c.put('./index.html', c2); c.put('./', c3); });
        }
        if(!resuelto){ resuelto = true; clearTimeout(temporizador); resolve(r); }
      }).catch(function(){
        clearTimeout(temporizador);
        if(resuelto) return;
        paginaGuardada().then(function(r){ resuelto = true; resolve(r || Response.error()); });
      });
    }));
    return;
  }
  // La comprobación de versión de la app (_cb=...) tiene que ir SIEMPRE a la red: si fallara y se contestara con la copia guardada, la app
  // creería que hay una versión nueva y se recargaría sin conexión.
  if(e.request.url.indexOf('_cb=') >= 0){
    e.respondWith(fetch(e.request));
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

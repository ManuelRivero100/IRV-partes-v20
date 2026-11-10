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
    // Abre SIEMPRE la copia guardada en el movil, sin esperar a la red (asi abre al instante aunque haya datos o Wi-Fi sin internet real).
    // Por detras, si hay internet, se baja la version mas reciente y se renuevan las copias guardadas ('./index.html' y './', las dos a la
    // vez para que no queden de versiones distintas): la proxima vez que se abra la app se usa la nueva, sin que el tecnico lo note.
    // Si no hay copia guardada (la primera vez), se espera a la red como siempre.
    // Una RECARGA (la del cierre diario de las 6:00, que es donde llega el codigo nuevo, o actualizar a mano) pide primero la ultima version a la red,
    // con limite de 4 s; abrir la app de forma normal usa siempre la copia guardada, sin esperar.
    var esRecarga = (e.request.cache === 'reload' || e.request.cache === 'no-cache');
    var refrescar = fetch(bustedUrl, {cache: 'no-store'}).then(function(r){
      if(!r.ok) return r;
      var c1 = r.clone(), c2 = r.clone(), c3 = r.clone();
      return caches.open(CACHE).then(function(c){
        return Promise.all([c.put(e.request, c1), c.put('./index.html', c2), c.put('./', c3)]);
      }).then(function(){ return r; });
    });
    e.waitUntil(refrescar.catch(function(){}));
    e.respondWith(paginaGuardada().then(function(g){
      if(g && !esRecarga){ refrescar.catch(function(){}); return g; }
      if(!g) return refrescar.catch(function(){ return Response.error(); });
      return new Promise(function(resolve){
        var resuelto = false;
        var temporizador = setTimeout(function(){ if(!resuelto){ resuelto = true; resolve(g); } }, 4000);
        refrescar.then(function(r){ if(!resuelto){ resuelto = true; clearTimeout(temporizador); resolve(r); } })
          .catch(function(){ clearTimeout(temporizador); if(!resuelto){ resuelto = true; resolve(g); } });
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

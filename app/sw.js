/* Roda — service worker do app
 * Guarda os arquivos do app para ele abrir rápido e funcionar sem internet.
 * Com internet, sempre busca a versão nova; sem internet, usa a guardada.
 * Ao mudar a lista de ARQUIVOS, suba a VERSAO.
 */
var VERSAO = 'roda-v1';

var ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  '../assets/css/base.css',
  '../assets/css/app.css',
  '../assets/js/tema.js',
  '../assets/js/app.js',
  '../assets/img/logo-neon.png',
  '../assets/img/favicon.png',
  '../assets/img/icon-192.png',
  '../assets/img/kit-pausa.jpg',
  '../assets/img/kit-foco.jpg',
  '../assets/img/kit-conexao.jpg',
  '../assets/img/kit-descanso.jpg'
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSAO).then(function (cache) { return cache.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.filter(function (n) { return n !== VERSAO; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function guardar(pedido, resposta) {
  if (resposta && (resposta.ok || resposta.type === 'opaque')) {
    var copia = resposta.clone();
    caches.open(VERSAO).then(function (cache) { cache.put(pedido, copia); });
  }
  return resposta;
}

self.addEventListener('fetch', function (evento) {
  var pedido = evento.request;
  if (pedido.method !== 'GET') return;

  // Fontes do Google não mudam: usa a guardada e só baixa na primeira vez
  if (new URL(pedido.url).origin !== self.location.origin) {
    evento.respondWith(
      caches.match(pedido).then(function (guardado) {
        return guardado || fetch(pedido).then(function (r) { return guardar(pedido, r); });
      })
    );
    return;
  }

  // Arquivos do app: tenta a rede primeiro para pegar a versão nova; sem internet, usa a guardada
  evento.respondWith(
    fetch(pedido).then(function (r) { return guardar(pedido, r); }).catch(function () {
      return caches.match(pedido).then(function (r) {
        return r || (pedido.mode === 'navigate' ? caches.match('./index.html') : undefined);
      });
    })
  );
});

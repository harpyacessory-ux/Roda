/* Roda — service worker do app
 * Guarda os arquivos do app para ele abrir rápido e funcionar sem internet.
 * Com internet, sempre busca a versão nova; sem internet, usa a guardada.
 * Ao mudar a lista de ARQUIVOS, suba a VERSAO.
 */
var VERSAO = 'roda-v4';

var ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  '../assets/css/base.css?v=3',
  '../assets/css/app.css?v=3',
  '../assets/js/tema.js?v=3',
  '../assets/js/config.js?v=3',
  '../assets/js/conta.js?v=3',
  '../assets/js/app.js?v=3',
  '../assets/img/logo-neon.png',
  '../assets/img/favicon.png',
  '../assets/img/icon-192.png',
  '../assets/img/kit-pausa.jpg',
  '../assets/img/kit-foco.jpg',
  '../assets/img/kit-conexao.jpg',
  '../assets/img/kit-descanso.jpg'
];

// Biblioteca de login (Firebase). Mesma versão de app/index.html: ao trocar lá, troque aqui.
// Guardada já na instalação, para o login funcionar sem internet desde a primeira visita.
var BIBLIOTECAS = [
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js'
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSAO).then(function (cache) {
      return cache.addAll(ARQUIVOS).then(function () {
        // Se o Google não responder agora, a biblioteca é guardada na próxima visita: não trava a instalação
        return Promise.all(BIBLIOTECAS.map(function (url) {
          return cache.add(url).catch(function () {});
        }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.filter(function (n) { return n !== VERSAO; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

var ARQUIVOS_FIXOS = /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|www\.gstatic\.com\/firebasejs\/)/;

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

  var url = new URL(pedido.url);
  if (url.origin !== self.location.origin) {
    // Login e dados da conta (Firebase) sempre vão direto para a rede, nunca para a cópia guardada
    if (!ARQUIVOS_FIXOS.test(url.href)) return;
    // Fontes do Google e a biblioteca do Firebase (com versão no endereço) não mudam: usa a guardada
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

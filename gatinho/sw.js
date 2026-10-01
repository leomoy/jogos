// Service Worker do Gatinho (PWA): guarda o jogo e as bibliotecas da CDN na primeira abertura e serve do cache.
// O build.mjs troca os dois marcadores abaixo (versão e lista de URLs) antes de gravar dist/pwa/sw.js.

const VERSAO = "0.9.5";
const CDN = ["https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js","https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.core.js","https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs","https://cdn.jsdelivr.net/npm/firebase@12.19.0/firebase-app.js","https://cdn.jsdelivr.net/npm/firebase@12.19.0/firebase-auth.js","https://cdn.jsdelivr.net/npm/firebase@12.19.0/firebase-firestore.js","https://cdn.jsdelivr.net/npm/firebase@12.19.0/firebase-app-check.js","https://cdn.jsdelivr.net/npm/firebase@12.19.0/firebase-database.js","https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/loaders/GLTFLoader.js","https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/utils/BufferGeometryUtils.js","https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/utils/SkeletonUtils.js"];
const SONS = ["./sons/floresta.mp3","./sons/passaros.mp3","./sons/rio.mp3","./sons/respingo-1.mp3","./sons/respingo-2.mp3","./sons/respingo-3.mp3","./sons/ronronar.mp3","./sons/ronronar-sono.mp3","./sons/miau-1.mp3","./sons/miau-2.mp3","./sons/miau-3.mp3","./sons/miau-comida.mp3","./sons/rato.mp3"];   // 0.9.5: os MP3 de sons/ ficam no cache para jogar sem internet

const CACHE = 'gatinho-' + VERSAO;
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

// Instalação: guarda os arquivos locais e as URLs da CDN no cache.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      const pedidos = ARQUIVOS.concat(SONS).map((url) => new Request(url));
      // Adiciona as URLs da CDN (uma requisição por URL).
      if (Array.isArray(CDN)) {
        for (const url of CDN) {
          if (typeof url === 'string' && url.length > 0) {
            pedidos.push(new Request(url));
          }
        }
      }
      // Se qualquer uma falhar, a instalação falha.
      return cache.addAll(pedidos);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: apaga caches antigos e assume o controle dos clientes.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => {
      const apagar = chaves.filter((nome) => nome.startsWith('gatinho-') && nome !== CACHE);
      return Promise.all(apagar.map((nome) => caches.delete(nome)));
    }).then(() => self.clients.claim())
  );
});

// Fetch: estratégia cache-first para requisições GET.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req, { ignoreVary: true }).then((emCache) => {
      if (emCache) return emCache;

      return fetch(req).then((resposta) => {
        const url = req.url;
        const daOrigem = url.startsWith(self.location.origin);
        const daCDN = url.indexOf('https://cdn.jsdelivr.net/') === 0;

        if (resposta.ok && (daOrigem || daCDN)) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }

        return resposta;
      }).catch(() => {
        // Sem rede e é navegação: devolve a página inicial do cache.
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return Promise.reject(new Error('Sem cache nem rede'));
      });
    })
  );
});

// Service worker do jogo — cache-first para mesma origem e CDN do three.js
const CACHE = 'torre-6.35.3';
const FILES = [
  "./",
  "index.html",
  "torre-6.35.3.js",
  "icon-192.png",
  "icon-512.png",
  "manifest.json",
  "assets/kenney/detail-crystal-large.glb",
  "assets/kenney/detail-crystal.glb",
  "assets/kenney/snow-detail-crystal-large.glb",
  "assets/kenney/snow-detail-crystal.glb",
  "assets/kenney/snow-detail-rocks.glb",
  "assets/kenney/snow-detail-tree-large.glb",
  "assets/kenney/tower-round-bottom-a.glb",
  "assets/kenney/tower-round-bottom-b.glb",
  "assets/kenney/tower-round-bottom-c.glb",
  "assets/kenney/tower-round-crystals.glb",
  "assets/kenney/tower-round-middle-a.glb",
  "assets/kenney/tower-round-middle-b.glb",
  "assets/kenney/tower-round-middle-c.glb",
  "assets/kenney/tower-round-roof-a.glb",
  "assets/kenney/tower-round-roof-b.glb",
  "assets/kenney/tower-round-roof-c.glb",
  "assets/kenney/tower-round-top-a.glb",
  "assets/kenney/tower-round-top-b.glb",
  "assets/kenney/tower-round-top-c.glb",
  "assets/kenney/tower-square-bottom-a.glb",
  "assets/kenney/tower-square-middle-a.glb",
  "assets/kenney/tower-square-top-a.glb",
  "assets/kenney/weapon-ballista.glb",
  "assets/kenney/weapon-cannon.glb",
  "assets/kenney/weapon-catapult.glb",
  "assets/kenney/weapon-turret.glb",
  "assets/nature/cactus_short.glb",
  "assets/nature/cactus_tall.glb",
  "assets/nature/flower_yellowA.glb",
  "assets/nature/log.glb",
  "assets/nature/mushroom_redGroup.glb",
  "assets/nature/mushroom_tanGroup.glb",
  "assets/nature/plant_bush.glb",
  "assets/nature/plant_flatTall.glb",
  "assets/nature/rock_largeA.glb",
  "assets/nature/rock_smallA.glb",
  "assets/nature/rock_tallA.glb",
  "assets/nature/rock_tallB.glb",
  "assets/nature/rock_tallC.glb",
  "assets/nature/stump_old.glb",
  "assets/nature/stump_oldTall.glb",
  "assets/nature/stump_round.glb",
  "assets/nature/tree_default.glb",
  "assets/nature/tree_detailed.glb",
  "assets/nature/tree_fat.glb",
  "assets/nature/tree_oak.glb",
  "assets/nature/tree_palmShort.glb",
  "assets/nature/tree_pineDefaultA.glb",
  "assets/nature/tree_pineRoundC.glb",
  "assets/nature/tree_thin_dark.glb",
  "assets/quaternius/demon.glb",
  "assets/quaternius/dragon.glb",
  "assets/quaternius/giant.glb",
  "assets/quaternius/orc.glb",
  "assets/quaternius/yeti.glb",
  "assets/tanks/tank-light.glb",
  "assets/tanks/tank-medium.glb",
  "assets/tanks/tank-heavy.glb",
  "assets/wwi/guard-tower.glb",
  "assets/wwi/sack-trench.glb",
  "assets/wwi/sack-trench-small.glb",
  "assets/wwi/cannon-a.glb",
  "assets/wwi/cannon-b.glb",
  "assets/wwi/turret-cannon.glb",
  "assets/wwi/barrier-large.glb",
  "assets/wwi/barrel.glb",
  "assets/wwi/dead-tree.glb",
  "assets/enemies/skeleton.glb",
  "assets/enemies/bat.glb",
  "assets/enemies/ghost.glb",
  "assets/enemies/zombie.glb",
  "assets/enemies/enemy-large.glb",
  "assets/enemies/enemy-small.glb",
  "assets/kenney/Textures/colormap.png",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.core.js"
];

// Instalação: guarda todos os arquivos e ativa a nova versão imediatamente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

// Ativação: remove caches antigos e assume o controle das abas abertas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Busca: cache-first para mesma origem e cdn.jsdelivr.net; o resto passa direto
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdn = url.hostname === 'cdn.jsdelivr.net';
  if (!sameOrigin && !isCdn) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        // Guarda uma cópia se a resposta for válida (inclusive opaque da CDN)
        if (response.ok || response.type === 'opaque') {
          const copia = response.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }
        return response;
      }).catch(() => {
        // Sem rede: se for navegação, devolve a página principal do cache
        if (req.mode === 'navigate') return caches.match('index.html');
        throw new Error('Falha de rede');
      });
    })
  );
});

// Service Worker do RTS Brasil (PWA): guarda o jogo, os assets e as bibliotecas da CDN na primeira abertura e serve do cache
// (cache-first). O build.mjs troca os marcadores abaixo (versão e listas) antes de gravar dist/web/sw.js; por isso este
// arquivo não roda em desenvolvimento (js/pwa.js só o registra no build).

const VERSAO = "8.0.0";
const CDN = [
  "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.core.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/loaders/GLTFLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/utils/BufferGeometryUtils.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/utils/SkeletonUtils.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/postprocessing/EffectComposer.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/shaders/CopyShader.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/postprocessing/ShaderPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/postprocessing/Pass.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/postprocessing/MaskPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/postprocessing/RenderPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/postprocessing/UnrealBloomPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/shaders/LuminosityHighPassShader.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/postprocessing/OutputPass.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/shaders/OutputShader.js",
  "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs"
];             // URLs da CDN (three, addons usados, rapier/firebase se usados)
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icone.svg",
  "./assets/navios/boat-row-large.glb",
  "./assets/navios/boat-row-small.glb",
  "./assets/navios/cannon-mobile.glb",
  "./assets/navios/cannon.glb",
  "./assets/navios/colormap.png",
  "./assets/navios/ship-large.glb",
  "./assets/navios/ship-medium.glb",
  "./assets/navios/ship-small.glb",
  "./assets/sons/alerta_1.ogg",
  "./assets/sons/amb_chuva.ogg",
  "./assets/sons/amb_mar.ogg",
  "./assets/sons/amb_mata.ogg",
  "./assets/sons/amb_montanha.ogg",
  "./assets/sons/amb_sertao.ogg",
  "./assets/sons/amb_vila.ogg",
  "./assets/sons/arcabuz_1.ogg",
  "./assets/sons/arcabuz_2.ogg",
  "./assets/sons/arcabuz_3.ogg",
  "./assets/sons/arvore_1.ogg",
  "./assets/sons/arvore_2.ogg",
  "./assets/sons/canhao_1.ogg",
  "./assets/sons/construcao_1.ogg",
  "./assets/sons/derrota_1.ogg",
  "./assets/sons/explosao_1.ogg",
  "./assets/sons/explosao_2.ogg",
  "./assets/sons/explosao_3.ogg",
  "./assets/sons/flecha_1.ogg",
  "./assets/sons/flecha_2.ogg",
  "./assets/sons/flecha_3.ogg",
  "./assets/sons/golpe_1.ogg",
  "./assets/sons/golpe_2.ogg",
  "./assets/sons/golpe_3.ogg",
  "./assets/sons/golpe_4.ogg",
  "./assets/sons/golpe_5.ogg",
  "./assets/sons/golpe_6.ogg",
  "./assets/sons/martelo_1.ogg",
  "./assets/sons/martelo_2.ogg",
  "./assets/sons/martelo_3.ogg",
  "./assets/sons/metralhadora_1.ogg",
  "./assets/sons/morte_1.ogg",
  "./assets/sons/morte_10.ogg",
  "./assets/sons/morte_3.ogg",
  "./assets/sons/morte_5.ogg",
  "./assets/sons/morte_6.ogg",
  "./assets/sons/morte_7.ogg",
  "./assets/sons/morte_8.ogg",
  "./assets/sons/morte_9.ogg",
  "./assets/sons/mus_jogo_1.ogg",
  "./assets/sons/mus_jogo_2.ogg",
  "./assets/sons/mus_jogo_3.ogg",
  "./assets/sons/mus_menu_1.ogg",
  "./assets/sons/mus_menu_2.ogg",
  "./assets/sons/ui_abrir.ogg",
  "./assets/sons/ui_clique_1.ogg",
  "./assets/sons/ui_clique_2.ogg",
  "./assets/sons/ui_entrega_1.ogg",
  "./assets/sons/ui_entrega_2.ogg",
  "./assets/sons/ui_erro.ogg",
  "./assets/sons/ui_fechar.ogg",
  "./assets/sons/ui_pronto.ogg",
  "./assets/sons/ui_selecao.ogg",
  "./assets/sons/vitoria_1.ogg",
  "./assets/sons/voz_ord_1.ogg",
  "./assets/sons/voz_ord_2.ogg",
  "./assets/sons/voz_ord_3.ogg",
  "./assets/sons/voz_sel_1.ogg",
  "./assets/sons/voz_sel_2.ogg",
  "./assets/sons/voz_sel_3.ogg",
  "./assets/terreno/chao.jpg",
  "./assets/terreno/veg/cactus_short.glb",
  "./assets/terreno/veg/cactus_tall.glb",
  "./assets/terreno/veg/flower_redA.glb",
  "./assets/terreno/veg/flower_yellowA.glb",
  "./assets/terreno/veg/grass.glb",
  "./assets/terreno/veg/grass_leafs.glb",
  "./assets/terreno/veg/lily_large.glb",
  "./assets/terreno/veg/plant_bush.glb",
  "./assets/terreno/veg/plant_bushDetailed.glb",
  "./assets/terreno/veg/plant_bushLarge.glb",
  "./assets/terreno/veg/rock_largeA.glb",
  "./assets/terreno/veg/stone_largeC.glb",
  "./assets/terreno/veg/stone_smallA.glb",
  "./assets/terreno/veg/stone_tallB.glb",
  "./assets/terreno/veg/stump_old.glb",
  "./assets/terreno/veg/stump_round.glb",
  "./assets/terreno/veg/tree_cone.glb",
  "./assets/terreno/veg/tree_default.glb",
  "./assets/terreno/veg/tree_detailed.glb",
  "./assets/terreno/veg/tree_fat.glb",
  "./assets/terreno/veg/tree_oak.glb",
  "./assets/terreno/veg/tree_palm.glb",
  "./assets/terreno/veg/tree_palmBend.glb",
  "./assets/terreno/veg/tree_palmDetailedTall.glb",
  "./assets/terreno/veg/tree_palmTall.glb",
  "./assets/terreno/veg/tree_pineRoundC.glb",
  "./assets/terreno/veg/tree_pineTallA.glb",
  "./assets/terreno/veg/tree_plateau.glb",
  "./assets/terreno/veg/tree_simple.glb",
  "./assets/terreno/veg/tree_tall.glb",
  "./assets/terreno/veg/tree_thin.glb",
  "./assets/unidades/animais.glb",
  "./assets/unidades/humanos.glb"
];   // arquivos da própria origem (index, manifest, ícones, assets/**)

const CACHE = 'rts-brasil-' + VERSAO;

// Instalação: guarda tudo no cache. Se qualquer arquivo falhar, a instalação falha (e o SW velho continua valendo).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      // Os arquivos da própria origem vão com cache: 'reload' — sem isso o addAll passa pelo cache HTTP do navegador (o GitHub
      // Pages manda max-age=600) e o SW novo guardaria o index.html VELHO no cache da versão nova: o aparelho ficava preso na antiga.
      const pedidos = ARQUIVOS.map((url) => new Request(url, { cache: 'reload' }));
      for (const url of CDN) pedidos.push(new Request(url));   // versão exata na URL: nunca muda, o cache HTTP serve
      return cache.addAll(pedidos);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: apaga caches de outras versões e assume o controle das páginas abertas.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => Promise.all(
      chaves.filter((n) => n.startsWith('rts-brasil-') && n !== CACHE).map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para GET. versao.json (a versão publicada) vem sempre da rede.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('/versao.json')) return;

  event.respondWith(
    // ignoreSearch só nas navegações: abrir index.html?algo continua achando a página do cache
    caches.match(req, { ignoreVary: true, ignoreSearch: req.mode === 'navigate' }).then((emCache) => {
      if (emCache) return emCache;
      return fetch(req).then((resposta) => {
        if (resposta.ok && (url.origin === self.location.origin || url.origin === 'https://cdn.jsdelivr.net')) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }
        return resposta;
      }).catch(() => {
        // sem rede e é navegação: devolve a página inicial do cache
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Promise.reject(new Error('Sem cache nem rede'));
      });
    })
  );
});

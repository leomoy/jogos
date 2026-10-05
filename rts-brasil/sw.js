// Service Worker do RTS Brasil (PWA): guarda o jogo, os assets e as bibliotecas da CDN na primeira abertura e serve do cache
// (cache-first). O build.mjs troca os marcadores abaixo (versão e listas) antes de gravar dist/web/sw.js; por isso este
// arquivo não roda em desenvolvimento (js/pwa.js só o registra no build).

const VERSAO = "0.9.9";
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
  "./assets/sons/amb_insetos.ogg",
  "./assets/sons/amb_mar.ogg",
  "./assets/sons/amb_mata.ogg",
  "./assets/sons/amb_montanha.ogg",
  "./assets/sons/amb_neve.ogg",
  "./assets/sons/amb_noite.ogg",
  "./assets/sons/amb_rio.ogg",
  "./assets/sons/amb_sertao.ogg",
  "./assets/sons/amb_vila.ogg",
  "./assets/sons/arcabuz_1.ogg",
  "./assets/sons/arcabuz_2.ogg",
  "./assets/sons/arcabuz_3.ogg",
  "./assets/sons/arcabuz_4.ogg",
  "./assets/sons/arcabuz_5.ogg",
  "./assets/sons/arvore_1.ogg",
  "./assets/sons/arvore_2.ogg",
  "./assets/sons/atq_africano_1.ogg",
  "./assets/sons/atq_africano_2.ogg",
  "./assets/sons/atq_imperial_1.ogg",
  "./assets/sons/atq_imperial_2.ogg",
  "./assets/sons/atq_indigena_1.ogg",
  "./assets/sons/atq_indigena_2.ogg",
  "./assets/sons/atq_luso_1.ogg",
  "./assets/sons/atq_luso_2.ogg",
  "./assets/sons/atq_moderno_1.ogg",
  "./assets/sons/atq_moderno_2.ogg",
  "./assets/sons/atq_sertanejo_1.ogg",
  "./assets/sons/atq_sertanejo_2.ogg",
  "./assets/sons/canhao_1.ogg",
  "./assets/sons/canhao_2.ogg",
  "./assets/sons/canhao_3.ogg",
  "./assets/sons/canhao_4.ogg",
  "./assets/sons/carroca_1.ogg",
  "./assets/sons/carroca_2.ogg",
  "./assets/sons/carroca_3.ogg",
  "./assets/sons/cavalo_1.ogg",
  "./assets/sons/cavalo_2.ogg",
  "./assets/sons/cavalo_3.ogg",
  "./assets/sons/colher_1.ogg",
  "./assets/sons/colher_2.ogg",
  "./assets/sons/colher_3.ogg",
  "./assets/sons/colher_4.ogg",
  "./assets/sons/construcao_1.ogg",
  "./assets/sons/cortar_1.ogg",
  "./assets/sons/cortar_2.ogg",
  "./assets/sons/cortar_3.ogg",
  "./assets/sons/cortar_4.ogg",
  "./assets/sons/derrota_1.ogg",
  "./assets/sons/ev_coruja_1.ogg",
  "./assets/sons/ev_passaro_1.ogg",
  "./assets/sons/ev_passaro_2.ogg",
  "./assets/sons/ev_passaro_3.ogg",
  "./assets/sons/ev_passaro_4.ogg",
  "./assets/sons/ev_rajada_1.ogg",
  "./assets/sons/ev_sapo_1.ogg",
  "./assets/sons/ev_sapo_2.ogg",
  "./assets/sons/ev_sapo_3.ogg",
  "./assets/sons/ev_sapo_4.ogg",
  "./assets/sons/ev_sapo_5.ogg",
  "./assets/sons/ev_sapo_6.ogg",
  "./assets/sons/ev_sapo_7.ogg",
  "./assets/sons/ev_trovao_1.ogg",
  "./assets/sons/ev_trovao_2.ogg",
  "./assets/sons/ev_trovao_3.ogg",
  "./assets/sons/ev_uivo_1.ogg",
  "./assets/sons/ev_voz_1.ogg",
  "./assets/sons/ev_voz_2.ogg",
  "./assets/sons/ev_voz_3.ogg",
  "./assets/sons/explosao_1.ogg",
  "./assets/sons/explosao_2.ogg",
  "./assets/sons/explosao_3.ogg",
  "./assets/sons/explosao_4.ogg",
  "./assets/sons/explosao_5.ogg",
  "./assets/sons/explosao_6.ogg",
  "./assets/sons/flecha_1.ogg",
  "./assets/sons/flecha_2.ogg",
  "./assets/sons/flecha_3.ogg",
  "./assets/sons/flecha_4.ogg",
  "./assets/sons/flecha_5.ogg",
  "./assets/sons/flecha_6.ogg",
  "./assets/sons/fuzil_1.ogg",
  "./assets/sons/fuzil_2.ogg",
  "./assets/sons/fuzil_3.ogg",
  "./assets/sons/fuzil_4.ogg",
  "./assets/sons/fuzil_5.ogg",
  "./assets/sons/golpe_1.ogg",
  "./assets/sons/golpe_10.ogg",
  "./assets/sons/golpe_2.ogg",
  "./assets/sons/golpe_3.ogg",
  "./assets/sons/golpe_4.ogg",
  "./assets/sons/golpe_5.ogg",
  "./assets/sons/golpe_6.ogg",
  "./assets/sons/golpe_7.ogg",
  "./assets/sons/golpe_8.ogg",
  "./assets/sons/golpe_9.ogg",
  "./assets/sons/golpe_mad_1.ogg",
  "./assets/sons/golpe_mad_2.ogg",
  "./assets/sons/golpe_mad_3.ogg",
  "./assets/sons/martelo_1.ogg",
  "./assets/sons/martelo_2.ogg",
  "./assets/sons/martelo_3.ogg",
  "./assets/sons/martelo_4.ogg",
  "./assets/sons/martelo_5.ogg",
  "./assets/sons/metralhadora_1.ogg",
  "./assets/sons/metralhadora_2.ogg",
  "./assets/sons/metralhadora_3.ogg",
  "./assets/sons/minerar_1.ogg",
  "./assets/sons/minerar_2.ogg",
  "./assets/sons/minerar_3.ogg",
  "./assets/sons/minerar_4.ogg",
  "./assets/sons/morte_1.ogg",
  "./assets/sons/morte_10.ogg",
  "./assets/sons/morte_3.ogg",
  "./assets/sons/morte_5.ogg",
  "./assets/sons/morte_6.ogg",
  "./assets/sons/morte_7.ogg",
  "./assets/sons/morte_8.ogg",
  "./assets/sons/morte_9.ogg",
  "./assets/sons/mosquete_1.ogg",
  "./assets/sons/mosquete_2.ogg",
  "./assets/sons/mosquete_3.ogg",
  "./assets/sons/mosquete_4.ogg",
  "./assets/sons/mus_bat_1.ogg",
  "./assets/sons/mus_bat_2.ogg",
  "./assets/sons/mus_final.ogg",
  "./assets/sons/mus_jogo_2.ogg",
  "./assets/sons/mus_menu_1.ogg",
  "./assets/sons/mus_menu_2.ogg",
  "./assets/sons/mus_p1.ogg",
  "./assets/sons/mus_p2.ogg",
  "./assets/sons/mus_p3.ogg",
  "./assets/sons/mus_p4.ogg",
  "./assets/sons/mus_p5.ogg",
  "./assets/sons/mus_p6.ogg",
  "./assets/sons/mus_p7.ogg",
  "./assets/sons/mus_p8.ogg",
  "./assets/sons/mus_p8b.ogg",
  "./assets/sons/mus_p9.ogg",
  "./assets/sons/objetivo_1.ogg",
  "./assets/sons/remar_1.ogg",
  "./assets/sons/remar_2.ogg",
  "./assets/sons/remar_3.ogg",
  "./assets/sons/sino_1.ogg",
  "./assets/sons/sino_2.ogg",
  "./assets/sons/sino_3.ogg",
  "./assets/sons/sino_4.ogg",
  "./assets/sons/ui_abrir.ogg",
  "./assets/sons/ui_clique_1.ogg",
  "./assets/sons/ui_clique_2.ogg",
  "./assets/sons/ui_entrega_1.ogg",
  "./assets/sons/ui_entrega_2.ogg",
  "./assets/sons/ui_erro.ogg",
  "./assets/sons/ui_fechar.ogg",
  "./assets/sons/ui_pronto.ogg",
  "./assets/sons/ui_selecao.ogg",
  "./assets/sons/v_africano_atq1.ogg",
  "./assets/sons/v_africano_atq2.ogg",
  "./assets/sons/v_africano_mor1.ogg",
  "./assets/sons/v_africano_mor2.ogg",
  "./assets/sons/v_africano_mor3.ogg",
  "./assets/sons/v_africano_ren1.ogg",
  "./assets/sons/v_africano_ren2.ogg",
  "./assets/sons/v_imperial_atq1.ogg",
  "./assets/sons/v_imperial_atq2.ogg",
  "./assets/sons/v_imperial_mor1.ogg",
  "./assets/sons/v_imperial_mor2.ogg",
  "./assets/sons/v_imperial_mor3.ogg",
  "./assets/sons/v_imperial_ren1.ogg",
  "./assets/sons/v_imperial_ren2.ogg",
  "./assets/sons/v_indigena_atq1.ogg",
  "./assets/sons/v_indigena_atq2.ogg",
  "./assets/sons/v_indigena_mor1.ogg",
  "./assets/sons/v_indigena_mor2.ogg",
  "./assets/sons/v_indigena_mor3.ogg",
  "./assets/sons/v_indigena_ren1.ogg",
  "./assets/sons/v_indigena_ren2.ogg",
  "./assets/sons/v_luso_atq1.ogg",
  "./assets/sons/v_luso_atq2.ogg",
  "./assets/sons/v_luso_mor1.ogg",
  "./assets/sons/v_luso_mor2.ogg",
  "./assets/sons/v_luso_mor3.ogg",
  "./assets/sons/v_luso_ren1.ogg",
  "./assets/sons/v_luso_ren2.ogg",
  "./assets/sons/v_moderno_atq1.ogg",
  "./assets/sons/v_moderno_atq2.ogg",
  "./assets/sons/v_moderno_mor1.ogg",
  "./assets/sons/v_moderno_mor2.ogg",
  "./assets/sons/v_moderno_mor3.ogg",
  "./assets/sons/v_moderno_ren1.ogg",
  "./assets/sons/v_moderno_ren2.ogg",
  "./assets/sons/v_sertanejo_atq1.ogg",
  "./assets/sons/v_sertanejo_atq2.ogg",
  "./assets/sons/v_sertanejo_mor1.ogg",
  "./assets/sons/v_sertanejo_mor2.ogg",
  "./assets/sons/v_sertanejo_mor3.ogg",
  "./assets/sons/v_sertanejo_ren1.ogg",
  "./assets/sons/v_sertanejo_ren2.ogg",
  "./assets/sons/vitoria_1.ogg",
  "./assets/terreno/chao.jpg",
  "./assets/terreno/folhagem.png",
  "./assets/terreno/veg/flower_redA.glb",
  "./assets/terreno/veg/flower_yellowA.glb",
  "./assets/terreno/veg/lily_large.glb",
  "./assets/terreno/veg/stump_old.glb",
  "./assets/terreno/veg/stump_round.glb",
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

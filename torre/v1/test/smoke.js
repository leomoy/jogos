// Smoke test dentro da página (index.html?smoke). Percorre todas as cenas e mapas, usa todas as
// ações do jogador e escreve o relatório em <pre id="smoke-out">. Rodado por test/smoke.mjs.
(function () {
  const R = { errors: [], warnings: [], steps: [] };
  const where = e => (e.filename || '').split('/').slice(-2).join('/') + ':' + e.lineno;
  window.addEventListener('error', e => R.errors.push(`${e.message} @ ${where(e)}\n${(e.error && e.error.stack || '').split('\n').slice(0, 4).join('\n')}`));
  window.addEventListener('unhandledrejection', e => R.errors.push('promise: ' + (e.reason && e.reason.stack || e.reason)));
  const ce = console.error, cw = console.warn;
  console.error = (...a) => { R.errors.push(a.map(String).join(' ')); ce.apply(console, a); };
  console.warn = (...a) => { R.warnings.push(a.map(String).join(' ')); cw.apply(console, a); };

  const wait = ms => new Promise(r => setTimeout(r, ms));
  // headless quase não roda requestAnimationFrame: avança o loop do Phaser na mão (60 fps simulados)
  let clock = 0;
  const pump = ms => { for (let t = 0; t < ms; t += 1000 / 60) TD.step(clock += 1000 / 60, 1000 / 60); };
  const fail = msg => { throw new Error(msg); };
  async function step(name, fn) {
    const n = R.errors.length;
    try { await fn(); } catch (e) { R.errors.push(`${name}: ${e.message}\n${(e.stack || '').split('\n').slice(1, 4).join('\n')}`); }
    R.steps.push((R.errors.length > n ? 'FALHA ' : 'ok    ') + name);
  }
  // texturas ausentes viram '__MISSING' no Phaser, sem erro no console
  function checkTextures(scene) {
    const miss = scene.children.list.filter(o => o.texture && o.texture.key === '__MISSING');
    if (miss.length) fail(`${miss.length} textura(s) ausente(s) em ${scene.scene.key}`);
  }
  async function go(key, data) {
    TD.scene.getScenes(true).forEach(s => TD.scene.stop(s.scene.key));
    TD.scene.start(key, data);
    pump(400);
    const s = TD.scene.getScene(key);
    if (!TD.scene.isActive(key)) fail('cena não ativa: ' + key);
    checkTextures(s);
    return s;
  }

  async function run() {
    await wait(300);
    TD.loop.sleep();
    clock = performance.now();
    pump(1500);
    await step('Boot -> Menu', async () => { if (!TD.scene.isActive('Menu')) fail('Menu não abriu'); checkTextures(TD.scene.getScene('Menu')); });
    await step('MapSelect', () => go('MapSelect'));
    await step('Help', () => go('Help'));

    for (let m = 0; m < MAPS.length; m++) {
      await step(`Mapa ${m + 1}: todas as torres, upgrades, ondas, velocidade, pausa`, async () => {
        const g = await go('Game', { map: m }), s = g.sim;
        s.gold = 1e6;
        const spots = [];
        for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (s.canBuild(c, r) && [...s.pathCells].some(k => { const [pc, pr] = k.split(',').map(Number); return Math.abs(pc - c) + Math.abs(pr - r) === 1; })) spots.push([c, r]);
        const types = s.unlockedTowers();
        types.forEach((t, i) => {
          const [c, r] = spots[i * 3 % spots.length];
          g.selectBuild(t.id);
          if (!s.build(t.id, c, r)) fail('não construiu ' + t.id);
        });
        g.selectBuild(null);
        for (const t of s.towers) { g.selected = t; while (s.upgradeCost(t) != null) g.upgradeSelected(); g.cycleTarget(); }
        if (s.towers.some(t => t.level !== 4)) fail('upgrade não chegou ao nível 5');
        g.toggleSpeed(); g.toggleSpeed();
        g.togglePause(); if (!g.paused) fail('pausa não pausou'); g.togglePause();
        g.callWave();
        g.speed = 3;
        pump(4000);
        if (s.waveIndex < 0) fail('onda não começou');
        if (s.kills === 0) fail('nenhum abate em 12s de jogo');
        g.selected = s.towers[0]; const gold = s.gold; g.sellSelected();
        if (s.gold <= gold) fail('venda não devolveu ouro');
        g.hud.update();
        checkTextures(g);
      });
    }

    await step('Fim de partida: derrota -> Result', async () => {
      const g = await go('Game', { map: 0 });
      g.sim.lives = 0; g.speed = 3;
      pump(2500);
      if (!TD.scene.isActive('Result')) fail('Result não abriu após derrota');
    });
    await step('Fim de partida: vitória -> salvamento + Result', async () => {
      Save.reset();
      const g = await go('Game', { map: 0 }), s = g.sim;
      s.waveIndex = WAVES_PER_MAP - 1; s.queue.length = 0; s.enemies.length = 0; s.waveTimer = 0; g.speed = 3;
      pump(2500);
      if (!TD.scene.isActive('Result')) fail('Result não abriu após vitória');
      Save.load();
      if (Save.data.unlocked !== 2 || Save.data.stars[0] !== 3) fail('vitória não salvou: ' + JSON.stringify(Save.data));
      Save.reset();
    });
    await step('Result telas (vitória final e derrota)', async () => {
      await go('Result', { map: 9, won: true, stars: 3, score: 1, kills: 1, goldEarned: 1, goldSpent: 1, lives: 20 });
      await go('Result', { map: 3, won: false, stars: 0, score: 1, kills: 1, goldEarned: 1, goldSpent: 1, lives: 0 });
    });
    await step('Áudio: todos os sons e música', async () => {
      Sfx.init();
      TOWERS.map(t => t.id).concat(['hit', 'death', 'build', 'upgrade', 'sell', 'leak', 'wave', 'waveClear', 'win', 'lose', 'click', 'error'])
        .forEach(n => Sfx.play(n));
      Sfx.music(true); await wait(500); Sfx.music(false);
      const was = Sfx.muted; Sfx.toggle(); Sfx.toggle(); if (Sfx.muted !== was) fail('toggle de som');
    });

    const out = document.createElement('pre');
    out.id = 'smoke-out';
    out.textContent = JSON.stringify(R);
    document.body.appendChild(out);
    document.title = R.errors.length ? 'SMOKE FAIL' : 'SMOKE OK';
  }
  window.addEventListener('load', run);
})();

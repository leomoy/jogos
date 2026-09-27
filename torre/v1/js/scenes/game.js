// js/scenes/game.js — TORRE v1 (script clássico, sem import/export)
// Depende de: Phaser, Sim (sim.js), Hud (hud.js), Sfx (audio.js), Save (save.js),
// e constantes de data.js (TILE, COLS, ROWS, MAP_W, MAP_H, GAME_W, GAME_H, SIM_DT,
// TOWERS, ENEMIES, MAPS, THEMES, TIER_COLOR, WAVES_PER_MAP)

class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.mapIndex = (data && data.map !== undefined) ? data.map : 0;
  }

  create() {
    this.sim = new Sim(this.mapIndex);
    this.speed = 1;
    this.paused = false;
    this.buildType = null;
    this.selected = null;
    this.acc = 0;
    this.ended = false;

    // Mapas de sprites
    this.towerSprites = {};   // towerId -> { base, turret, pips }
    this.enemySprites = {};   // uid -> { img, bar, ring, shadow }
    this.projSprites = {};    // projId -> image

    // Graphics de alcance
    this.rangeGfx = this.add.graphics().setDepth(1);
    this.hoverGfx = this.add.graphics().setDepth(1);

    // Overlay de pausa
    this.pauseOverlay = this.add.container().setDepth(10).setVisible(false);
    const pauseBg = this.add.rectangle(MAP_W / 2, MAP_H / 2, MAP_W, MAP_H, 0x000000, 0.55);
    const pauseTxt = this.add.text(MAP_W / 2, MAP_H / 2, 'PAUSADO', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '48px', color: '#e8ecf5'
    }).setOrigin(0.5);
    this.pauseOverlay.add([pauseBg, pauseTxt]);

    this.drawMap();
    this.setupInput();
    this.showIntro();

    // HUD por último
    this.hud = new Hud(this);
  }

  // ---------- desenho do mapa ----------
  drawMap() {
    const theme = this.sim.theme;
    const g = this.add.graphics().setDepth(0);

    // chão xadrez
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const col = ((c + r) % 2 === 0) ? theme.ground : theme.ground2;
        g.fillStyle(col, 1);
        g.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
    }

    // caminho
    g.fillStyle(theme.path, 1);
    g.lineStyle(3, theme.pathEdge, 1);
    this.sim.pathCells.forEach(function (key) {
      const parts = key.split(',');
      const c = parseInt(parts[0], 10);
      const r = parseInt(parts[1], 10);
      g.fillStyle(theme.path, 1);
      g.fillRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2);
      g.strokeRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2);
    });

    // decorações determinísticas
    const deco = theme.deco;
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (this.sim.pathCells.has(c + ',' + r)) continue;
        if ((c * 73 + r * 151) % 100 < 10) {
          const x = c * TILE + TILE / 2;
          const y = r * TILE + TILE / 2;
          const variant = (c * 31 + r * 17) % 3;
          if (variant === 0) {
            // pedra
            g.fillStyle(deco, 0.9);
            g.fillCircle(x, y, 6);
            g.fillStyle(0x000000, 0.2);
            g.fillCircle(x + 2, y + 2, 4);
          } else if (variant === 1) {
            // árvore
            g.fillStyle(0x5d4037, 1);
            g.fillRect(x - 2, y, 4, 8);
            g.fillStyle(deco, 1);
            g.fillCircle(x, y - 4, 7);
          } else {
            // cristal
            g.fillStyle(deco, 0.95);
            g.fillTriangle(x, y - 8, x - 5, y + 6, x + 5, y + 6);
          }
        }
      }
    }

    // portal de entrada (primeiro tile do caminho)
    const first = this.sim.map.path[0];
    const px = first[0] * TILE + TILE / 2;
    const py = first[1] * TILE + TILE / 2;
    const portal = this.add.circle(px, py, 14, 0x9c27b0, 0.9).setDepth(0);
    const portalRing = this.add.circle(px, py, 18, 0xba68c8, 0.6).setDepth(0);
    this.tweens.add({
      targets: [portal, portalRing],
      scale: 1.25,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // castelo/cristal a proteger (último tile)
    const last = this.sim.map.path[this.sim.map.path.length - 1];
    const cx = last[0] * TILE + TILE / 2;
    const cy = last[1] * TILE + TILE / 2;
    const castle = this.add.graphics().setDepth(0);
    castle.fillStyle(0x37474f, 1);
    castle.fillRect(cx - 12, cy - 8, 24, 16);
    castle.fillStyle(0x546e7a, 1);
    castle.fillRect(cx - 12, cy - 12, 6, 6);
    castle.fillRect(cx + 6, cy - 12, 6, 6);
    castle.fillStyle(0xffd54f, 1);
    castle.fillCircle(cx, cy, 4);
  }

  // ---------- input ----------
  setupInput() {
    this.input.mouse.disableContextMenu();

    this.input.on('pointerdown', (pointer) => {
      if (this.ended) return;
      if (pointer.x >= MAP_W) return; // painel tratado pelo Hud
      const col = Math.floor(pointer.x / TILE);
      const row = Math.floor(pointer.y / TILE);

      if (pointer.rightButtonDown()) {
        this.buildType = null;
        this.selected = null;
        return;
      }

      if (this.buildType) {
        const def = this._towerDef(this.buildType);
        if (def && this.sim.canBuild(col, row) && this.sim.gold >= def.cost) {
          const t = this.sim.build(this.buildType, col, row);
          if (t) {
            Sfx.play('build');
            if (!pointer.shiftKey) this.buildType = null;
          }
        } else {
          Sfx.play('error');
        }
      } else {
        // selecionar torre existente
        let found = null;
        for (let i = 0; i < this.sim.towers.length; i++) {
          if (this.sim.towers[i].col === col && this.sim.towers[i].row === row) { found = this.sim.towers[i]; break; }
        }
        this.selected = found;
        if (found) Sfx.play('click');
      }
    });

    const kb = this.input.keyboard;
    kb.on('keydown-1', () => this.selectBuild(TOWERS[0].id));
    kb.on('keydown-2', () => this.selectBuild(TOWERS[1].id));
    kb.on('keydown-3', () => this.selectBuild(TOWERS[2].id));
    kb.on('keydown-4', () => this.selectBuild(TOWERS[3].id));
    kb.on('keydown-5', () => this.selectBuild(TOWERS[4].id));
    kb.on('keydown-6', () => this.selectBuild(TOWERS[5].id));
    kb.on('keydown-7', () => this.selectBuild(TOWERS[6].id));
    kb.on('keydown-8', () => this.selectBuild(TOWERS[7].id));
    kb.on('keydown-9', () => this.selectBuild(TOWERS[8].id));
    kb.on('keydown-0', () => this.selectBuild(TOWERS[9].id));
    kb.on('keydown-ESC', () => { this.buildType = null; this.selected = null; });
    kb.on('keydown-U', () => this.upgradeSelected());
    kb.on('keydown-S', () => this.sellSelected());
    kb.on('keydown-T', () => this.cycleTarget());
    kb.on('keydown-N', () => this.callWave());
    kb.on('keydown-F', () => this.toggleSpeed());
    kb.on('keydown-SPACE', () => this.togglePause());
  }

  _towerDef(id) {
    for (let i = 0; i < TOWERS.length; i++) if (TOWERS[i].id === id) return TOWERS[i];
    return null;
  }

  showIntro() {
    const txt = this.add.text(MAP_W / 2, 60, 'Prepare suas defesas! Primeira onda em 30s', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '22px', color: '#e8ecf5',
      backgroundColor: 'rgba(27,31,42,0.85)', padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: txt, alpha: 0, delay: 3500, duration: 500, onComplete: () => txt.destroy() });
  }

  // ---------- update ----------
  update(time, delta) {
    if (!this.paused && !this.ended) {
      this.acc += Math.min(delta, 100) / 1000 * this.speed;
      let guard = 0;
      while (this.acc >= SIM_DT && guard < 200) {
        this.sim.step(SIM_DT);
        this.acc -= SIM_DT;
        guard++;
      }
    }

    this.syncTowers();
    this.syncEnemies();
    this.syncProjectiles();
    this.drawRange();
    this.drawHover();
    this.processEffects();

    if (this.sim.state !== 'playing' && !this.ended) {
      this.ended = true;
      if (this.sim.state === 'won') {
        Save.record(this.mapIndex, this.sim.stars(), this.sim.score);
        Sfx.play('win');
      } else {
        Sfx.play('lose');
      }
      const data = {
        map: this.mapIndex,
        won: this.sim.state === 'won',
        stars: this.sim.stars(),
        score: this.sim.score,
        kills: this.sim.kills,
        goldEarned: this.sim.goldEarned,
        goldSpent: this.sim.goldSpent,
        lives: this.sim.lives
      };
      this.time.delayedCall(1200, () => this.scene.start('Result', data));
    }

    if (this.hud) this.hud.update();
  }

  // ---------- sincronização de sprites ----------
  syncTowers() {
    const seen = {};
    for (let i = 0; i < this.sim.towers.length; i++) {
      const t = this.sim.towers[i];
      seen[t.id] = true;
      let s = this.towerSprites[t.id];
      if (!s) {
        const base = this.add.image(t.x, t.y, 'base_' + t.type.id).setDepth(2);
        const turret = this.add.image(t.x, t.y, 'turret_' + t.type.id).setDepth(2);
        const pips = this.add.graphics().setDepth(2);
        s = { base: base, turret: turret, pips: pips };
        this.towerSprites[t.id] = s;
      }
      s.base.setPosition(t.x, t.y);
      s.turret.setPosition(t.x, t.y);
      s.turret.setRotation(t.angle);
      this.drawPips(s.pips, t);
    }
    for (const key in this.towerSprites) {
      if (!seen[parseInt(key, 10)]) {
        const s = this.towerSprites[key];
        s.base.destroy(); s.turret.destroy(); s.pips.destroy();
        delete this.towerSprites[key];
      }
    }
  }

  drawPips(g, tower) {
    g.clear();
    const n = tower.level;
    if (n <= 0) return;
    const spacing = 6;
    const totalW = (n - 1) * spacing;
    const startX = tower.x - totalW / 2;
    for (let i = 0; i < n; i++) {
      g.fillStyle(0xffd54f, 1);
      g.fillCircle(startX + i * spacing, tower.y + 14, 2.5);
    }
  }

  syncEnemies() {
    const seen = {};
    for (let i = 0; i < this.sim.enemies.length; i++) {
      const e = this.sim.enemies[i];
      seen[e.uid] = true;
      let s = this.enemySprites[e.uid];
      if (!s) {
        const img = this.add.image(e.x, e.y, 'enemy_' + e.type.id).setDepth(3);
        const bar = this.add.graphics().setDepth(3);
        const ring = this.add.graphics().setDepth(3);
        const shadow = this.add.ellipse(e.x, e.y, 16, 6, 0x000000, 0.3).setDepth(2);
        s = { img: img, bar: bar, ring: ring, shadow: shadow };
        this.enemySprites[e.uid] = s;
      }
      const bob = Math.sin(this.sim.time * 6 + e.uid) * 2;
      const flyOffset = e.fly ? -8 : 0;
      const scale = (e.elite ? 1.5 : 1) * (e.type.boss ? 1.6 : 1);
      s.img.setScale(scale);
      s.img.setPosition(e.x, e.y + bob + flyOffset);
      // flipX conforme direção
      const pos2 = this.sim.posAt(e.dist + 1);
      if (pos2.x < e.x) s.img.setFlipX(true); else s.img.setFlipX(false);
      // tint
      if (e.slowT > 0) s.img.setTint(0x88ccff);
      else if (e.dotT > 0) s.img.setTint(0x88ff88);
      else s.img.clearTint();
      // sombra
      if (e.fly) {
        s.shadow.setVisible(true);
        s.shadow.setPosition(e.x, e.y + 10);
      } else {
        s.shadow.setVisible(false);
      }
      // barra de hp + escudo
      this.drawEnemyBar(s.bar, e);
      // anel de tier
      this.drawEnemyRing(s.ring, e);
    }
    for (const key in this.enemySprites) {
      if (!seen[parseInt(key, 10)]) {
        const s = this.enemySprites[key];
        s.img.destroy(); s.bar.destroy(); s.ring.destroy(); s.shadow.destroy();
        delete this.enemySprites[key];
      }
    }
  }

  drawEnemyBar(g, e) {
    g.clear();
    const w = 24;
    const x = e.x - w / 2;
    const y = e.y - 18;
    g.fillStyle(0x000000, 0.6);
    g.fillRect(x, y, w, 4);
    const hpFrac = Math.max(0, e.hp / e.maxHp);
    g.fillStyle(0x4caf50, 1);
    g.fillRect(x, y, w * hpFrac, 4);
    if (e.shield > 0) {
      const shFrac = Math.min(1, e.shield / e.maxHp);
      g.fillStyle(0x4fc3f7, 1);
      g.fillRect(x, y - 3, w * shFrac, 3);
    }
  }

  drawEnemyRing(g, e) {
    g.clear();
    const color = TIER_COLOR[e.tier - 1];
    g.lineStyle(2, color, 0.8);
    g.strokeCircle(e.x, e.y, e.size + 3);
  }

  syncProjectiles() {
    const seen = {};
    for (let i = 0; i < this.sim.projectiles.length; i++) {
      const p = this.sim.projectiles[i];
      seen[p.id] = true;
      let img = this.projSprites[p.id];
      if (!img) {
        img = this.add.image(p.x, p.y, 'proj_' + p.towerType.id).setDepth(4);
        this.projSprites[p.id] = img;
      }
      img.setPosition(p.x, p.y);
    }
    for (const key in this.projSprites) {
      if (!seen[parseInt(key, 10)]) {
        this.projSprites[key].destroy();
        delete this.projSprites[key];
      }
    }
  }

  drawRange() {
    this.rangeGfx.clear();
    if (this.selected) {
      const stats = this.sim.towerStats(this.selected);
      this.rangeGfx.lineStyle(2, 0x4fc3f7, 0.6);
      this.rangeGfx.fillStyle(0x4fc3f7, 0.1);
      this.rangeGfx.fillCircle(this.selected.x, this.selected.y, stats.range);
      this.rangeGfx.strokeCircle(this.selected.x, this.selected.y, stats.range);
    }
  }

  drawHover() {
    this.hoverGfx.clear();
    if (this.buildType) {
      const def = this._towerDef(this.buildType);
      if (!def) return;
      const pointer = this.input.activePointer;
      if (pointer.x >= MAP_W) return;
      const col = Math.floor(pointer.x / TILE);
      const row = Math.floor(pointer.y / TILE);
      const ok = this.sim.canBuild(col, row) && this.sim.gold >= def.cost;
      const x = col * TILE + TILE / 2;
      const y = row * TILE + TILE / 2;
      this.hoverGfx.fillStyle(ok ? 0x4caf50 : 0xef5350, 0.35);
      this.hoverGfx.fillRect(col * TILE, row * TILE, TILE, TILE);
      this.hoverGfx.lineStyle(2, ok ? 0x4caf50 : 0xef5350, 0.8);
      this.hoverGfx.strokeRect(col * TILE, row * TILE, TILE, TILE);
      // alcance
      this.hoverGfx.lineStyle(2, 0x4fc3f7, 0.5);
      this.hoverGfx.strokeCircle(x, y, def.range);
    }
  }

  // ---------- efeitos ----------
  processEffects() {
    const fx = this.sim.effects;
    for (let i = 0; i < fx.length; i++) {
      const e = fx[i];
      switch (e.type) {
        case 'shot':
          Sfx.play(e.towerType);
          this._turretRecoil(e.towerId);
          if (e.towerType === 'flame') this._flameCone(e.x, e.y, e.tx, e.ty);
          if (e.towerType === 'sniper') this._sniperLine(e.x, e.y, e.tx, e.ty);
          break;
        case 'chain':
          this._chainLightning(e.pts);
          break;
        case 'hit':
          this._explosion(e.x, e.y, Math.max(e.splash, 8), e.color);
          break;
        case 'death':
          this._deathBurst(e.x, e.y, e.color, e.reward);
          Sfx.play('death');
          break;
        case 'leak':
          this.cameras.main.shake(150, 0.006);
          this.cameras.main.flash(200, 239, 83, 80);
          Sfx.play('leak');
          break;
        case 'wave':
          this._waveBanner(e.n);
          Sfx.play('wave');
          break;
        case 'waveClear':
          Sfx.play('waveClear');
          break;
        case 'build':
          Sfx.play('build');
          this._particles(e.x, e.y, 0x4caf50, 5);
          break;
        case 'upgrade':
          Sfx.play('upgrade');
          this._particles(e.x, e.y, 0xffd54f, 8);
          break;
        case 'sell':
          Sfx.play('sell');
          this._particles(e.x, e.y, 0xef5350, 5);
          break;
      }
    }
    fx.length = 0;
  }

  _turretRecoil(towerId) {
    const s = this.towerSprites[towerId];
    if (!s) return;
    this.tweens.add({ targets: s.turret, scale: 1.2, duration: 60, yoyo: true });
  }

  _flameCone(x, y, tx, ty) {
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const px = x + (tx - x) * t;
      const py = y + (ty - y) * t;
      const p = this.add.circle(px, py, 4, 0xff9800, 0.8).setDepth(5);
      this.tweens.add({ targets: p, alpha: 0, scale: 0.3, duration: 300, onComplete: () => p.destroy() });
    }
  }

  _sniperLine(x, y, tx, ty) {
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(2, 0xffffff, 0.9);
    g.lineBetween(x, y, tx, ty);
    this.tweens.add({ targets: g, alpha: 0, duration: 120, onComplete: () => g.destroy() });
  }

  _chainLightning(pts) {
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(2, 0x4fc3f7, 0.9);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const segs = 4;
      let px = a.x, py = a.y;
      for (let s = 1; s <= segs; s++) {
        const t = s / segs;
        let nx = a.x + (b.x - a.x) * t;
        let ny = a.y + (b.y - a.y) * t;
        if (s < segs) {
          nx += (Math.random() - 0.5) * 8;
          ny += (Math.random() - 0.5) * 8;
        }
        g.lineBetween(px, py, nx, ny);
        px = nx; py = ny;
      }
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 120, onComplete: () => g.destroy() });
  }

  _explosion(x, y, radius, color) {
    const c = this.add.circle(x, y, radius, color, 0.5).setDepth(5);
    this.tweens.add({ targets: c, alpha: 0, scale: 1.5, duration: 250, onComplete: () => c.destroy() });
  }

  _deathBurst(x, y, color, reward) {
    this._particles(x, y, color, 6);
    const txt = this.add.text(x, y, '+' + reward, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '14px', color: '#ffd54f'
    }).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: txt, y: y - 30, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
  }

  _particles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const dist = 15 + Math.random() * 10;
      const p = this.add.circle(x, y, 3, color, 0.9).setDepth(5);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 400,
        onComplete: () => p.destroy()
      });
    }
  }

  _waveBanner(n) {
    const txt = this.add.text(MAP_W / 2, MAP_H / 2, 'Onda ' + n, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '42px', color: '#e8ecf5',
      backgroundColor: 'rgba(27,31,42,0.8)', padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 800,
      onComplete: () => txt.destroy()
    });
  }

  // ---------- métodos públicos (Hud) ----------
  selectBuild(id) {
    const def = this._towerDef(id);
    if (!def) return;
    if (def.unlock > this.mapIndex) { Sfx.play('error'); return; }
    if (this.buildType === id) {
      this.buildType = null;
    } else {
      this.buildType = id;
      this.selected = null;
      Sfx.play('click');
    }
  }

  upgradeSelected() {
    if (!this.selected) return;
    if (this.sim.upgrade(this.selected)) {
      Sfx.play('upgrade');
    } else {
      Sfx.play('error');
    }
  }

  sellSelected() {
    if (!this.selected) return;
    this.sim.sell(this.selected);
    this.selected = null;
    Sfx.play('sell');
  }

  cycleTarget() {
    if (!this.selected) return;
    this.sim.cycleTarget(this.selected);
    Sfx.play('click');
  }

  callWave() {
    if (this.sim.waveIndex < WAVES_PER_MAP - 1) {
      this.sim.callWave();
      Sfx.play('click');
    }
  }

  toggleSpeed() {
    if (this.speed === 1) this.speed = 2;
    else if (this.speed === 2) this.speed = 3;
    else this.speed = 1;
    Sfx.play('click');
  }

  togglePause() {
    this.paused = !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    Sfx.play('click');
  }

  goMenu() {
    this.scene.start('MapSelect');
  }
}

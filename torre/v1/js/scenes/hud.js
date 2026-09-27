// js/scenes/hud.js
// class Hud — painel lateral do GameScene (x: MAP_W..GAME_W, largura 240, altura 640)

const HUD = {
  BG: 0x1b1f2a,
  BORDER: 0x3a4256,
  TEXT: '#e8ecf5',
  GOLD: '#ffd54f',
  LIFE: '#ef5350',
  HIGHLIGHT: 0x4fc3f7,
  FONT: 'Trebuchet MS, sans-serif',
  PANEL_X: MAP_W,
  PANEL_W: PANEL_W,
  PANEL_H: GAME_H,
};

class Hud {
  constructor(scene) {
    this.scene = scene;
    this.sim = scene.sim;
    this.mapIndex = scene.sim.mapIndex;
    this.mapName = MAPS[this.mapIndex].name;

    // fundo do painel
    const bg = scene.add.rectangle(
      MAP_W + PANEL_W / 2,
      GAME_H / 2,
      PANEL_W,
      GAME_H,
      HUD.BG
    ).setDepth(20);
    const border = scene.add.rectangle(
      MAP_W + PANEL_W / 2,
      GAME_H / 2,
      PANEL_W,
      GAME_H,
      0x000000,
      0
    ).setStrokeStyle(2, HUD.BORDER).setDepth(21);

    // textos topo
    this.mapNameText = this._text(MAP_W + PANEL_W / 2, 14, this.mapName, { fontSize: '16px', color: HUD.TEXT, align: 'center', bold: true });
    this.goldText = this._text(MAP_W + 38, 44, '', { fontSize: '16px', color: HUD.GOLD, originX: 0, bold: true });
    this.lifeText = this._text(MAP_W + 158, 44, '', { fontSize: '16px', color: HUD.LIFE, originX: 0, bold: true });
    this.waveText = this._text(MAP_W + 16, 70, '', { fontSize: '14px', color: HUD.TEXT, originX: 0 });
    this.nextText = this._text(MAP_W + PANEL_W - 16, 70, '', { fontSize: '14px', color: '#9aa3b8', originX: 1 });
    this.scoreText = this._text(MAP_W + PANEL_W / 2, 96, '', { fontSize: '14px', color: '#9aa3b8', align: 'center' });

    // ícones topo
    scene.add.image(MAP_W + 24, 44, 'coin').setDepth(21);
    scene.add.image(MAP_W + 144, 44, 'heart').setDepth(21);

    // grade de torres
    this.towerButtons = [];
    this._buildTowerGrid();

    // área de info
    this._buildInfoArea();

    // rodapé
    this._buildFooter();

    // estado interno para setText só quando muda
    this._cache = {};
  }

  _text(x, y, str, opts = {}) {
    const t = this.scene.add.text(x, y, str, {
      fontFamily: opts.fontFamily || HUD.FONT,
      fontSize: opts.fontSize || '14px',
      color: opts.color || HUD.TEXT,
      align: opts.align || 'left',
      wordWrap: { width: opts.wrap || 200 },
      fontStyle: opts.bold ? 'bold' : 'normal',
    }).setOrigin(opts.originX !== undefined ? opts.originX : 0.5, opts.originY !== undefined ? opts.originY : 0.5).setDepth(22);
    return t;
  }

  _buildTowerGrid() {
    const towers = TOWERS;
    const cols = 2;
    const rows = 5;
    const cellW = 112;
    const cellH = 42;
    const colCenters = [MAP_W + 62, MAP_W + 178];
    const startY = 146;
    const rowGap = 46;

    for (let i = 0; i < towers.length; i++) {
      const t = towers[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = colCenters[col];
      const cy = startY + row * rowGap;

      const unlocked = t.unlock <= this.mapIndex;
      const key = (i + 1) % 10; // 1..9,0

      const btn = makeButton(
        this.scene,
        cx,
        cy,
        cellW,
        cellH,
        '',
        () => {
          if (unlocked) this.scene.selectBuild(t.id);
        },
        { fontSize: '12px', color: HUD.TEXT, depth: 22 }
      );

      // ícone da torre
      const icon = this.scene.add.image(cx - cellW / 2 + 18, cy, 'base_' + t.id).setDepth(23);
      const turret = this.scene.add.image(cx - cellW / 2 + 18, cy, 'turret_' + t.id).setDepth(23);
      icon.setScale(0.8);
      turret.setScale(0.8);

      // custo
      const costText = this._text(cx + 10, cy - 8, t.cost + '', { fontSize: '13px', color: HUD.GOLD, align: 'center' });
      // tecla
      const keyText = this._text(cx + cellW / 2 - 12, cy - cellH / 2 + 10, key + '', { fontSize: '10px', color: '#7a8299', align: 'center' });

      // cadeado se bloqueada
      let lockText = null;
      if (!unlocked) {
        lockText = this._text(cx, cy, '🔒', { fontSize: '20px', color: '#555', align: 'center' });
        btn.container.setAlpha(0.3);
        icon.setAlpha(0.3);
        turret.setAlpha(0.3);
        costText.setAlpha(0.3);
        keyText.setAlpha(0.3);
      }

      this.towerButtons.push({
        tower: t,
        btn,
        icon,
        turret,
        costText,
        keyText,
        lockText,
        unlocked,
        cx,
        cy,
      });

      // hover para descrição
      btn.bg.on('pointerover', () => {
        this.hovered = t;
      });
      btn.bg.on('pointerout', () => {
        if (this.hovered === t) this.hovered = null;
      });
    }
  }

  _buildInfoArea() {
    const x = MAP_W + PANEL_W / 2;

    this.infoName = this._text(x, 380, '', { fontSize: '15px', color: HUD.TEXT, align: 'center', bold: true });
    this.infoLevel = this._text(x, 402, '', { fontSize: '12px', color: '#9aa3b8', align: 'center' });
    this.infoDmg = this._text(x, 418, '', { fontSize: '12px', color: HUD.TEXT, align: 'center' });
    this.infoRange = this._text(x, 434, '', { fontSize: '12px', color: HUD.TEXT, align: 'center' });
    this.infoRate = this._text(x, 450, '', { fontSize: '12px', color: HUD.TEXT, align: 'center' });
    this.infoSpecial = this._text(x, 466, '', { fontSize: '12px', color: '#7a8299', align: 'center', wrap: 200 });
    this.infoKills = this._text(x, 482, '', { fontSize: '12px', color: '#7a8299', align: 'center' });
    this.infoTarget = this._text(x, 498, '', { fontSize: '12px', color: '#7a8299', align: 'center' }).setVisible(false);

    this.infoTexts = [
      this.infoName, this.infoLevel, this.infoDmg, this.infoRange,
      this.infoRate, this.infoSpecial, this.infoKills, this.infoTarget,
    ];

    // botões da área de info
    const btnY = 512;
    this.btnUpgrade = makeButton(
      this.scene, x - 55, btnY, 108, 28, 'Melhorar',
      () => this.scene.upgradeSelected(),
      { fontSize: '12px', color: HUD.TEXT, depth: 23 }
    );
    this.btnSell = makeButton(
      this.scene, x + 55, btnY, 108, 28, 'Vender',
      () => this.scene.sellSelected(),
      { fontSize: '12px', color: HUD.TEXT, depth: 23 }
    );
    this.btnTarget = makeButton(
      this.scene, x, 544, 220, 24, 'Alvo: Primeiro',
      () => this.scene.cycleTarget(),
      { fontSize: '12px', color: HUD.TEXT, depth: 23 }
    );

    this.infoButtons = [this.btnUpgrade, this.btnSell, this.btnTarget];
  }

  _buildFooter() {
    const x = MAP_W + PANEL_W / 2;

    this.btnCallWave = makeButton(
      this.scene, x, 580, 220, 30, 'Chamar onda',
      () => this.scene.callWave(),
      { fontSize: '13px', color: HUD.TEXT, depth: 23 }
    );

    const speedY = 616;
    this.btnSpeed1 = makeButton(
      this.scene, x - 98, speedY, 34, 28, '1x',
      () => { this.scene.speed = 1; this._updateSpeedButtons(); },
      { fontSize: '12px', color: HUD.TEXT, depth: 23 }
    );
    this.btnSpeed2 = makeButton(
      this.scene, x - 62, speedY, 34, 28, '2x',
      () => { this.scene.speed = 2; this._updateSpeedButtons(); },
      { fontSize: '12px', color: HUD.TEXT, depth: 23 }
    );
    this.btnSpeed3 = makeButton(
      this.scene, x - 26, speedY, 34, 28, '3x',
      () => { this.scene.speed = 3; this._updateSpeedButtons(); },
      { fontSize: '12px', color: HUD.TEXT, depth: 23 }
    );

    this.btnPause = makeButton(
      this.scene, x + 24, speedY, 70, 28, 'Pausa',
      () => this.scene.togglePause(),
      { fontSize: '12px', color: HUD.TEXT, depth: 23 }
    );
    this.btnMenu = makeButton(
      this.scene, x + 86, speedY, 42, 28, 'Menu',
      () => this.scene.goMenu(),
      { fontSize: '12px', color: HUD.TEXT, depth: 23 }
    );
  }

  _showTowerInfo(t) {
    const x = MAP_W + PANEL_W / 2;
    this.infoName.setText(t.name);
    this.infoLevel.setText('');
    this.infoDmg.setText('Dano: ' + t.dmg);
    this.infoRange.setText('Alcance: ' + t.range);
    this.infoRate.setText('Cadência: ' + t.rate + '/s');
    let special = [];
    if (t.splash) special.push('Splash ' + t.splash);
    if (t.slow) special.push('Slow ' + Math.round(t.slow * 100) + '%');
    if (t.dot) special.push('Dot ' + t.dot + ' dps');
    if (t.chain) special.push('Chain ' + t.chain);
    if (t.projSpeed === 0) special.push('Instantâneo');
    this.infoSpecial.setText(special.length ? special.join(', ') : '—');
    this.infoKills.setText('');
    this.infoTarget.setText('');
    this.infoButtons.forEach(b => b.container.setVisible(false));
  }

  _clearInfo() {
    this.infoName.setText('');
    this.infoLevel.setText('');
    this.infoDmg.setText('');
    this.infoRange.setText('');
    this.infoRate.setText('');
    this.infoSpecial.setText('');
    this.infoKills.setText('');
    this.infoTarget.setText('');
    this.infoButtons.forEach(b => b.container.setVisible(false));
  }

  _updateSpeedButtons() {
    const speeds = [this.btnSpeed1, this.btnSpeed2, this.btnSpeed3];
    const idx = this.scene.speed - 1;
    speeds.forEach((b, i) => {
      b.container.setAlpha(i === idx ? 1 : 0.5);
    });
  }

  _setIfChanged(textObj, key, value) {
    if (this._cache[key] !== value) {
      textObj.setText(value);
      this._cache[key] = value;
    }
  }

  update() {
    const sim = this.sim;
    if (!sim) return;

    // topo
    this._setIfChanged(this.goldText, 'gold', String(sim.gold));
    this._setIfChanged(this.lifeText, 'life', String(sim.lives));
    const waveNum = sim.waveIndex + 1;
    this._setIfChanged(this.waveText, 'wave', 'Onda ' + Math.max(0, waveNum) + '/10');
    if (sim.waveIndex >= 9) {
      this._setIfChanged(this.nextText, 'next', 'Última onda!');
    } else {
      this._setIfChanged(this.nextText, 'next', 'Próxima: ' + Math.ceil(sim.waveTimer) + 's');
    }
    this._setIfChanged(this.scoreText, 'score', 'Pontos: ' + sim.score);

    // torres: custo vermelho se sem ouro, destaque se selecionada
    const buildType = this.scene.buildType;
    for (const tb of this.towerButtons) {
      if (!tb.unlocked) continue;
      const canAfford = sim.gold >= tb.tower.cost;
      tb.costText.setColor(canAfford ? HUD.GOLD : '#ef5350');

      const isSelected = buildType === tb.tower.id;
      if (isSelected) {
        tb.btn.bg.setStrokeStyle(2, HUD.HIGHLIGHT);
      } else {
        tb.btn.bg.setStrokeStyle(1, HUD.BORDER);
      }
    }

    // área de info
    const selected = this.scene.selected;
    if (selected) {
      const stats = sim.towerStats(selected);
      const upCost = sim.upgradeCost(selected);
      const sellVal = sim.sellValue(selected);
      const targetNames = { first: 'Primeiro', last: 'Último', strong: 'Mais forte', close: 'Mais perto' };

      this.infoName.setText(selected.type.name);
      this.infoLevel.setText('Nível ' + (selected.level + 1) + '/5');
      this.infoDmg.setText('Dano: ' + Math.round(stats.dmg));
      this.infoRange.setText('Alcance: ' + Math.round(stats.range));
      this.infoRate.setText('Cadência: ' + stats.rate.toFixed(2) + '/s');

      let special = [];
      if (stats.splash) special.push('Splash ' + Math.round(stats.splash));
      if (stats.slow) special.push('Slow ' + Math.round(stats.slow * 100) + '%');
      if (stats.dot) special.push('Dot ' + Math.round(stats.dot) + ' dps');
      if (stats.chain) special.push('Chain ' + stats.chain);
      this.infoSpecial.setText(special.length ? special.join(', ') : '—');
      this.infoKills.setText('Abates: ' + selected.kills);
      this.infoTarget.setText('Alvo: ' + (targetNames[selected.target] || selected.target));

      this.infoButtons.forEach(b => b.container.setVisible(true));

      if (upCost !== null) {
        this.btnUpgrade.setLabel('Melhorar (' + upCost + ')');
        this.btnUpgrade.setEnabled(sim.gold >= upCost);
      } else {
        this.btnUpgrade.setLabel('Máx');
        this.btnUpgrade.setEnabled(false);
      }
      this.btnSell.setLabel('Vender (+' + sellVal + ')');
      this.btnSell.setEnabled(true);
      this.btnTarget.setLabel('Alvo: ' + (targetNames[selected.target] || selected.target));
      this.btnTarget.setEnabled(true);
    } else if (buildType) {
      const t = TOWERS.find(x => x.id === buildType);
      if (t) {
        this._showTowerInfo(t);
      }
    } else if (this.hovered) {
      this._showTowerInfo(this.hovered);
    } else {
      this._clearInfo();
      this.infoName.setText('Clique numa torre ou');
      this.infoLevel.setText('escolha uma para construir');
      this.infoDmg.setText('');
      this.infoRange.setText('');
      this.infoRate.setText('');
      this.infoSpecial.setText('');
      this.infoKills.setText('');
      this.infoTarget.setText('');
      this.infoButtons.forEach(b => b.container.setVisible(false));
    }

    // rodapé
    if (sim.waveIndex >= 9) {
      this.btnCallWave.setLabel('Chamar onda');
      this.btnCallWave.setEnabled(false);
    } else {
      const bonus = Math.floor(sim.waveTimer);
      this.btnCallWave.setLabel('Chamar onda (+' + bonus + ')');
      this.btnCallWave.setEnabled(true);
    }

    const paused = this.scene.paused;
    this.btnPause.setLabel(paused ? 'Continuar' : 'Pausa');

    this._updateSpeedButtons();
  }

  destroy() {
    this.towerButtons.forEach(tb => {
      tb.btn.container.destroy(true);
      tb.icon.destroy();
      tb.turret.destroy();
    });
    this.infoTexts.forEach(t => t.destroy());
    this.infoButtons.forEach(b => b.container.destroy(true));
    [this.btnCallWave, this.btnSpeed1, this.btnSpeed2, this.btnSpeed3, this.btnPause, this.btnMenu].forEach(b => b.container.destroy(true));
  }
}

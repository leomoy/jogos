// js/scenes/menu.js

function makeButton(scene, x, y, w, h, label, onClick, opts = {}) {
  const fontSize = opts.fontSize || 20;
  const fillColor = (opts.color !== undefined) ? opts.color : 0x2a3142;
  const depth = (opts.depth !== undefined) ? opts.depth : 100;
  const textColor = (opts.textColor !== undefined) ? opts.textColor : 0xe8ecf5;

  const container = scene.add.container(x, y);
  container.setDepth(depth);

  const bg = scene.add.rectangle(0, 0, w, h, fillColor, 1);
  bg.setStrokeStyle(2, 0x3a4256);
  bg.setInteractive({ useHandCursor: true });

  const text = scene.add.text(0, 0, label, {
    fontFamily: 'Trebuchet MS, sans-serif',
    fontSize: fontSize + 'px',
    color: '#' + textColor.toString(16).padStart(6, '0'),
    align: 'center'
  }).setOrigin(0.5);

  container.add([bg, text]);

  let enabled = true;
  let hover = false;

  function applyState() {
    if (!enabled) {
      container.setAlpha(0.45);
      bg.disableInteractive();
      return;
    }
    container.setAlpha(1);
    bg.setInteractive({ useHandCursor: true });
    const base = fillColor;
    const hoverCol = Phaser.Display.Color.IntegerToColor(base).lighten(18).color;
    bg.setFillStyle(hover ? hoverCol : base);
  }

  bg.on('pointerover', () => { hover = true; applyState(); });
  bg.on('pointerout', () => { hover = false; applyState(); });
  bg.on('pointerdown', () => {
    if (!enabled) return;
    if (typeof Sfx !== 'undefined') Sfx.play('click');
    if (typeof onClick === 'function') onClick();
  });

  applyState();

  return {
    container,
    bg,
    text,
    enabled,
    setLabel(s) { text.setText(s); },
    setEnabled(b) { enabled = !!b; applyState(); }
  };
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const W = GAME_W, H = GAME_H;

    // Fundo com gradiente escuro
    const g = this.make.graphics({ add: false });
    const top = Phaser.Display.Color.IntegerToColor(0x0a0d16);
    const bot = Phaser.Display.Color.IntegerToColor(0x1b2233);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 256, Math.floor(t * 255));
      g.fillStyle(c.color, 1);
      g.fillRect(0, y, W, 1);
    }
    g.generateTexture('menu_bg', W, H);
    g.destroy();
    this.add.image(W / 2, H / 2, 'menu_bg').setOrigin(0.5);

    // Partículas / estrelas em movimento
    const stars = [];
    for (let i = 0; i < 46; i++) {
      const s = this.add.image(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        'particle'
      ).setAlpha(Phaser.Math.FloatBetween(0.15, 0.7)).setScale(Phaser.Math.FloatBetween(0.4, 1.2));
      const dur = Phaser.Math.Between(6000, 14000);
      this.tweens.add({
        targets: s,
        y: s.y - Phaser.Math.Between(40, 160),
        alpha: 0,
        duration: dur,
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        onComplete: () => {
          s.setPosition(Phaser.Math.Between(0, W), H + 10);
          s.setAlpha(Phaser.Math.FloatBetween(0.15, 0.7));
        }
      });
      stars.push(s);
    }

    // Silhuetas decorativas de torres nos cantos inferiores
    const decoTowers = ['arrow', 'cannon', 'mage', 'tesla'];
    const decoXs = [120, 380, 820, 1080];
    decoTowers.forEach((id, i) => {
      const x = decoXs[i];
      const y = 580;
      const base = this.add.image(x, y, 'base_' + id).setScale(2.2).setAlpha(0.35);
      const turret = this.add.image(x, y - 6, 'turret_' + id).setScale(2.2).setAlpha(0.35);
      this.tweens.add({ targets: [base, turret], alpha: 0.55, duration: 1800, yoyo: true, repeat: -1, delay: i * 250 });
    });

    // Título com pulsar suave
    const title = this.add.text(W / 2, 110, 'TORRE', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '96px',
      color: '#e8ecf5',
      fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 4, '#4fc3f7', 18, true, true);
    this.tweens.add({ targets: title, scale: 1.05, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const subtitle = this.add.text(W / 2, 170, 'A Última Muralha', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '30px',
      color: '#4fc3f7'
    }).setOrigin(0.5);

    // Enredo
    const lore = this.add.text(W / 2, 215,
      'O Reino de Aurora é invadido pela Horda do Vazio, que brota de fendas em 10 regiões.\n' +
      'Você é o Engenheiro-Mor da Guarda: erga torres e proteja o coração de cada região.',
      {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#9aa4bd',
        align: 'center',
        wordWrap: { width: 800 }
      }).setOrigin(0.5);

    // Botões (260x46 em x=600, y=320,380,440,500)
    const btnX = 600;
    makeButton(this, btnX, 320, 260, 46, 'Jogar', () => this.scene.start('MapSelect'), { fontSize: 22, color: 0x2f6b4f });
    makeButton(this, btnX, 380, 260, 46, 'Como Jogar', () => this.scene.start('Help'), { fontSize: 20 });

    const soundLabel = () => (Sfx.muted ? 'Som: OFF' : 'Som: ON');
    const soundBtn = makeButton(this, btnX, 440, 260, 46, soundLabel(), () => {
      Sfx.toggle();
      if (Save.data) Save.data.sound = !Sfx.muted;
      Save.save();
      Sfx.music(!Sfx.muted);
      soundBtn.setLabel(soundLabel());
    }, { fontSize: 20 });

    let resetArmed = false;
    let resetTimer = null;
    const resetBtn = makeButton(this, btnX, 500, 260, 46, 'Resetar progresso', () => {
      if (!resetArmed) {
        resetArmed = true;
        resetBtn.setLabel('Confirmar?');
        resetTimer = this.time.delayedCall(3000, () => {
          resetArmed = false;
          resetBtn.setLabel('Resetar progresso');
        });
      } else {
        Save.reset();
        resetArmed = false;
        resetBtn.setLabel('Resetar progresso');
      }
    }, { fontSize: 20, color: 0x4a2a2a });

    // Rodapé
    this.add.text(W - 20, H - 20, 'v1', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '14px',
      color: '#5a6480'
    }).setOrigin(1, 1);

    // Inicializa som no primeiro clique
    this.input.once('pointerdown', () => {
      Sfx.init();
      Sfx.music(!Sfx.muted);
    });
  }
}

class MapSelectScene extends Phaser.Scene {
  constructor() {
    super('MapSelect');
  }

  create() {
    const W = GAME_W, H = GAME_H;

    const g = this.make.graphics({ add: false });
    const top = Phaser.Display.Color.IntegerToColor(0x0a0d16);
    const bot = Phaser.Display.Color.IntegerToColor(0x161c2b);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 256, Math.floor(t * 255));
      g.fillStyle(c.color, 1);
      g.fillRect(0, y, W, 1);
    }
    g.generateTexture('mapsel_bg', W, H);
    g.destroy();
    this.add.image(W / 2, H / 2, 'mapsel_bg').setOrigin(0.5);

    this.add.text(W / 2, 34, 'Escolha a Região', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '34px',
      color: '#e8ecf5',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Totais
    let totalStars = 0, totalScore = 0;
    for (let i = 0; i < 10; i++) {
      totalStars += Save.data.stars[i] || 0;
      totalScore += Save.data.best[i] || 0;
    }
    this.add.text(W / 2, 66, 'Estrelas: ' + totalStars + ' / 30      Pontuação total: ' + totalScore, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '18px',
      color: '#ffd54f'
    }).setOrigin(0.5);

    // Botão Voltar no canto superior esquerdo
    makeButton(this, 80, 34, 120, 36, 'Voltar', () => this.scene.start('Menu'), { fontSize: 16 });

    // Grade 5x2 de cartões
    const cardW = 200, cardH = 250;
    const rowYs = [225, 490];
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const cx = 160 + col * 220;
      const cy = rowYs[row];
      this.createCard(i, cx, cy, cardW, cardH);
    }
  }

  createCard(i, cx, cy, w, h) {
    const m = MAPS[i];
    const theme = THEMES[m.theme];
    const locked = i >= Save.data.unlocked;

    const container = this.add.container(cx, cy);
    container.setDepth(10);

    const bg = this.add.rectangle(0, 0, w, h, 0x1b1f2a, 1);
    bg.setStrokeStyle(2, 0x3a4256);

    // Miniatura do mapa (180x110 centrada em y=-60)
    const miniW = 180, miniH = 110;
    const mg = this.make.graphics({ add: false });
    mg.fillStyle(theme.ground, 1);
    mg.fillRect(0, 0, miniW, miniH);
    const sx = miniW / COLS, sy = miniH / ROWS;
    mg.lineStyle(5, theme.path, 1);
    for (let p = 0; p < m.path.length - 1; p++) {
      const a = m.path[p], b = m.path[p + 1];
      const ax = (a[0] + 0.5) * sx;
      const ay = (a[1] + 0.5) * sy;
      const bx = (b[0] + 0.5) * sx;
      const by = (b[1] + 0.5) * sy;
      mg.lineBetween(ax, ay, bx, by);
    }
    if (this.textures.exists('mini_' + i)) this.textures.remove('mini_' + i);
    mg.generateTexture('mini_' + i, miniW, miniH);
    mg.destroy();
    const mini = this.add.image(0, -60, 'mini_' + i).setOrigin(0.5);

    // Nome
    const name = this.add.text(0, 10, m.name, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '16px',
      color: '#e8ecf5',
      align: 'center',
      wordWrap: { width: w - 20 }
    }).setOrigin(0.5);

    const mapLabel = this.add.text(0, 32, 'Mapa ' + (i + 1), {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      color: '#9aa4bd'
    }).setOrigin(0.5);

    // Estrelas
    const stars = Save.data.stars[i] || 0;
    for (let s = 0; s < 3; s++) {
      container.add(this.add.image(-30 + s * 30, 62, s < stars ? 'star' : 'star_off').setOrigin(0.5).setScale(0.8));
    }

    // Recorde
    const best = Save.data.best[i] || 0;
    const bestText = this.add.text(0, 88, 'Recorde: ' + best, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      color: '#ffd54f'
    }).setOrigin(0.5);

    // Nova torre
    const newTower = TOWERS.find(t => t.unlock === i);
    const newTowerText = this.add.text(0, 108, newTower ? 'Nova torre: ' + newTower.name : '', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      color: '#4fc3f7'
    }).setOrigin(0.5);

    container.add([bg, mini, name, mapLabel, bestText, newTowerText]);
    container.sendToBack(bg);

    if (locked) {
      // Escurecido + cadeado
      const dark = this.add.rectangle(0, 0, w, h, 0x000000, 0.6);
      container.add(dark);
      // cadeado desenhado
      if (!this.textures.exists('lock')) {
        const lock = this.make.graphics({ add: false });
        lock.fillStyle(0x888888, 1);
        lock.fillRect(16, 26, 28, 22);
        lock.lineStyle(4, 0x888888, 1);
        lock.strokeCircle(30, 20, 10);
        lock.generateTexture('lock', 60, 60);
        lock.destroy();
      }
      const lockImg = this.add.image(0, -10, 'lock').setOrigin(0.5).setScale(1.4);
      container.add(lockImg);
      container.setAlpha(0.7);
    } else {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => container.setScale(1.04));
      bg.on('pointerout', () => container.setScale(1));
      bg.on('pointerdown', () => {
        Sfx.play('click');
        this.scene.start('Game', { map: i });
      });
    }
  }
}

class HelpScene extends Phaser.Scene {
  constructor() {
    super('Help');
  }

  create() {
    const W = GAME_W, H = GAME_H;

    const g = this.make.graphics({ add: false });
    const top = Phaser.Display.Color.IntegerToColor(0x0a0d16);
    const bot = Phaser.Display.Color.IntegerToColor(0x161c2b);
    for (let y = 0; y < H; y++) {
      const t = y / H;
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 256, Math.floor(t * 255));
      g.fillStyle(c.color, 1);
      g.fillRect(0, y, W, 1);
    }
    g.generateTexture('help_bg', W, H);
    g.destroy();
    this.add.image(W / 2, H / 2, 'help_bg').setOrigin(0.5);

    this.add.text(W / 2, 30, 'Como Jogar', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '34px',
      color: '#e8ecf5',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Coluna esquerda (x=40..500)
    const leftX = 40;
    this.add.text(leftX, 80,
      'Objetivo\n' +
      'Erga torres ao longo do caminho para impedir que a Horda do Vazio\n' +
      'alcance o coração da região. Sobreviva às 10 ondas para vencer.\n' +
      'Cada região vencida desbloqueia uma nova torre.',
      {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#c3cbdd',
        align: 'left',
        wordWrap: { width: 440 }
      }).setOrigin(0, 0);

    this.add.text(leftX, 230,
      'Controles\n' +
      '1..9,0  seleciona torre      Esc  cancela\n' +
      'U  upgrade      S  vender      T  troca alvo\n' +
      'N  chamar onda      F  velocidade 1x/2x/3x\n' +
      'Espaço  pausa',
      {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#c3cbdd',
        align: 'left'
      }).setOrigin(0, 0);

    // Tiers
    this.add.text(leftX, 400, 'Níveis de dificuldade (tiers)', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '16px',
      color: '#e8ecf5'
    }).setOrigin(0, 0);
    for (let t = 0; t < 5; t++) {
      const col = TIER_COLOR[t];
      const dot = this.add.circle(leftX + 8, 430 + t * 24 + 8, 8, col);
      this.add.text(leftX + 26, 430 + t * 24, 'Tier ' + (t + 1), {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '14px',
        color: '#c3cbdd'
      }).setOrigin(0, 0.5);
    }

    // Coluna direita: torres em 2 colunas (x=540 e x=870), 5 linhas cada
    const colXs = [540, 870];
    TOWERS.forEach((t, idx) => {
      const colIdx = Math.floor(idx / 5);
      const rowIdx = idx % 5;
      const x = colXs[colIdx];
      const y = 90 + rowIdx * 105;

      // ícone base + turret (32px)
      const base = this.add.image(x + 16, y + 16, 'base_' + t.id).setScale(0.8).setOrigin(0.5);
      const turret = this.add.image(x + 16, y + 16, 'turret_' + t.id).setScale(0.8).setOrigin(0.5);
      const name = this.add.text(x + 44, y + 6, t.name, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '15px',
        color: '#e8ecf5',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      const cost = this.add.text(x + 44, y + 26, 'Custo: ' + t.cost + ' · Mapa ' + (t.unlock + 1), {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '12px',
        color: '#ffd54f'
      }).setOrigin(0, 0.5);
      const desc = this.add.text(x + 44, y + 44, t.desc, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '12px',
        color: '#9aa4bd',
        wordWrap: { width: 250 }
      }).setOrigin(0, 0.5);
    });

    makeButton(this, 80, 610, 140, 44, 'Voltar', () => this.scene.start('Menu'), { fontSize: 18 });
  }
}

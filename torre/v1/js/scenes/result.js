class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.data = data || {};
  }

  create() {
    const d = this.data;
    const map = d.map;
    const won = !!d.won;
    const stars = d.stars || 0;
    const score = d.score || 0;
    const kills = d.kills || 0;
    const goldEarned = d.goldEarned || 0;
    const goldSpent = d.goldSpent || 0;
    const lives = d.lives || 0;

    const bg = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0d1017);

    const panelW = 640;
    const panelH = 560;
    const panelX = GAME_W / 2;
    const panelY = GAME_H / 2;
    const panel = this.add.rectangle(panelX, panelY, panelW, panelH, 0x1b1f2a);
    panel.setStrokeStyle(3, 0x3a4256);

    const titleText = won ? 'VITÓRIA!' : 'DERROTA';
    const titleColor = won ? 0xffd54f : 0xef5350;
    const title = this.add.text(panelX, 110, titleText, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#' + titleColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    this.tweens.add({
      targets: title,
      scale: 1.4,
      duration: 400,
      ease: 'Back.easeOut'
    });

    const mapName = (typeof MAPS !== 'undefined' && MAPS[map]) ? MAPS[map].name : ('Mapa ' + (map + 1));
    this.add.text(panelX, 165, mapName, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '22px',
      color: '#e8ecf5'
    }).setOrigin(0.5);

    const starY = 220;
    const starSpacing = 60;
    const starStartX = panelX - starSpacing;
    for (let i = 0; i < 3; i++) {
      const key = (won && i < stars) ? 'star' : 'star_off';
      const star = this.add.image(starStartX + i * starSpacing, starY, key).setScale(0);
      if (won && i < stars) {
        this.tweens.add({
          targets: star,
          scale: 1,
          duration: 300,
          delay: 300 + i * 250,
          ease: 'Back.easeOut'
        });
      }
    }

    const stats = [
      ['Pontuação', score],
      ['Abates', kills],
      ['Vidas restantes', lives],
      ['Ouro ganho', goldEarned],
      ['Ouro gasto', goldSpent]
    ];

    let best = 0;
    if (typeof Save !== 'undefined' && Save.data && Save.data.best && Save.data.best[map] != null) {
      best = Save.data.best[map];
    }
    stats.push(['Recorde', best]);

    const statsStartY = 280;
    const statsSpacing = 32;
    stats.forEach((s, i) => {
      const y = statsStartY + i * statsSpacing;
      this.add.text(panelX - 200, y, s[0], {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#e8ecf5'
      }).setOrigin(0, 0.5);
      this.add.text(panelX + 200, y, String(s[1]), {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#ffd54f'
      }).setOrigin(1, 0.5);
    });

    let extraY = statsStartY + stats.length * statsSpacing + 10;

    if (won && map < 9 && typeof TOWERS !== 'undefined') {
      const newTower = TOWERS.find(t => t.unlock === map + 1);
      if (newTower) {
        this.add.text(panelX, extraY, 'Nova torre desbloqueada: ' + newTower.name, {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '18px',
          color: '#4fc3f7'
        }).setOrigin(0.5);
        extraY += 30;
      }
    }

    if (won && map === 9) {
      this.add.text(panelX, extraY, 'O Senhor do Vazio caiu. Aurora está salva!', {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd54f'
      }).setOrigin(0.5);
      extraY += 30;

      let total = 0;
      if (typeof Save !== 'undefined' && Save.data && Save.data.best) {
        for (let i = 0; i < 10; i++) {
          if (Save.data.best[i] != null) total += Save.data.best[i];
        }
      }
      this.add.text(panelX, extraY, 'Pontuação total da campanha: ' + total, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '18px',
        color: '#e8ecf5'
      }).setOrigin(0.5);
      extraY += 30;
    }

    const btnY = GAME_H - 70;
    const btnW = 140;
    const btnH = 44;

    makeButton(this, panelX - 180, btnY, btnW, btnH, 'Repetir', () => {
      this.scene.start('Game', { map: map });
    });

    if (won && map < 9) {
      makeButton(this, panelX, btnY, btnW, btnH, 'Próximo', () => {
        this.scene.start('Game', { map: map + 1 });
      });
    }

    makeButton(this, panelX + 180, btnY, btnW, btnH, 'Mapas', () => {
      this.scene.start('MapSelect');
    });

    if (won) {
      this.confetti();
    }
  }

  confetti() {
    const colors = [0xff5252, 0xffd54f, 0x4fc3f7, 0x69f0ae, 0xba68c8, 0xff9800];
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_W);
      const y = Phaser.Math.Between(-200, -10);
      const tint = colors[Phaser.Math.Between(0, colors.length - 1)];
      const p = this.add.image(x, y, 'particle').setTint(tint).setScale(Phaser.Math.FloatBetween(0.6, 1.4));
      this.tweens.add({
        targets: p,
        y: GAME_H + 20,
        x: x + Phaser.Math.Between(-80, 80),
        rotation: Phaser.Math.Between(0, 720),
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 1500),
        ease: 'Quad.easeIn',
        onComplete: () => p.destroy()
      });
    }
  }
}

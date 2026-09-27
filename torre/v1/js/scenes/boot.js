// js/scenes/boot.js — TORRE v1 (script clássico, sem import/export)

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this._genTowerTextures();
    this._genEnemyTextures();
    this._genMiscTextures();
    this.scene.start('Menu');
  }

  // ---------- helpers ----------

  _hexToRgb(hex) {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return { r, g, b };
  }

  _shade(hex, factor) {
    const { r, g, b } = this._hexToRgb(hex);
    const nr = Math.max(0, Math.min(255, Math.round(r * factor)));
    const ng = Math.max(0, Math.min(255, Math.round(g * factor)));
    const nb = Math.max(0, Math.min(255, Math.round(b * factor)));
    return (nr << 16) | (ng << 8) | nb;
  }

  _lighten(hex, factor) {
    const { r, g, b } = this._hexToRgb(hex);
    const nr = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor)));
    const ng = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor)));
    const nb = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor)));
    return (nr << 16) | (ng << 8) | nb;
  }

  _makeGfx(w, h) {
    return this.make.graphics({ x: 0, y: 0, add: false, width: w, height: h });
  }

  _finish(gfx, key, w, h) {
    gfx.generateTexture(key, w, h);
    gfx.destroy();
  }

  // ---------- torres ----------

  _genTowerTextures() {
    for (let i = 0; i < TOWERS.length; i++) {
      const t = TOWERS[i];
      this._genTowerBase(t);
      this._genTowerTurret(t);
      this._genTowerProj(t);
    }
  }

  _genTowerBase(t) {
    const key = 'base_' + t.id;
    const g = this._makeGfx(40, 40);
    const cx = 20, cy = 20;

    // sombra
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + 4, 34, 28);

    // base octogonal
    const r = 17;
    const pts = [];
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2 - Math.PI / 8;
      pts.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
    }
    g.fillStyle(this._shade(t.color, 0.45), 1);
    g.fillPoints(pts, true);
    g.lineStyle(2, this._shade(t.color, 0.3), 1);
    g.strokePoints(pts, true);

    // topo
    const r2 = 13;
    const pts2 = [];
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2 - Math.PI / 8;
      pts2.push({ x: cx + Math.cos(ang) * r2, y: cy + Math.sin(ang) * r2 });
    }
    g.fillStyle(this._shade(t.color, 0.7), 1);
    g.fillPoints(pts2, true);
    g.lineStyle(1, this._shade(t.color, 0.5), 1);
    g.strokePoints(pts2, true);

    // brilho
    g.fillStyle(this._lighten(t.color, 0.3), 0.4);
    g.fillCircle(cx - 4, cy - 4, 5);

    // cor da torre no centro
    g.fillStyle(t.color, 1);
    g.fillCircle(cx, cy, 6);
    g.fillStyle(this._lighten(t.color, 0.4), 0.6);
    g.fillCircle(cx - 2, cy - 2, 3);

    this._finish(g, key, 40, 40);
  }

  _genTowerTurret(t) {
    const key = 'turret_' + t.id;
    const g = this._makeGfx(40, 40);
    const cx = 20, cy = 20;
    const c = t.color;
    const dark = this._shade(c, 0.4);
    const light = this._lighten(c, 0.35);

    switch (t.id) {
      case 'arrow': {
        // besta: arco + corda + flecha
        g.lineStyle(3, dark, 1);
        g.beginPath();
        g.arc(cx, cy, 12, -Math.PI * 0.4, Math.PI * 0.4);
        g.strokePath();
        g.lineStyle(1, 0xffffff, 0.8);
        g.beginPath();
        g.moveTo(cx + Math.cos(-Math.PI * 0.4) * 12, cy + Math.sin(-Math.PI * 0.4) * 12);
        g.lineTo(cx + Math.cos(Math.PI * 0.4) * 12, cy + Math.sin(Math.PI * 0.4) * 12);
        g.strokePath();
        // flecha
        g.fillStyle(c, 1);
        g.fillRect(cx - 2, cy - 1, 18, 2);
        g.fillStyle(light, 1);
        g.fillTriangle(cx + 16, cy - 4, cx + 16, cy + 4, cx + 22, cy);
        break;
      }
      case 'cannon': {
        // cano grosso
        g.fillStyle(dark, 1);
        g.fillRoundedRect(cx - 4, cy - 6, 24, 12, 3);
        g.fillStyle(c, 1);
        g.fillRoundedRect(cx - 2, cy - 4, 20, 8, 2);
        g.fillStyle(light, 0.5);
        g.fillRoundedRect(cx, cy - 3, 16, 3, 1);
        // boca
        g.fillStyle(0x222222, 1);
        g.fillCircle(cx + 20, cy, 4);
        break;
      }
      case 'frost': {
        // cristal
        g.fillStyle(c, 0.9);
        g.fillTriangle(cx - 6, cy - 10, cx + 14, cy, cx - 6, cy + 10);
        g.fillStyle(light, 0.6);
        g.fillTriangle(cx - 6, cy - 10, cx + 4, cy, cx - 6, cy + 10);
        g.lineStyle(1, 0xffffff, 0.5);
        g.beginPath();
        g.moveTo(cx - 6, cy - 10);
        g.lineTo(cx + 14, cy);
        g.lineTo(cx - 6, cy + 10);
        g.closePath();
        g.strokePath();
        // brilho
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(cx + 2, cy - 3, 2);
        break;
      }
      case 'mage': {
        // orbe com runas
        g.fillStyle(dark, 1);
        g.fillCircle(cx, cy, 12);
        g.fillStyle(c, 1);
        g.fillCircle(cx, cy, 10);
        g.fillStyle(light, 0.5);
        g.fillCircle(cx - 3, cy - 3, 5);
        // runas
        g.lineStyle(1, 0xffffff, 0.6);
        g.beginPath();
        g.moveTo(cx - 5, cy - 5);
        g.lineTo(cx + 5, cy + 5);
        g.moveTo(cx + 5, cy - 5);
        g.lineTo(cx - 5, cy + 5);
        g.strokePath();
        break;
      }
      case 'tesla': {
        // bobina com esferas
        g.fillStyle(dark, 1);
        g.fillCircle(cx, cy, 10);
        g.fillStyle(c, 1);
        g.fillCircle(cx, cy, 8);
        g.fillStyle(light, 0.6);
        g.fillCircle(cx - 2, cy - 2, 4);
        // esferas laterais
        g.fillStyle(c, 0.8);
        g.fillCircle(cx - 12, cy, 4);
        g.fillCircle(cx + 12, cy, 4);
        g.fillStyle(light, 0.5);
        g.fillCircle(cx - 13, cy - 1, 2);
        g.fillCircle(cx + 11, cy - 1, 2);
        break;
      }
      case 'sniper': {
        // cano longo fino
        g.fillStyle(dark, 1);
        g.fillRect(cx - 4, cy - 2, 28, 4);
        g.fillStyle(c, 1);
        g.fillRect(cx - 2, cy - 1, 24, 2);
        g.fillStyle(light, 0.5);
        g.fillRect(cx, cy - 1, 20, 1);
        // mira
        g.fillStyle(0x222222, 1);
        g.fillCircle(cx + 24, cy, 2);
        break;
      }
      case 'poison': {
        // frasco
        g.fillStyle(dark, 1);
        g.fillRoundedRect(cx - 6, cy - 8, 12, 16, 3);
        g.fillStyle(c, 0.8);
        g.fillRoundedRect(cx - 4, cy - 6, 8, 12, 2);
        g.fillStyle(light, 0.5);
        g.fillRoundedRect(cx - 3, cy - 5, 4, 8, 1);
        // tampa
        g.fillStyle(0x333333, 1);
        g.fillRect(cx - 3, cy - 10, 6, 3);
        break;
      }
      case 'flame': {
        // bocal largo
        g.fillStyle(dark, 1);
        g.fillTriangle(cx - 4, cy - 8, cx + 16, cy - 4, cx + 16, cy + 4);
        g.fillTriangle(cx - 4, cy + 8, cx + 16, cy + 4, cx + 16, cy - 4);
        g.fillStyle(c, 1);
        g.fillTriangle(cx - 2, cy - 6, cx + 14, cy - 3, cx + 14, cy + 3);
        g.fillTriangle(cx - 2, cy + 6, cx + 14, cy + 3, cx + 14, cy - 3);
        g.fillStyle(light, 0.5);
        g.fillTriangle(cx, cy - 4, cx + 12, cy - 2, cx + 12, cy + 2);
        break;
      }
      case 'mortar': {
        // tubo curto largo
        g.fillStyle(dark, 1);
        g.fillRoundedRect(cx - 6, cy - 8, 20, 16, 4);
        g.fillStyle(c, 1);
        g.fillRoundedRect(cx - 4, cy - 6, 16, 12, 3);
        g.fillStyle(light, 0.4);
        g.fillRoundedRect(cx - 2, cy - 4, 12, 4, 2);
        // boca
        g.fillStyle(0x222222, 1);
        g.fillCircle(cx + 14, cy, 5);
        break;
      }
      case 'harpoon': {
        // lança com ponta
        g.fillStyle(dark, 1);
        g.fillRect(cx - 4, cy - 2, 24, 4);
        g.fillStyle(c, 1);
        g.fillRect(cx - 2, cy - 1, 20, 2);
        // ponta
        g.fillStyle(light, 1);
        g.fillTriangle(cx + 20, cy - 5, cx + 20, cy + 5, cx + 28, cy);
        g.fillStyle(0xffffff, 0.6);
        g.fillTriangle(cx + 22, cy - 3, cx + 22, cy + 3, cx + 26, cy);
        break;
      }
      default: {
        g.fillStyle(c, 1);
        g.fillCircle(cx, cy, 10);
      }
    }

    this._finish(g, key, 40, 40);
  }

  _genTowerProj(t) {
    const key = 'proj_' + t.id;
    const g = this._makeGfx(14, 14);
    const cx = 7, cy = 7;
    const c = t.color;
    const light = this._lighten(c, 0.4);

    switch (t.id) {
      case 'arrow': {
        g.fillStyle(c, 1);
        g.fillRect(cx - 5, cy - 1, 8, 2);
        g.fillStyle(light, 1);
        g.fillTriangle(cx + 3, cy - 3, cx + 3, cy + 3, cx + 7, cy);
        break;
      }
      case 'cannon': {
        g.fillStyle(0x333333, 1);
        g.fillCircle(cx, cy, 5);
        g.fillStyle(0x555555, 0.6);
        g.fillCircle(cx - 1, cy - 1, 2);
        break;
      }
      case 'frost': {
        g.fillStyle(c, 0.9);
        g.fillTriangle(cx - 4, cy - 4, cx + 5, cy, cx - 4, cy + 4);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(cx, cy, 2);
        break;
      }
      case 'mage': {
        g.fillStyle(c, 1);
        g.fillCircle(cx, cy, 5);
        g.fillStyle(light, 0.6);
        g.fillCircle(cx - 1, cy - 1, 2);
        break;
      }
      case 'tesla': {
        g.fillStyle(c, 1);
        g.fillCircle(cx, cy, 4);
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(cx, cy, 2);
        break;
      }
      case 'sniper': {
        g.fillStyle(0x222222, 1);
        g.fillRect(cx - 6, cy - 1, 10, 2);
        g.fillStyle(c, 1);
        g.fillTriangle(cx + 4, cy - 2, cx + 4, cy + 2, cx + 7, cy);
        break;
      }
      case 'poison': {
        g.fillStyle(c, 0.9);
        g.fillCircle(cx, cy, 4);
        g.fillStyle(light, 0.5);
        g.fillCircle(cx - 1, cy - 1, 2);
        break;
      }
      case 'flame': {
        g.fillStyle(c, 1);
        g.fillTriangle(cx - 4, cy - 4, cx + 5, cy, cx - 4, cy + 4);
        g.fillStyle(0xffcc00, 0.6);
        g.fillTriangle(cx - 2, cy - 2, cx + 3, cy, cx - 2, cy + 2);
        break;
      }
      case 'mortar': {
        g.fillStyle(0x444444, 1);
        g.fillCircle(cx, cy, 5);
        g.fillStyle(0x666666, 0.6);
        g.fillCircle(cx - 1, cy - 1, 2);
        break;
      }
      case 'harpoon': {
        g.fillStyle(c, 1);
        g.fillRect(cx - 5, cy - 1, 8, 2);
        g.fillStyle(light, 1);
        g.fillTriangle(cx + 3, cy - 3, cx + 3, cy + 3, cx + 7, cy);
        break;
      }
      default: {
        g.fillStyle(c, 1);
        g.fillCircle(cx, cy, 4);
      }
    }

    this._finish(g, key, 14, 14);
  }

  // ---------- inimigos ----------

  _genEnemyTextures() {
    for (let i = 0; i < ENEMIES.length; i++) {
      const e = ENEMIES[i];
      this._genEnemy(e);
    }
  }

  _genEnemy(e) {
    const key = 'enemy_' + e.id;
    const size = e.size;
    const w = size * 2 + 6;
    const h = size * 2 + 6;
    const g = this._makeGfx(w, h);
    const cx = w / 2, cy = h / 2;
    const c = e.color;
    const dark = this._shade(c, 0.4);
    const light = this._lighten(c, 0.3);

    // sombra
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, cy + size * 0.6, size * 1.6, size * 0.8);

    // forma
    switch (e.shape) {
      case 'circle': {
        g.fillStyle(c, 1);
        g.fillCircle(cx, cy, size);
        g.lineStyle(2, dark, 1);
        g.strokeCircle(cx, cy, size);
        g.fillStyle(light, 0.4);
        g.fillCircle(cx - size * 0.3, cy - size * 0.3, size * 0.4);
        break;
      }
      case 'square': {
        g.fillStyle(c, 1);
        g.fillRoundedRect(cx - size, cy - size, size * 2, size * 2, 3);
        g.lineStyle(2, dark, 1);
        g.strokeRoundedRect(cx - size, cy - size, size * 2, size * 2, 3);
        g.fillStyle(light, 0.3);
        g.fillRoundedRect(cx - size * 0.7, cy - size * 0.7, size * 1.4, size * 0.6, 2);
        break;
      }
      case 'triangle': {
        const pts = [
          { x: cx, y: cy - size },
          { x: cx - size, y: cy + size * 0.8 },
          { x: cx + size, y: cy + size * 0.8 }
        ];
        g.fillStyle(c, 1);
        g.fillPoints(pts, true);
        g.lineStyle(2, dark, 1);
        g.strokePoints(pts, true);
        g.fillStyle(light, 0.3);
        g.fillTriangle(cx, cy - size * 0.6, cx - size * 0.4, cy + size * 0.4, cx + size * 0.4, cy + size * 0.4);
        break;
      }
      case 'diamond': {
        const pts = [
          { x: cx, y: cy - size },
          { x: cx + size, y: cy },
          { x: cx, y: cy + size },
          { x: cx - size, y: cy }
        ];
        g.fillStyle(c, 1);
        g.fillPoints(pts, true);
        g.lineStyle(2, dark, 1);
        g.strokePoints(pts, true);
        g.fillStyle(light, 0.3);
        g.fillTriangle(cx, cy - size * 0.6, cx - size * 0.4, cy, cx + size * 0.4, cy);
        break;
      }
      case 'hex': {
        const pts = [];
        for (let a = 0; a < 6; a++) {
          const ang = (a / 6) * Math.PI * 2 - Math.PI / 2;
          pts.push({ x: cx + Math.cos(ang) * size, y: cy + Math.sin(ang) * size });
        }
        g.fillStyle(c, 1);
        g.fillPoints(pts, true);
        g.lineStyle(2, dark, 1);
        g.strokePoints(pts, true);
        g.fillStyle(light, 0.3);
        g.fillCircle(cx, cy - size * 0.3, size * 0.4);
        break;
      }
      case 'star': {
        const pts = [];
        for (let a = 0; a < 10; a++) {
          const ang = (a / 10) * Math.PI * 2 - Math.PI / 2;
          const r = a % 2 === 0 ? size : size * 0.5;
          pts.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
        }
        g.fillStyle(c, 1);
        g.fillPoints(pts, true);
        g.lineStyle(2, dark, 1);
        g.strokePoints(pts, true);
        g.fillStyle(light, 0.3);
        g.fillCircle(cx, cy - size * 0.2, size * 0.3);
        break;
      }
      default: {
        g.fillStyle(c, 1);
        g.fillCircle(cx, cy, size);
      }
    }

    // olhos
    const eyeR = Math.max(2, size * 0.2);
    const eyeY = cy - size * 0.15;
    const eyeSpacing = Math.max(3, size * 0.4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - eyeSpacing, eyeY, eyeR);
    g.fillCircle(cx + eyeSpacing, eyeY, eyeR);
    g.fillStyle(0x111111, 1);
    g.fillCircle(cx - eyeSpacing, eyeY, eyeR * 0.5);
    g.fillCircle(cx + eyeSpacing, eyeY, eyeR * 0.5);

    // asas para voadores
    if (e.fly) {
      g.fillStyle(0xffffff, 0.5);
      g.fillTriangle(cx - size, cy - size * 0.3, cx - size * 1.6, cy - size * 0.8, cx - size * 1.2, cy + size * 0.2);
      g.fillTriangle(cx + size, cy - size * 0.3, cx + size * 1.6, cy - size * 0.8, cx + size * 1.2, cy + size * 0.2);
      g.lineStyle(1, 0xffffff, 0.4);
      g.beginPath();
      g.moveTo(cx - size, cy - size * 0.3);
      g.lineTo(cx - size * 1.6, cy - size * 0.8);
      g.lineTo(cx - size * 1.2, cy + size * 0.2);
      g.closePath();
      g.strokePath();
      g.beginPath();
      g.moveTo(cx + size, cy - size * 0.3);
      g.lineTo(cx + size * 1.6, cy - size * 0.8);
      g.lineTo(cx + size * 1.2, cy + size * 0.2);
      g.closePath();
      g.strokePath();
    }

    // coroa/chifres para boss
    if (e.boss) {
      g.fillStyle(0xffd700, 1);
      g.fillTriangle(cx - size * 0.6, cy - size, cx - size * 0.3, cy - size * 1.4, cx, cy - size);
      g.fillTriangle(cx, cy - size, cx + size * 0.3, cy - size * 1.4, cx + size * 0.6, cy - size);
      g.fillStyle(0xffa500, 0.6);
      g.fillTriangle(cx - size * 0.5, cy - size * 0.9, cx - size * 0.25, cy - size * 1.2, cx, cy - size * 0.9);
      g.fillTriangle(cx, cy - size * 0.9, cx + size * 0.25, cy - size * 1.2, cx + size * 0.5, cy - size * 0.9);
    }

    this._finish(g, key, w, h);
  }

  // ---------- misc ----------

  _genMiscTextures() {
    this._genParticle();
    this._genStar(true);
    this._genStar(false);
    this._genCoin();
    this._genHeart();
  }

  _genParticle() {
    const key = 'particle';
    const g = this._makeGfx(8, 8);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(4, 4, 2);
    this._finish(g, key, 8, 8);
  }

  _genStar(filled) {
    const key = filled ? 'star' : 'star_off';
    const g = this._makeGfx(24, 24);
    const cx = 12, cy = 12;
    const pts = [];
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2 - Math.PI / 2;
      const r = a % 2 === 0 ? 10 : 5;
      pts.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
    }
    if (filled) {
      g.fillStyle(0xffd700, 1);
      g.fillPoints(pts, true);
      g.lineStyle(1, 0xffa500, 1);
      g.strokePoints(pts, true);
      g.fillStyle(0xffff00, 0.5);
      g.fillCircle(cx, cy - 2, 3);
    } else {
      g.fillStyle(0x666666, 1);
      g.fillPoints(pts, true);
      g.lineStyle(1, 0x444444, 1);
      g.strokePoints(pts, true);
    }
    this._finish(g, key, 24, 24);
  }

  _genCoin() {
    const key = 'coin';
    const g = this._makeGfx(16, 16);
    const cx = 8, cy = 8;
    g.fillStyle(0xffd700, 1);
    g.fillCircle(cx, cy, 7);
    g.lineStyle(1, 0xffa500, 1);
    g.strokeCircle(cx, cy, 7);
    g.fillStyle(0xffff00, 0.6);
    g.fillCircle(cx - 2, cy - 2, 3);
    g.fillStyle(0xffa500, 0.8);
    g.fillCircle(cx + 1, cy + 1, 2);
    this._finish(g, key, 16, 16);
  }

  _genHeart() {
    const key = 'heart';
    const g = this._makeGfx(16, 16);
    const cx = 8, cy = 8;
    g.fillStyle(0xef5350, 1);
    g.fillCircle(cx - 3, cy - 2, 4);
    g.fillCircle(cx + 3, cy - 2, 4);
    g.fillTriangle(cx - 6, cy, cx + 6, cy, cx, cy + 6);
    g.fillStyle(0xff8a80, 0.5);
    g.fillCircle(cx - 3, cy - 3, 2);
    this._finish(g, key, 16, 16);
  }
}

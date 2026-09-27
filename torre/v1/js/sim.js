// js/sim.js — TORRE v1 (script clássico, sem import/export)
// Depende das constantes globais de js/data.js (TOWERS, ENEMIES, MAPS, THEMES, TILE, COLS, ROWS,
// SIM_DT, WAVE_INTERVAL, WAVES_PER_MAP, START_LIVES, SELL_RATIO, LVL_DMG, LVL_UPG,
// TIER_HP, TIER_REW, TIER_ARMOR, TIER_SPEED, TIER_COLOR)

// ---------- helpers ----------
function _towerById(id) {
  for (let i = 0; i < TOWERS.length; i++) if (TOWERS[i].id === id) return TOWERS[i];
  return null;
}
function _enemyById(id) {
  for (let i = 0; i < ENEMIES.length; i++) if (ENEMIES[i].id === id) return ENEMIES[i];
  return null;
}
function _clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

// ---------- buildWaves ----------
function buildWaves(mapIndex) {
  // pool ordenado do mais fraco ao mais forte; ondas iniciais só usam a parte fraca
  const pool = ENEMIES.filter(function (e) { return e.map <= mapIndex && e.map < 99 && !e.boss; })
    .sort(function (a, b) { return a.hp * a.lives - b.hp * b.lives; });
  const fresh = pool.filter(function (e) { return e.map === mapIndex; });
  const tierBase = MAPS[mapIndex].tierBase;
  const waves = [];
  for (let w = 0; w < WAVES_PER_MAP; w++) {
    const count = 10 + 2 * w + mapIndex;
    const tier = Math.min(5, tierBase + (w >= 6 ? 1 : 0));
    const hpMul = 1 + 0.12 * w;
    const interval = 35 / count;
    const allowed = pool.slice(0, Math.max(3, Math.ceil(pool.length * (0.3 + 0.7 * w / 9))));
    const spawns = [];
    for (let k = 0; k < count; k++) {
      let def = allowed[(w * 7 + k * 3 + mapIndex) % allowed.length];
      if (w >= 2 && k % 6 === 0 && fresh.length) def = fresh[(k / 6) % fresh.length]; // tipos novos do mapa a partir da onda 3
      spawns.push({ t: k * interval, id: def.id, tier: tier, hpMul: hpMul, elite: false, waveNo: w, swarm: def.id === 'swarm' });
    }
    // Onda 9 (última): adiciona chefe
    if (w === WAVES_PER_MAP - 1) {
      let bossDef, bossTier, bossHpMul, bossElite;
      if (mapIndex === 8) { bossDef = _enemyById('titan'); bossTier = tier; bossHpMul = hpMul; bossElite = false; }
      else if (mapIndex === 9) { bossDef = _enemyById('voidlord'); bossTier = tier; bossHpMul = hpMul; bossElite = false; }
      else {
        let best = pool[0];
        for (let i = 1; i < pool.length; i++) if (pool[i].hp > best.hp) best = pool[i];
        bossDef = best; bossTier = Math.min(5, tier + 1); bossHpMul = hpMul; bossElite = true;
      }
      spawns.push({ t: 35, id: bossDef.id, tier: bossTier, hpMul: bossHpMul, elite: bossElite, waveNo: w, swarm: false });
    }
    waves.push(spawns);
  }
  return waves;
}

// ---------- Sim ----------
class Sim {
  constructor(mapIndex) {
    this.mapIndex = mapIndex;
    const def = MAPS[mapIndex];
    this.map = def;
    this.theme = THEMES[def.theme];
    this.startGold = def.startGold;
    this.tierBase = def.tierBase;

    // path em pixels
    const raw = def.path;
    const pathPts = [];
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i][0], r = raw[i][1];
      pathPts.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
    }
    // deslocar 1 tile para fora na entrada e na saída
    const first = raw[0], second = raw[1];
    const last = raw[raw.length - 1], prev = raw[raw.length - 2];
    pathPts[0].x -= Math.sign(second[0] - first[0]) * TILE; pathPts[0].y -= Math.sign(second[1] - first[1]) * TILE;
    const end = pathPts[pathPts.length - 1];
    end.x += Math.sign(last[0] - prev[0]) * TILE; end.y += Math.sign(last[1] - prev[1]) * TILE;
    this.pathPts = pathPts;

    // pathLen
    let pathLen = 0;
    for (let i = 1; i < pathPts.length; i++) {
      pathLen += Math.abs(pathPts[i].x - pathPts[i - 1].x) + Math.abs(pathPts[i].y - pathPts[i - 1].y);
    }
    this.pathLen = pathLen;

    // pathCells
    const pathCells = new Set();
    for (let i = 1; i < raw.length; i++) {
      const a = raw[i - 1], b = raw[i];
      if (a[0] === b[0]) {
        const c = a[0];
        const r0 = Math.min(a[1], b[1]), r1 = Math.max(a[1], b[1]);
        for (let r = r0; r <= r1; r++) pathCells.add(c + ',' + r);
      } else {
        const r = a[1];
        const c0 = Math.min(a[0], b[0]), c1 = Math.max(a[0], b[0]);
        for (let c = c0; c <= c1; c++) pathCells.add(c + ',' + r);
      }
    }
    this.pathCells = pathCells;

    // estado
    this.gold = this.startGold;
    this.lives = START_LIVES;
    this.score = 0;
    this.waveIndex = -1;
    this.waveTimer = 30; // primeira onda: 30s de preparação
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.time = 0;
    this.state = 'playing';
    this.kills = 0;
    this.goldEarned = 0;
    this.goldSpent = 0;

    // contadores
    this._uid = 0;
    this._towerId = 0;
    this._projId = 0;

    // ondas
    this.waves = buildWaves(mapIndex);
    this.queue = [];
    this.waveRemaining = {}; // waveNo -> {pending, alive}
    this.waveBonusGiven = {}; // waveNo -> bool
  }

  // ---------- API pública ----------
  canBuild(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    if (this.pathCells.has(col + ',' + row)) return false;
    for (let i = 0; i < this.towers.length; i++) {
      if (this.towers[i].col === col && this.towers[i].row === row) return false;
    }
    return true;
  }

  build(typeId, col, row) {
    const def = _towerById(typeId);
    if (!def) return null;
    if (def.unlock > this.mapIndex) return null;
    if (!this.canBuild(col, row)) return null;
    if (this.gold < def.cost) return null;
    this.gold -= def.cost;
    this.goldSpent += def.cost;
    const tower = {
      id: ++this._towerId,
      type: def,
      col: col,
      row: row,
      x: col * TILE + TILE / 2,
      y: row * TILE + TILE / 2,
      level: 0,
      cooldown: 0,
      angle: 0,
      target: typeId === 'sniper' ? 'strong' : 'first',
      spent: def.cost,
      kills: 0
    };
    this.towers.push(tower);
    this.effects.push({ type: 'build', x: tower.x, y: tower.y });
    return tower;
  }

  upgradeCost(tower) {
    if (tower.level >= 4) return null;
    return Math.round(tower.type.cost * LVL_UPG[tower.level + 1]);
  }

  upgrade(tower) {
    const cost = this.upgradeCost(tower);
    if (cost === null) return false;
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.goldSpent += cost;
    tower.level++;
    tower.spent += cost;
    this.effects.push({ type: 'upgrade', x: tower.x, y: tower.y });
    return true;
  }

  sellValue(tower) {
    return Math.floor(tower.spent * SELL_RATIO);
  }

  sell(tower) {
    const val = this.sellValue(tower);
    this.gold += val;
    const idx = this.towers.indexOf(tower);
    if (idx >= 0) this.towers.splice(idx, 1);
    this.effects.push({ type: 'sell', x: tower.x, y: tower.y });
  }

  towerStats(tower) {
    const def = tower.type;
    const lvl = tower.level;
    const dmg = def.dmg * LVL_DMG[lvl];
    const range = def.range * (1 + 0.07 * lvl);
    const rate = def.rate * (1 + 0.08 * lvl);
    const splash = def.splash;
    const slow = def.slow ? def.slow + 0.06 * lvl : 0;
    const dot = def.dot ? def.dot * LVL_DMG[lvl] : 0;
    const chain = def.chain ? def.chain + lvl : 0;
    return { dmg: dmg, range: range, rate: rate, splash: splash, slow: slow, dot: dot, chain: chain };
  }

  callWave() {
    if (this.state !== 'playing') return;
    if (this.waveIndex >= WAVES_PER_MAP - 1) return;
    const bonus = Math.floor(this.waveTimer);
    this.gold += bonus;
    this.goldEarned += bonus;
    this.score += bonus * 5;
    this.waveTimer = 0;
  }

  cycleTarget(tower) {
    const order = ['first', 'last', 'strong', 'close'];
    const idx = order.indexOf(tower.target);
    tower.target = order[(idx + 1) % order.length];
  }

  unlockedTowers() {
    return TOWERS.filter(function (t) { return t.unlock <= this.mapIndex; }.bind(this));
  }

  stars() {
    if (this.lives >= 18) return 3;
    if (this.lives >= 10) return 2;
    return 1;
  }

  // ---------- internos ----------
  posAt(dist) {
    const pts = this.pathPts;
    if (dist <= 0) return { x: pts[0].x, y: pts[0].y };
    if (dist >= this.pathLen) {
      const last = pts[pts.length - 1];
      return { x: last.x, y: last.y };
    }
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
      if (acc + seg >= dist) {
        const t = (dist - acc) / seg;
        return {
          x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
          y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t
        };
      }
      acc += seg;
    }
    const last = pts[pts.length - 1];
    return { x: last.x, y: last.y };
  }

  spawnEnemy(id, tier, hpMul, dist, elite, waveNo) {
    const def = _enemyById(id);
    if (!def) return null;
    const hp = def.hp * TIER_HP[tier - 1] * hpMul * (elite ? 6 : 1);
    const armor = def.armor + TIER_ARMOR[tier - 1];
    const speed = def.speed * TIER_SPEED[tier - 1];
    const reward = Math.round(def.reward * TIER_REW[tier - 1]) * (elite ? 5 : 1);
    const lives = elite ? 5 : def.lives;
    const shield = hp * (def.shield || 0);
    const size = def.size * (elite ? 1.5 : 1);
    const pos = this.posAt(dist);
    const e = {
      uid: ++this._uid,
      type: def,
      tier: tier,
      hp: hp,
      maxHp: hp,
      shield: shield,
      armor: armor,
      mres: def.mres,
      speed: speed,
      dist: dist,
      x: pos.x,
      y: pos.y,
      slowT: 0,
      slowF: 0,
      dotT: 0,
      dotDps: 0,
      enraged: false,
      spawnT: 0,
      fly: def.fly,
      lives: lives,
      reward: reward,
      elite: elite,
      dead: false,
      size: size,
      waveNo: waveNo
    };
    this.enemies.push(e);
    if (this.waveRemaining[waveNo]) this.waveRemaining[waveNo].alive++;
    return e;
  }

  startWave(w) {
    this.waveIndex = w;
    const spawns = this.waves[w];
    for (let i = 0; i < spawns.length; i++) {
      const s = spawns[i];
      if (s.swarm) {
        for (let j = 0; j < 4; j++) {
          this.queue.push({ t: this.time + s.t + j * 0.25, id: s.id, tier: s.tier, hpMul: s.hpMul, elite: s.elite, waveNo: s.waveNo });
        }
      } else {
        this.queue.push({ t: this.time + s.t, id: s.id, tier: s.tier, hpMul: s.hpMul, elite: s.elite, waveNo: s.waveNo });
      }
    }
    this.waveRemaining[w] = { pending: spawns.length, alive: 0 };
    this.waveBonusGiven[w] = false;
    this.effects.push({ type: 'wave', n: w + 1 });
  }

  findTarget(tower, stats) {
    const range = stats.range;
    const range2 = range * range;
    let best = null;
    let bestVal = null;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      if (e.fly && !tower.type.air) continue;
      if (!e.fly && !tower.type.ground) continue;
      const dx = e.x - tower.x, dy = e.y - tower.y;
      if (dx * dx + dy * dy > range2) continue;
      let val;
      if (tower.target === 'first') val = e.dist;
      else if (tower.target === 'last') val = -e.dist;
      else if (tower.target === 'strong') val = e.hp;
      else val = -Math.sqrt(dx * dx + dy * dy);
      if (bestVal === null || val > bestVal) { best = e; bestVal = val; }
    }
    return best;
  }

  damage(enemy, amount, dmgType, opts) {
    if (!opts) opts = {};
    if (enemy.dead) return 0;
    if (this._shooterId) enemy.lastHit = this._shooterId;
    let dmg = amount;
    if (dmgType === 'phys') {
      let armor = enemy.armor;
      if (opts.halfArmor) armor = armor / 2;
      dmg = Math.max(dmg * 0.2, dmg - armor);
    } else {
      dmg = dmg * (1 - enemy.mres);
    }
    if (opts.vsAirMul && enemy.fly) dmg *= opts.vsAirMul;
    if (dmg <= 0) return 0;
    if (enemy.shield > 0) {
      const absorbed = Math.min(enemy.shield, dmg);
      enemy.shield -= absorbed;
      dmg -= absorbed;
    }
    if (dmg > 0) enemy.hp -= dmg;
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      this.killEnemy(enemy);
    }
    return amount;
  }

  killEnemy(enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    this.gold += enemy.reward;
    this.goldEarned += enemy.reward;
    this.score += enemy.reward * 10;
    this.kills++;
    const killer = this.towers.find(t => t.id === enemy.lastHit);
    if (killer) killer.kills++;
    this.effects.push({ type: 'death', x: enemy.x, y: enemy.y, color: enemy.type.color, reward: enemy.reward });
    if (this.waveRemaining[enemy.waveNo]) this.waveRemaining[enemy.waveNo].alive--;
    // split
    if (enemy.type.split) {
      const childDef = _enemyById(enemy.type.split.id);
      if (childDef) {
        for (let i = 0; i < enemy.type.split.n; i++) {
          this.spawnEnemy(childDef.id, enemy.tier, 1, enemy.dist, false, enemy.waveNo);
        }
      }
    }
  }

  applyHit(target, stats, towerType, towerId) {
    const dmgType = towerType.dmgType;
    const opts = {};
    if (towerType.id === 'flame') opts.halfArmor = true;
    if (towerType.id === 'harpoon') opts.vsAirMul = 2;
    this.damage(target, stats.dmg, dmgType, opts);
    // splash
    if (stats.splash > 0) {
      const splash2 = stats.splash * stats.splash;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead || e === target) continue;
        if (e.fly && !towerType.air) continue;
        if (!e.fly && !towerType.ground) continue;
        const dx = e.x - target.x, dy = e.y - target.y;
        if (dx * dx + dy * dy <= splash2) {
          this.damage(e, stats.dmg, dmgType, opts);
        }
      }
      this.effects.push({ type: 'hit', x: target.x, y: target.y, splash: stats.splash, color: towerType.color });
    }
    // slow
    if (stats.slow > 0) {
      if (target.slowT <= 0 || stats.slow > target.slowF) {
        target.slowF = stats.slow;
        target.slowT = towerType.slowDur;
      }
      if (stats.splash > 0) {
        const splash2 = stats.splash * stats.splash;
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead || e === target) continue;
          if (e.fly && !towerType.air) continue;
          if (!e.fly && !towerType.ground) continue;
          const dx = e.x - target.x, dy = e.y - target.y;
          if (dx * dx + dy * dy <= splash2) {
            if (e.slowT <= 0 || stats.slow > e.slowF) {
              e.slowF = stats.slow;
              e.slowT = towerType.slowDur;
            }
          }
        }
      }
    }
    // dot
    if (stats.dot > 0) {
      target.dotDps = Math.max(target.dotDps, stats.dot);
      target.dotT = Math.max(target.dotT, towerType.dotDur);
      if (stats.splash > 0) {
        const splash2 = stats.splash * stats.splash;
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead || e === target) continue;
          if (e.fly && !towerType.air) continue;
          if (!e.fly && !towerType.ground) continue;
          const dx = e.x - target.x, dy = e.y - target.y;
          if (dx * dx + dy * dy <= splash2) {
            e.dotDps = Math.max(e.dotDps, stats.dot);
            e.dotT = Math.max(e.dotT, towerType.dotDur);
          }
        }
      }
    }
  }

  fireTower(tower, target, stats) {
    this._shooterId = tower.id;
    const def = tower.type;
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    if (def.projSpeed > 0) {
      const proj = {
        id: ++this._projId,
        x: tower.x,
        y: tower.y,
        tx: target.x,
        ty: target.y,
        targetUid: target.uid,
        speed: def.projSpeed,
        stats: stats,
        towerType: def,
        towerId: tower.id,
        color: def.color
      };
      this.projectiles.push(proj);
      this.effects.push({ type: 'shot', towerId: tower.id, x: tower.x, y: tower.y, tx: target.x, ty: target.y, towerType: def.id });
    } else {
      // instantâneo
      if (def.id === 'tesla') {
        const hit = [target];
        let cur = target;
        let dmg = stats.dmg;
        for (let i = 1; i < stats.chain; i++) {
          let next = null, bestD = 90 * 90;
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (e.dead) continue;
            if (hit.indexOf(e) >= 0) continue;
            if (e.fly && !def.air) continue;
            if (!e.fly && !def.ground) continue;
            const dx = e.x - cur.x, dy = e.y - cur.y;
            const d2 = dx * dx + dy * dy;
            if (d2 <= bestD) { bestD = d2; next = e; }
          }
          if (!next) break;
          dmg *= 0.85;
          this.damage(next, dmg, def.dmgType, {});
          hit.push(next);
          cur = next;
        }
        const pts = [];
        pts.push({ x: tower.x, y: tower.y });
        for (let i = 0; i < hit.length; i++) pts.push({ x: hit[i].x, y: hit[i].y });
        this.effects.push({ type: 'chain', pts: pts });
      } else {
        this.applyHit(target, stats, def, tower.id);
      }
    }
  }

  step(dt) {
    if (this.state !== 'playing') return;
    this.time += dt;

    // waveTimer
    if (this.waveIndex < WAVES_PER_MAP - 1) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.startWave(this.waveIndex + 1);
        this.waveTimer = this.waveIndex < WAVES_PER_MAP - 1 ? WAVE_INTERVAL : 0;
      }
    }

    // processar spawns da fila
    while (this.queue.length > 0 && this.queue[0].t <= this.time) {
      const s = this.queue.shift();
      this.spawnEnemy(s.id, s.tier, s.hpMul, 0, s.elite, s.waveNo);
      if (this.waveRemaining[s.waveNo]) this.waveRemaining[s.waveNo].pending--;
    }

    // movimento + efeitos de inimigos
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.dead) continue;
      // slow
      if (e.slowT > 0) e.slowT -= dt;
      // dot
      if (e.dotT > 0) {
        e.hp -= e.dotDps * dt;
        e.dotT -= dt;
        if (e.hp <= 0) { e.hp = 0; this.killEnemy(e); continue; }
      }
      // regen
      if (e.type.regen > 0) {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * e.type.regen * dt);
      }
      // enrage
      if (e.type.enrage && !e.enraged && e.hp < e.maxHp * 0.5) e.enraged = true;
      // spawn
      if (e.type.spawn) {
        e.spawnT += dt;
        if (e.spawnT >= e.type.spawn.every) {
          e.spawnT -= e.type.spawn.every;
          const childDef = _enemyById(e.type.spawn.id);
          if (childDef) this.spawnEnemy(childDef.id, e.tier, 1, e.dist, false, e.waveNo);
        }
      }
      // movimento
      let spd = e.speed;
      if (e.slowT > 0) spd *= (1 - e.slowF);
      if (e.enraged) spd *= 1.8;
      e.dist += spd * dt;
      if (e.dist >= this.pathLen) {
        this.lives -= e.lives;
        this.effects.push({ type: 'leak', x: e.x, y: e.y, id: e.type.id, lives: e.lives, wave: e.waveNo });
        e.dead = true;
        if (this.waveRemaining[e.waveNo]) this.waveRemaining[e.waveNo].alive--;
        continue;
      }
      const pos = this.posAt(e.dist);
      e.x = pos.x;
      e.y = pos.y;
    }

    // heal (aplicado após movimento)
    for (let i = 0; i < this.enemies.length; i++) {
      const healer = this.enemies[i];
      if (healer.dead || healer.type.heal <= 0) continue;
      const healAmt = healer.maxHp * healer.type.heal * dt;
      for (let j = 0; j < this.enemies.length; j++) {
        const ally = this.enemies[j];
        if (ally.dead || ally === healer) continue;
        const dx = ally.x - healer.x, dy = ally.y - healer.y;
        if (dx * dx + dy * dy <= 80 * 80) {
          ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
        }
      }
    }

    // torres
    for (let i = 0; i < this.towers.length; i++) {
      const tower = this.towers[i];
      tower.cooldown -= dt;
      if (tower.cooldown <= 0) {
        const stats = this.towerStats(tower);
        const target = this.findTarget(tower, stats);
        if (target) {
          this.fireTower(tower, target, stats);
          tower.cooldown = 1 / stats.rate;
        }
      }
    }

    // projéteis
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      let target = null;
      for (let j = 0; j < this.enemies.length; j++) {
        if (this.enemies[j].uid === p.targetUid && !this.enemies[j].dead) { target = this.enemies[j]; break; }
      }
      if (target) { p.tx = target.x; p.ty = target.y; }
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const move = p.speed * dt;
      if (dist <= move + 4) {
        // acerto
        this._shooterId = p.towerId;
        if (target) {
          this.applyHit(target, p.stats, p.towerType, p.towerId);
        } else if (p.stats.splash > 0) {
          // explode na última posição
          const splash2 = p.stats.splash * p.stats.splash;
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (e.dead) continue;
            if (e.fly && !p.towerType.air) continue;
            if (!e.fly && !p.towerType.ground) continue;
            const ex = e.x - p.tx, ey = e.y - p.ty;
            if (ex * ex + ey * ey <= splash2) {
              const opts = {};
              if (p.towerType.id === 'flame') opts.halfArmor = true;
              if (p.towerType.id === 'harpoon') opts.vsAirMul = 2;
              this.damage(e, p.stats.dmg, p.towerType.dmgType, opts);
            }
          }
          this.effects.push({ type: 'hit', x: p.tx, y: p.ty, splash: p.stats.splash, color: p.towerType.color });
        }
        this.projectiles.splice(i, 1);
        i--;
      } else {
        p.x += (dx / dist) * move;
        p.y += (dy / dist) * move;
      }
    }

    // remover mortos
    this.enemies = this.enemies.filter(function (e) { return !e.dead; });

    // verificar ondas concluídas
    for (let w = 0; w <= this.waveIndex; w++) {
      const rem = this.waveRemaining[w];
      if (rem && rem.pending === 0 && rem.alive === 0 && !this.waveBonusGiven[w]) {
        this.waveBonusGiven[w] = true;
        this.score += 100 * (this.mapIndex + 1);
        this.effects.push({ type: 'waveClear', n: w + 1 });
      }
    }

    // vitória / derrota
    if (this.lives <= 0) {
      this.state = 'lost';
      return;
    }
    if (this.waveIndex === WAVES_PER_MAP - 1) {
      let allDone = true;
      for (let w = 0; w <= this.waveIndex; w++) {
        const rem = this.waveRemaining[w];
        if (rem && (rem.pending > 0 || rem.alive > 0)) { allDone = false; break; }
      }
      if (allDone && this.enemies.length === 0 && this.queue.length === 0) {
        this.state = 'won';
        this.score += this.lives * 50;
      }
    }
  }
}

if (typeof module !== 'undefined') module.exports = { Sim, buildWaves };

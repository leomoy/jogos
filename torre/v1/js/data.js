// js/data.js — TORRE v1 (script clássico, sem import/export)

const TILE = 40;
const COLS = 24;
const ROWS = 16;
const MAP_W = 960;
const MAP_H = 640;
const PANEL_W = 240;
const GAME_W = 1200;
const GAME_H = 640;
const SIM_DT = 1 / 30;
const WAVE_INTERVAL = 60;
const WAVES_PER_MAP = 10;
const START_LIVES = 20;
const SELL_RATIO = 0.7;
const LVL_DMG = [1, 1.7, 2.6, 3.8, 5.5];
const LVL_UPG = [0, 0.7, 1.0, 1.4, 2.0];
const TIER_HP = [1, 1.6, 2.4, 3.5, 5];
const TIER_REW = [1, 1.4, 2, 2.8, 3.8];
const TIER_ARMOR = [0, 1, 3, 5, 8];
const TIER_SPEED = [1, 1.05, 1.1, 1.15, 1.2];
const TIER_COLOR = [0xffffff, 0x4caf50, 0x2196f3, 0x9c27b0, 0xff9800];

const TOWERS = [
  { id: 'arrow', name: 'Arqueiro', desc: 'Ataque físico rápido, atinge voadores.', cost: 50, dmg: 12, range: 130, rate: 1.6, dmgType: 'phys', air: true, ground: true, kind: 'single', color: 0x8bc34a, unlock: 0, splash: 0, slow: 0, slowDur: 0, dot: 0, dotDur: 0, chain: 0, projSpeed: 500 },
  { id: 'cannon', name: 'Canhão', desc: 'Dano em área no solo.', cost: 80, dmg: 30, range: 115, rate: 0.7, dmgType: 'phys', air: false, ground: true, kind: 'splash', color: 0x607d8b, unlock: 0, splash: 50, slow: 0, slowDur: 0, dot: 0, dotDur: 0, chain: 0, projSpeed: 350 },
  { id: 'frost', name: 'Geada', desc: 'Lento e dano em área.', cost: 70, dmg: 6, range: 115, rate: 1.0, dmgType: 'magic', air: true, ground: true, kind: 'slow', color: 0x4fc3f7, unlock: 1, splash: 35, slow: 0.35, slowDur: 1.5, dot: 0, dotDur: 0, chain: 0, projSpeed: 400 },
  { id: 'mage', name: 'Mago', desc: 'Dano mágico, ignora armadura.', cost: 100, dmg: 28, range: 125, rate: 0.9, dmgType: 'magic', air: true, ground: true, kind: 'single', color: 0x7e57c2, unlock: 2, splash: 0, slow: 0, slowDur: 0, dot: 0, dotDur: 0, chain: 0, projSpeed: 420 },
  { id: 'tesla', name: 'Tesla', desc: 'Encadeia para vários alvos.', cost: 130, dmg: 22, range: 105, rate: 0.8, dmgType: 'magic', air: true, ground: true, kind: 'chain', color: 0x00e5ff, unlock: 3, splash: 0, slow: 0, slowDur: 0, dot: 0, dotDur: 0, chain: 3, projSpeed: 0 },
  { id: 'sniper', name: 'Sniper', desc: 'Alcance e dano altíssimos.', cost: 150, dmg: 90, range: 260, rate: 0.35, dmgType: 'phys', air: true, ground: true, kind: 'single', color: 0x90a4ae, unlock: 4, splash: 0, slow: 0, slowDur: 0, dot: 0, dotDur: 0, chain: 0, projSpeed: 0 },
  { id: 'poison', name: 'Veneno', desc: 'Dano ao longo do tempo em área.', cost: 110, dmg: 5, range: 120, rate: 0.8, dmgType: 'magic', air: true, ground: true, kind: 'dot', color: 0x7cb342, unlock: 5, splash: 40, slow: 0, slowDur: 0, dot: 14, dotDur: 4, chain: 0, projSpeed: 380 },
  { id: 'flame', name: 'Lança-chamas', desc: 'Dano em área, ignora metade da armadura.', cost: 140, dmg: 9, range: 90, rate: 5, dmgType: 'phys', air: false, ground: true, kind: 'splash', color: 0xff7043, unlock: 6, splash: 45, slow: 0, slowDur: 0, dot: 0, dotDur: 0, chain: 0, projSpeed: 0 },
  { id: 'mortar', name: 'Morteiro', desc: 'Grande área, longo alcance.', cost: 200, dmg: 95, range: 220, rate: 0.3, dmgType: 'phys', air: false, ground: true, kind: 'splash', color: 0x8d6e63, unlock: 7, splash: 80, slow: 0, slowDur: 0, dot: 0, dotDur: 0, chain: 0, projSpeed: 250 },
  { id: 'harpoon', name: 'Arpão', desc: 'Dano x2 em voadores.', cost: 160, dmg: 70, range: 170, rate: 0.9, dmgType: 'phys', air: true, ground: false, kind: 'single', color: 0x26c6da, unlock: 8, splash: 0, slow: 0, slowDur: 0, dot: 0, dotDur: 0, chain: 0, projSpeed: 600 }
];

const ENEMIES = [
  { id: 'grunt', name: 'Recruta do Vazio', hp: 40, speed: 50, armor: 0, mres: 0, reward: 4, lives: 1, color: 0x9e9e9e, shape: 'circle', size: 10, map: 0, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'runner', name: 'Corredor', hp: 25, speed: 95, armor: 0, mres: 0, reward: 4, lives: 1, color: 0xffc107, shape: 'triangle', size: 9, map: 0, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'brute', name: 'Bruto', hp: 120, speed: 38, armor: 2, mres: 0, reward: 9, lives: 1, color: 0x8d6e63, shape: 'square', size: 13, map: 0, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'bat', name: 'Morcego', hp: 35, speed: 75, armor: 0, mres: 0, reward: 5, lives: 1, color: 0x7e57c2, shape: 'diamond', size: 9, map: 1, fly: true, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'knight', name: 'Cavaleiro', hp: 110, speed: 45, armor: 8, mres: 0, reward: 10, lives: 1, color: 0x607d8b, shape: 'hex', size: 12, map: 1, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'swarm', name: 'Enxame', hp: 12, speed: 85, armor: 0, mres: 0, reward: 1, lives: 1, color: 0x4caf50, shape: 'circle', size: 6, map: 2, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'shaman', name: 'Xamã', hp: 70, speed: 45, armor: 0, mres: 0.3, reward: 9, lives: 1, color: 0x26a69a, shape: 'star', size: 11, map: 2, fly: false, regen: 0, heal: 0.03, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'slime', name: 'Gosma', hp: 90, speed: 42, armor: 0, mres: 0, reward: 6, lives: 1, color: 0x66bb6a, shape: 'circle', size: 12, map: 3, fly: false, regen: 0, heal: 0, split: { id: 'slimelet', n: 2 }, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'slimelet', name: 'Gosminha', hp: 30, speed: 60, armor: 0, mres: 0, reward: 2, lives: 1, color: 0x9ccc65, shape: 'circle', size: 7, map: 99, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'ghost', name: 'Espectro', hp: 80, speed: 55, armor: 0, mres: 0.6, reward: 9, lives: 1, color: 0xb0bec5, shape: 'diamond', size: 10, map: 3, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'troll', name: 'Troll', hp: 260, speed: 35, armor: 3, mres: 0, reward: 16, lives: 2, color: 0x5d4037, shape: 'square', size: 14, map: 4, fly: false, regen: 0.02, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'wraith', name: 'Aparição', hp: 90, speed: 90, armor: 0, mres: 0.3, reward: 10, lives: 1, color: 0x80deea, shape: 'star', size: 10, map: 4, fly: true, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'berserker', name: 'Berserker', hp: 160, speed: 48, armor: 3, mres: 0, reward: 12, lives: 1, color: 0xe53935, shape: 'triangle', size: 12, map: 5, fly: false, regen: 0, heal: 0, split: null, enrage: true, shield: 0, spawn: null, boss: false },
  { id: 'guardian', name: 'Guardião', hp: 150, speed: 40, armor: 4, mres: 0.2, reward: 14, lives: 1, color: 0x546e7a, shape: 'hex', size: 13, map: 5, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0.5, spawn: null, boss: false },
  { id: 'golem', name: 'Golem', hp: 500, speed: 28, armor: 15, mres: 0, reward: 25, lives: 3, color: 0x78909c, shape: 'square', size: 16, map: 6, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'necro', name: 'Necromante', hp: 200, speed: 38, armor: 2, mres: 0.4, reward: 20, lives: 2, color: 0x4527a0, shape: 'star', size: 12, map: 6, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: { id: 'skeleton', every: 4 }, boss: false },
  { id: 'skeleton', name: 'Esqueleto', hp: 40, speed: 55, armor: 1, mres: 0, reward: 1, lives: 1, color: 0xeceff1, shape: 'circle', size: 8, map: 99, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'drake', name: 'Draco', hp: 400, speed: 55, armor: 6, mres: 0.2, reward: 30, lives: 3, color: 0x00897b, shape: 'diamond', size: 15, map: 7, fly: true, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: false },
  { id: 'titan', name: 'Titã', hp: 3000, speed: 26, armor: 12, mres: 0.3, reward: 150, lives: 10, color: 0x37474f, shape: 'hex', size: 22, map: 8, fly: false, regen: 0, heal: 0, split: null, enrage: false, shield: 0, spawn: null, boss: true },
  { id: 'voidlord', name: 'Senhor do Vazio', hp: 6000, speed: 24, armor: 15, mres: 0.4, reward: 400, lives: 15, color: 0x1a1a2e, shape: 'star', size: 26, map: 9, fly: false, regen: 0, heal: 0.01, split: null, enrage: false, shield: 0, spawn: { id: 'wraith', every: 6 }, boss: true }
];

const THEMES = [
  { ground: 0x8bc34a, ground2: 0x81b545, path: 0xd7ccc8, pathEdge: 0x8d6e63, deco: 0x66bb6a },
  { ground: 0x2e7d32, ground2: 0x2b742f, path: 0x8d6e63, pathEdge: 0x4e342e, deco: 0x66bb6a },
  { ground: 0xffd54f, ground2: 0xedc649, path: 0xd7ccc8, pathEdge: 0x8d6e63, deco: 0xffab40 },
  { ground: 0x558b2f, ground2: 0x4f812c, path: 0x6d4c41, pathEdge: 0x3e2723, deco: 0x9ccc65 },
  { ground: 0xeceff1, ground2: 0xdbdee0, path: 0x90a4ae, pathEdge: 0x546e7a, deco: 0xffffff },
  { ground: 0xbf360c, ground2: 0xb2320b, path: 0x6d4c41, pathEdge: 0x3e2723, deco: 0xff7043 },
  { ground: 0x80deea, ground2: 0x77ceda, path: 0xb0bec5, pathEdge: 0x607d8b, deco: 0xe0f7fa },
  { ground: 0x4e342e, ground2: 0x49302b, path: 0xff5722, pathEdge: 0xbf360c, deco: 0xff9800 },
  { ground: 0x37474f, ground2: 0x334249, path: 0x546e7a, pathEdge: 0x263238, deco: 0x78909c },
  { ground: 0x1a1a2e, ground2: 0x18182b, path: 0x4a148c, pathEdge: 0x2a0a4a, deco: 0x7c4dff }
];

const MAPS = [
  {
    id: 0, name: 'Planície de Aurora', theme: 0, startGold: 250, tierBase: 1,
    path: [[0,2],[20,2],[20,6],[3,6],[3,10],[20,10],[20,13],[23,13]]
  },
  {
    id: 1, name: 'Bosque Sussurrante', theme: 1, startGold: 350, tierBase: 1,
    path: [[2,0],[2,12],[7,12],[7,3],[12,3],[12,12],[17,12],[17,3],[21,3],[21,15]]
  },
  {
    id: 2, name: 'Dunas Douradas', theme: 2, startGold: 450, tierBase: 1,
    path: [[0,1],[10,1],[10,5],[3,5],[3,12],[13,12],[13,8],[20,8],[20,14],[23,14]]
  },
  {
    id: 3, name: 'Pântano Lodoso', theme: 3, startGold: 550, tierBase: 2,
    path: [[0,7],[5,7],[5,2],[11,2],[11,13],[17,13],[17,2],[22,2],[22,15]]
  },
  {
    id: 4, name: 'Picos Nevados', theme: 4, startGold: 650, tierBase: 2,
    path: [[12,0],[12,4],[3,4],[3,11],[9,11],[9,7],[16,7],[16,12],[20,12],[20,3],[23,3]]
  },
  {
    id: 5, name: 'Cânion Rubro', theme: 5, startGold: 750, tierBase: 3,
    path: [[0,3],[7,3],[7,12],[12,12],[12,7],[17,7],[17,12],[21,12],[21,0]]
  },
  {
    id: 6, name: 'Tundra de Cristal', theme: 6, startGold: 850, tierBase: 3,
    path: [[23,12],[18,12],[18,3],[12,3],[12,12],[6,12],[6,4],[0,4]]
  },
  {
    id: 7, name: 'Caldeira Vulcânica', theme: 7, startGold: 950, tierBase: 3,
    path: [[0,2],[16,2],[16,8],[5,8],[5,14],[23,14]]
  },
  {
    id: 8, name: 'Terras Sombrias', theme: 8, startGold: 1050, tierBase: 4,
    path: [[8,0],[8,6],[2,6],[2,12],[14,12],[14,5],[20,5],[20,15]]
  },
  {
    id: 9, name: 'Cidadela do Vazio', theme: 9, startGold: 1150, tierBase: 4,
    path: [[0,8],[6,8],[6,3],[12,3],[12,13],[18,13],[18,5],[23,5]]
  }
];

if (typeof module !== 'undefined') module.exports = { TOWERS, ENEMIES, MAPS, THEMES };

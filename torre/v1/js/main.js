Save.load();
Sfx.muted = !Save.data.sound;
window.TD = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0d1017',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, MapSelectScene, HelpScene, GameScene, ResultScene],
});

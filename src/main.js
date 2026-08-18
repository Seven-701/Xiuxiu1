// Phaser 4 没有默认导出，必须用 import * as 这种"命名空间"导入方式
import * as Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import { createPlayerData, recomputeStats } from './playerData.js';
import './ui.js'; // 界面模块：状态栏、物品栏、背包（导入即生效）

// ============ 全游戏共享的玩家数据 ============
// Phaser 场景（世界）和界面模块（网页）都读写这一份数据。
// 小技巧：在浏览器按 F12，控制台里输入 gameData 回车，就能直接查看它。
// 以后做联机时，每个玩家都有一份这样的数据，由服务器保管。
window.gameData = createPlayerData();
recomputeStats(window.gameData); // 开局先算一次装备带来的属性

// ============ Phaser 游戏的"总开关" ============
const config = {
  type: Phaser.AUTO,          // 自动选择渲染方式（优先 WebGL）
  parent: 'game',             // 把游戏画布放进 index.html 里 id 为 game 的区域
  width: 960,                 // 窗口宽（像素）
  height: 540,                // 窗口高（像素）
  backgroundColor: '#2d5a27', // 还没画到的地方用这个颜色兜底
  pixelArt: true,             // 像素风格：关闭平滑缩放，画面更"像素"
  physics: {
    default: 'arcade',        // 使用轻量的 Arcade 物理引擎（移动/碰撞够用）
    arcade: { debug: false },
  },
  scene: [GameScene],         // 游戏启动时先进入哪个场景
};

new Phaser.Game(config);

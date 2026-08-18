import * as Phaser from 'phaser';
import { addExp, addLingShi, regenQi } from '../playerData.js';
import { drawPlayer, drawAnimal } from '../sprites.js';

// 游戏主场景：负责"世界"——地图、玩家、灵石、障碍、技能效果
// 注意：界面（状态栏/背包/技能栏）不在这里。
// 界面是用网页元素做的，代码在 src/ui.js —— 这叫"分层"：
// Phaser 管世界，网页管界面，两边通过 window.gameData 共享数据。
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // ============ 1. 世界边界：3200x3200 的大世界 ============
    const worldWidth = 3200;
    const worldHeight = 3200;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // ============ 2. 地面 ============
    const g = this.add.graphics();
    const tile = 32; // 每格 32 像素
    for (let x = 0; x < worldWidth / tile; x++) {
      for (let y = 0; y < worldHeight / tile; y++) {
        // 青绿山水色调：中国画里的"青绿"，比卡通绿更素雅
        g.fillStyle((x + y) % 2 === 0 ? 0x527a63 : 0x4a7059, 1);
        g.fillRect(x * tile, y * tile, tile, tile);
      }
    }

    // ============ 3. 玩家：随机出生点 ============
    // 每次刷新页面，出生位置都不一样——这就是"每个玩家开局不同"
    const spawnX = Phaser.Math.Between(300, worldWidth - 300);
    const spawnY = Phaser.Math.Between(300, worldHeight - 300);
    this.spawn = { x: spawnX, y: spawnY }; // 记住出生点：重伤后回这里

    // 玩家本体：一个不可见的矩形，只负责物理碰撞
    // 画面由下面的"像素小人"负责——这叫"显示与逻辑分离"
    this.player = this.add.rectangle(spawnX, spawnY, 24, 32, 0xffffff).setVisible(false);
    this.physics.add.existing(this.player);        // 物理身体：移动和碰撞
    this.player.body.setCollideWorldBounds(true);  // 不能走出地图边界

    // 像素小人：白衣少年（由 src/sprites.js 用代码绘制，四朝向 + 装备外观）
    this.playerGfx = this.add.graphics();
    this.facing4 = 'down';    // 朝向：down/up/left/right
    this.lastLookKey = '';    // "朝向+装备"指纹：变了才重画小人
    this.redrawPlayer();      // 画第一帧

    // 金光神咒的金色护体光环（平时隐藏，buff 生效时显示）
    this.shieldRing = this.add.circle(spawnX, spawnY, 30);
    this.shieldRing.setStrokeStyle(3, 0xffd700, 0.9);
    this.shieldRing.setFillStyle(0xffd700, 0.05);
    this.shieldRing.setVisible(false);

    // 镜头限制在地图范围内，并跟随玩家
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player);

    // ============ 4. 键盘与攻击 ============
    this.cursors = this.input.keyboard.createCursorKeys(); // 方向键
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');    // WASD
    this.lastAttackAt = 0; // 上次挥剑的时间戳（控制攻速：0.4 秒一剑）

    // ============ 5. 地形与障碍物 ============
    // 障碍物集合：池塘、石头、树木都会挡住去路
    this.obstacles = this.physics.add.staticGroup(); // staticGroup = 不会自己动的物体

    // --- 5.1 荷塘：3 片青碧湖水（堤岸 + 水面 + 荷叶荷花）---
    // 先画池塘并记下位置，后面的树木/石头/花丛都要避开水面
    const ponds = [];
    for (let i = 0; i < 3; i++) {
      const px = Phaser.Math.Between(500, worldWidth - 500);
      const py = Phaser.Math.Between(500, worldHeight - 500);
      const pr = Phaser.Math.Between(100, 150); // 湖的半径
      ponds.push({ x: px, y: py, r: pr });
      this.add.circle(px, py, pr + 12, 0xd6bf8d).setDepth(py);                  // 堤岸（土黄）
      this.add.circle(px, py, pr, 0x3a6b7a).setDepth(py);                       // 主湖面（青碧）
      this.add.circle(px - pr * 0.5, py + pr * 0.25, pr * 0.7, 0x3a6b7a).setDepth(py);
      this.add.circle(px + pr * 0.5, py + pr * 0.2, pr * 0.65, 0x3a6b7a).setDepth(py);
      this.add.circle(px, py, pr * 0.45, 0x4a7f8f).setDepth(py);                // 湖心波光

      // 荷叶：扁扁的椭圆漂在水面上
      for (let l = 0; l < 8; l++) {
        const lx = px + Phaser.Math.FloatBetween(-1, 1) * pr * 0.8;
        const ly = py + Phaser.Math.FloatBetween(-1, 1) * pr * 0.8;
        this.add.ellipse(lx, ly, 18, 9, 0x3f7d55).setDepth(py + 1);
      }
      // 荷花：粉花 + 花心亮部
      for (let l = 0; l < 3; l++) {
        const lx = px + Phaser.Math.FloatBetween(-1, 1) * pr * 0.7;
        const ly = py + Phaser.Math.FloatBetween(-1, 1) * pr * 0.7;
        this.add.circle(lx, ly, 4, 0xf0a8b8).setDepth(py + 2);
        this.add.circle(lx + 1, ly - 1, 2, 0xf7c8d3).setDepth(py + 2);
      }

      // 圆形的隐形碰撞块：暂时不能下水
      const pondBody = this.add.circle(px, py, pr + 8, 0x3a6b7a).setVisible(false);
      this.obstacles.add(pondBody);
      pondBody.body.setCircle(pr + 8); // 把碰撞形状设成圆形
    }

    // 判断某个点是否离湖太近（用来给别的物体找"能放的地方"）
    const inPond = (x, y) => ponds.some((p) => Math.hypot(x - p.x, y - p.y) < p.r + 40);

    // --- 5.2 假山石：20 块太湖石（灰青色、圆润造型，园林里那种） ---
    let rockCount = 0;
    let rockTries = 0;
    while (rockCount < 20 && rockTries < 200) {
      rockTries++;
      const rx = Phaser.Math.Between(100, worldWidth - 100);
      const ry = Phaser.Math.Between(100, worldHeight - 100);
      if (inPond(rx, ry)) continue; // 石头漂在水上太怪了，换位置
      const rr = Phaser.Math.Between(16, 26); // 石头大小随机
      this.add.circle(rx, ry, rr, 0x8a9799).setDepth(ry);              // 石身（灰青）
      this.add.circle(rx + 3, ry + 4, rr * 0.6, 0x7c8a8d).setDepth(ry); // 暗面，有立体感
      const rockBody = this.add.circle(rx, ry, rr + 2, 0x8a9799).setVisible(false);
      this.obstacles.add(rockBody);
      rockBody.body.setCircle(rr + 2); // 圆形碰撞
      rockCount++;
    }

    // --- 5.3 树木：40 棵，三种中国传统植物（竹林/松树/桃树） ---
    let treeCount = 0;
    let treeTries = 0;
    while (treeCount < 40 && treeTries < 300) {
      treeTries++;
      const tx = Phaser.Math.Between(60, worldWidth - 60);
      const ty = Phaser.Math.Between(60, worldHeight - 60);
      if (inPond(tx, ty)) continue;
      const kind = Phaser.Math.Between(0, 9); // 随机植物：0~3 竹，4~6 松，7~9 桃

      if (kind <= 3) {
        // 竹林：几根一节一节的竹竿
        const drawStalk = (x, h) => {
          this.add.rectangle(x, ty - h / 2, 4, h, 0x3e7a52).setDepth(ty); // 竹竿
          for (let s = ty - h / 2 + 12; s < ty + h / 2; s += 12) {
            this.add.rectangle(x, s, 5, 2, 0x2e5d3e).setDepth(ty); // 竹节
          }
        };
        drawStalk(tx - 7, Phaser.Math.Between(40, 60));
        drawStalk(tx + 3, Phaser.Math.Between(48, 72));
        drawStalk(tx + 10, Phaser.Math.Between(36, 56));
        drawStalk(tx - 2, Phaser.Math.Between(52, 76));
        this.add.rectangle(tx - 4, ty - 38, 8, 2, 0x4c8f62).setDepth(ty); // 竹叶
        this.add.rectangle(tx + 8, ty - 42, 7, 2, 0x4c8f62).setDepth(ty);
        const bambooBody = this.add.rectangle(tx, ty, 12, 12, 0x3e7a52).setVisible(false);
        this.obstacles.add(bambooBody); // 竹子只有根部挡路
      } else if (kind <= 6) {
        // 松树：水墨画里一层层叠上去的树冠
        this.add.rectangle(tx, ty + 12, 8, 24, 0x5a4632).setDepth(ty + 20); // 树干
        this.add.circle(tx, ty - 8, 16, 0x2e5a45).setDepth(ty);             // 树冠：下大上小三层
        this.add.circle(tx, ty - 20, 13, 0x35664d).setDepth(ty);
        this.add.circle(tx, ty - 30, 9, 0x3d7356).setDepth(ty);
        const pineBody = this.add.rectangle(tx, ty + 10, 12, 16, 0x5a4632).setVisible(false);
        this.obstacles.add(pineBody);
      } else {
        // 桃树：粉色花冠
        this.add.rectangle(tx, ty + 12, 8, 24, 0x5a4632).setDepth(ty + 20);
        this.add.circle(tx - 5, ty - 4, 14, 0xe8a8b8).setDepth(ty); // 花冠
        this.add.circle(tx + 6, ty - 2, 13, 0xe8a8b8).setDepth(ty);
        this.add.circle(tx, ty - 10, 12, 0xf2c3cf).setDepth(ty);    // 花冠亮部
        const peachBody = this.add.rectangle(tx, ty + 10, 12, 16, 0x5a4632).setVisible(false);
        this.obstacles.add(peachBody);
      }
      treeCount++;
    }

    // --- 5.4 花丛：60 丛（桃花粉/梨花白/梅花红/迎春黄），纯装饰不挡路 ---
    const flowerColors = [0xf0aebd, 0xf2ead8, 0xd96a7a, 0xe8c86a];
    let flowerCount = 0;
    let flowerTries = 0;
    while (flowerCount < 60 && flowerTries < 300) {
      flowerTries++;
      const fx = Phaser.Math.Between(30, worldWidth - 30);
      const fy = Phaser.Math.Between(30, worldHeight - 30);
      if (inPond(fx, fy)) continue; // 花也别开在水里
      const fc = flowerColors[Phaser.Math.Between(0, flowerColors.length - 1)];
      this.add.circle(fx, fy, 2, fc);      // 一丛 = 3 朵小花
      this.add.circle(fx + 4, fy + 2, 2, fc);
      this.add.circle(fx - 3, fy + 3, 2, fc);
      flowerCount++;
    }

    this.physics.add.collider(this.player, this.obstacles);

    // ============ 6. 灵石：30 颗随机分布 ============
    // 捡到一颗：灵石 +1、经验 +10×悟性加成（经验满自动突破境界）
    this.spiritStones = this.physics.add.group();
    for (let i = 0; i < 30; i++) {
      const sx = Phaser.Math.Between(100, worldWidth - 100);
      const sy = Phaser.Math.Between(100, worldHeight - 100);
      if (inPond(sx, sy)) { i--; continue; } // 灵石别落在湖里，不然玩家捡不到
      const stone = this.add.circle(sx, sy, 8, 0xffd700);
      stone.setDepth(sy); // 和树木/石头一样按 y 排前后
      this.spiritStones.add(stone);
    }
    this.physics.add.overlap(this.player, this.spiritStones, this.collectStone, null, this);

    // ============ 7. 动物：随机分布 + 随机游荡 ============
    // 目前只有"低级动物"：普通动物 + 山海经里的低级异兽
    // 高级妖兽（毕方、九尾狐……）以后境界高了再解锁出现
    this.animals = this.physics.add.group();
    // kind：'prey' 温顺（被打就逃） / 'beast' 凶猛（被打会记仇反击）
    // bite：反击时咬一口的伤害；hp/exp：血量 / 击杀经验
    const WILDLIFE = [
      { key: 'rabbit', name: '兔子', count: 6, speed: 55, bodyR: 6, kind: 'prey', hp: 12, exp: 15 },
      { key: 'pheasant', name: '野鸡', count: 5, speed: 40, bodyR: 6, kind: 'prey', hp: 10, exp: 15 },
      { key: 'deer', name: '白鹿', count: 3, speed: 70, bodyR: 8, kind: 'prey', hp: 20, exp: 25 },
      { key: 'feifei', name: '朏朏', count: 5, speed: 65, bodyR: 6, kind: 'beast', hp: 25, exp: 30, bite: 6 },   // 山海经·中山经
      { key: 'xingxing', name: '狌狌', count: 4, speed: 60, bodyR: 7, kind: 'beast', hp: 30, exp: 35, bite: 8 }, // 山海经·南山经
      { key: 'dangkang', name: '当康', count: 2, speed: 35, bodyR: 7, kind: 'beast', hp: 40, exp: 50, bite: 10 }, // 山海经·东山经
    ];

    for (const spec of WILDLIFE) {
      for (let i = 0; i < spec.count; i++) {
        // 抽一个不在水里的出生点
        let ax, ay;
        do {
          ax = Phaser.Math.Between(80, worldWidth - 80);
          ay = Phaser.Math.Between(80, worldHeight - 80);
        } while (inPond(ax, ay));

        // 身体：隐形圆，负责碰撞和移动
        const critter = this.add.circle(ax, ay, spec.bodyR, 0xffffff).setVisible(false);
        this.animals.add(critter);
        // 小知识：圆形这类"图形对象"没有快捷方法，碰撞设置要写成 对象.body.xxx
        critter.body.setCollideWorldBounds(true); // 动物不走出地图

        // 外观：小动物造型（画一次，转身时才重画）
        const gfx = this.add.graphics();
        drawAnimal(gfx, spec.key, 'left');
        critter.animalGfx = gfx;
        critter.animalKey = spec.key;
        critter.animalSpeed = spec.speed;
        critter.animalFace = 'left';
        critter.animalMoveUntil = 0;
        critter.animalThinkAt = Date.now() + Phaser.Math.Between(0, 2000); // 错开"想事情"的时间

        // ---- 战斗相关状态 ----
        critter.animalHp = spec.hp;          // 血量
        critter.animalKind = spec.kind;      // 温顺 / 凶猛
        critter.animalExp = spec.exp;        // 击杀给的经验
        critter.animalBite = spec.bite || 0; // 反击伤害
        critter.animalHostile = false;       // 是否在追玩家
        critter.animalFleeUntil = 0;         // 受惊逃跑的截止时间
        critter.animalKnockbackUntil = 0;    // 被击退的截止时间
        critter.animalBiteAt = 0;            // 下一次咬人的时间
      }
    }
    this.physics.add.collider(this.animals, this.obstacles); // 动物不穿树穿石
    this.physics.add.collider(this.animals, this.animals);   // 动物之间也不重叠

    // 记录玩家朝向：御剑术冲刺方向 + 像素小人朝向（初始朝下）
    this.facing = new Phaser.Math.Vector2(0, 1);
  }

  // ============ 像素小人相关 ============
  // "朝向+装备"指纹里的装备部分：哪些装备穿在身上
  lookKeyTail() {
    const d = window.gameData;
    const weapon = d.inventory.find((i) => i.slot === 'weapon' && i.equipped);
    const armor = d.inventory.find((i) => i.slot === 'body' && i.equipped);
    const feet = d.inventory.find((i) => i.slot === 'feet' && i.equipped);
    return (weapon ? weapon.id : '-') + '|' + (armor ? armor.id : '-') + '|' + (feet ? feet.id : '-');
  }

  // 重画像素小人（朝向或装备变化时调用）
  redrawPlayer() {
    const d = window.gameData;
    const weapon = d.inventory.find((i) => i.slot === 'weapon' && i.equipped);
    const armor = d.inventory.find((i) => i.slot === 'body' && i.equipped);
    const feet = d.inventory.find((i) => i.slot === 'feet' && i.equipped);
    drawPlayer(this.playerGfx, this.facing4, { weapon, armor, feet });
    this.lastLookKey = this.facing4 + '|' + this.lookKeyTail();
  }

  // 玩家碰到灵石时自动调用
  collectStone(player, stone) {
    stone.destroy(); // 灵石消失

    const data = window.gameData; // 全游戏共享的玩家数据
    addLingShi(data, 1);          // 灵石 +1
    const gained = addExp(data, 10); // 经验 +10 ×悟性加成

    this.floatText(stone.x - 20, stone.y - 20, '+' + gained + ' 经验', '#ffe066');
  }

  // ============ 战斗 ============
  // 挥剑攻击（由 update 每帧检查左键调用）
  tryAttack() {
    const data = window.gameData;
    const now = Date.now();
    if (now < this.lastAttackAt + 400) return; // 攻速：0.4 秒一剑
    this.lastAttackAt = now;

    // 面朝鼠标方向（指针坐标 → 世界坐标，要加上镜头的偏移）
    const pointer = this.input.activePointer;
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const dir = new Phaser.Math.Vector2(world.x - this.player.x, world.y - this.player.y).normalize();
    if (dir.x !== 0 || dir.y !== 0) this.facing = dir;

    // 挥剑特效：面前一道白色弧光，很快淡出
    const baseAngle = Math.atan2(this.facing.y, this.facing.x);
    const swing = this.add.graphics();
    swing.fillStyle(0xffffff, 0.7);
    swing.slice(this.player.x, this.player.y, 42, baseAngle - 0.6, baseAngle + 0.6, false);
    swing.fillPath();
    swing.setDepth(this.player.y + 1);
    this.tweens.add({ targets: swing, alpha: 0, duration: 180, onComplete: () => swing.destroy() });

    // 判定：剑面前 55 像素、约 60 度扇区内的动物被砍中
    const damage = 2 + data.attack; // 空手 2 点，拿木剑 7 点
    for (const animal of this.animals.getChildren()) {
      const dx = animal.x - this.player.x;
      const dy = animal.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 55) continue; // 太远
      let angleDiff = Math.abs(Math.atan2(dy, dx) - baseAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      if (angleDiff > 1.05) continue; // 不在扇区内
      this.hitAnimal(animal, damage);
    }
  }

  // 动物被砍中
  hitAnimal(animal, damage) {
    const data = window.gameData;
    animal.animalHp -= damage;
    this.floatText(animal.x, animal.y - 18, '-' + damage, '#ff6b6b');

    // 受击白闪 + 朝反方向击退
    this.tweens.add({ targets: animal.animalGfx, alpha: 0.25, yoyo: true, duration: 80 });
    const dir = new Phaser.Math.Vector2(animal.x - this.player.x, animal.y - this.player.y).normalize();
    animal.body.setVelocity(dir.x * 160, dir.y * 160);
    animal.animalKnockbackUntil = Date.now() + 150;

    if (animal.animalHp <= 0) {
      // 击杀奖励：经验 + 灵石
      const gained = addExp(data, animal.animalExp);
      const ling = Phaser.Math.Between(2, 4);
      addLingShi(data, ling);
      this.floatText(animal.x, animal.y - 30, '+' + gained + ' 经验  +' + ling + ' 灵石', '#ffe066');
      animal.destroy();
      animal.animalGfx.destroy();
      return;
    }

    // 没死的话：温顺的受惊逃跑，凶猛的记仇反击
    if (animal.animalKind === 'beast') {
      animal.animalHostile = true;
    } else {
      animal.animalFleeUntil = Date.now() + 3000; // 受惊逃跑 3 秒
    }
  }

  // 玩家被猛兽咬
  hurtPlayer(animal, bite) {
    const data = window.gameData;
    const now = Date.now();
    if (now < animal.animalBiteAt) return; // 每 0.8 秒咬一口
    animal.animalBiteAt = now + 800;

    // 护甲每 3 点抵消 1 点伤害（最少也掉 1 点血）
    const taken = Math.max(1, bite - Math.floor(data.armor / 3));
    data.hp -= taken;
    this.floatText(this.player.x, this.player.y - 26, '-' + taken, '#ff5252');

    if (data.hp <= 0) {
      // 重伤：回出生点满状态，动物们消气
      data.hp = data.maxHp;
      data.qi = data.maxQi;
      this.player.setPosition(this.spawn.x, this.spawn.y);
      for (const a of this.animals.getChildren()) {
        a.animalHostile = false;
        a.animalFleeUntil = 0;
        a.body.setVelocity(0);
      }
      this.floatText(this.player.x, this.player.y - 30, '重伤！被送回出生点', '#ff5252');
    }
  }

  // 飘字：文字向上飘并淡出（伤害/经验/提示都用它）
  floatText(x, y, str, color) {
    const text = this.add.text(x, y, str, {
      fontFamily: 'sans-serif', fontSize: '14px', color,
    });
    text.setDepth(9999); // 永远显示在最上面
    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  update(time, delta) {
    const data = window.gameData;
    const now = Date.now();

    // 按住左键攻击（点一下 = 挥一剑；按住 = 按攻速连续挥）
    if (this.input.activePointer.isDown && this.input.activePointer.leftButtonDown()) {
      this.tryAttack();
    }

    // 内力缓慢回复（每秒 1 点）
    regenQi(data, delta);

    // 御剑术：ui.js 施放技能时设置了 pendingDash，这里执行前冲
    if (data.pendingDash) {
      data.pendingDash = false;
      data.buffs.dashUntil = now + 250; // 0.25 秒冲刺
    }

    // 缩地成寸：buff 生效期间移速翻倍
    const speed = 200 * (now < data.buffs.speedUntil ? 2 : 1);

    const body = this.player.body;
    body.setVelocity(0); // 先把速度清零，没按键就不动

    // 方向键 和 WASD 都可以用
    const cursors = this.cursors;
    const wasd = this.wasd;
    const left = cursors.left.isDown || wasd.A.isDown;
    const right = cursors.right.isDown || wasd.D.isDown;
    const up = cursors.up.isDown || wasd.W.isDown;
    const down = cursors.down.isDown || wasd.S.isDown;

    // 计算方向并"归一化"：斜着走不会比直着走更快
    const dir = new Phaser.Math.Vector2(
      (right ? 1 : 0) - (left ? 1 : 0),
      (down ? 1 : 0) - (up ? 1 : 0),
    ).normalize();

    if (dir.x !== 0 || dir.y !== 0) this.facing = dir; // 记住朝向

    // 四方向（上/下/左/右）：朝向或装备变化时，重画像素小人
    this.facing4 = Math.abs(this.facing.x) > Math.abs(this.facing.y)
      ? (this.facing.x > 0 ? 'right' : 'left')
      : (this.facing.y > 0 ? 'down' : 'up');
    const lookKey = this.facing4 + '|' + this.lookKeyTail();
    if (lookKey !== this.lastLookKey) this.redrawPlayer();

    // 冲刺期间速度被御剑术接管，否则正常移动
    if (now < data.buffs.dashUntil && this.facing) {
      body.setVelocity(this.facing.x * 800, this.facing.y * 800);
    } else {
      body.setVelocity(dir.x * speed, dir.y * speed);
    }

    // 金光神咒：护体光环跟随玩家
    this.shieldRing.setVisible(now < data.buffs.shieldUntil);
    this.shieldRing.setPosition(this.player.x, this.player.y);
    this.shieldRing.setDepth(this.player.y); // 光环也参与前后排序

    // 像素小人跟着身体走（位置取整，像素更清晰不抖动）
    this.playerGfx.setPosition(Math.round(this.player.x - 12), Math.round(this.player.y - 16));
    // 按 y 排前后：玩家走到树/石头前面时，小人画在它们前面；走到后面就画在后面
    this.playerGfx.setDepth(this.player.y);

    // ============ 动物 AI（三种状态：游荡 / 逃跑 / 追人） ============
    for (const animal of this.animals.getChildren()) {
      const aBody = animal.body;
      const dx = this.player.x - animal.x;
      const dy = this.player.y - animal.y;
      let dist = Math.hypot(dx, dy);
      if (dist < 1) dist = 1; // 防止除以 0

      // 被击退期间：AI 不接管速度，只让外观跟着身体走
      if (now < animal.animalKnockbackUntil) {
        animal.animalGfx.setPosition(Math.round(animal.x), Math.round(animal.y));
        animal.animalGfx.setDepth(animal.y);
        continue;
      }

      if (animal.animalHostile) {
        // 状态 1：猛兽追击玩家；离远（400 像素）就消气
        if (dist > 400) {
          animal.animalHostile = false;
          aBody.setVelocity(0);
        } else if (dist < 26) {
          aBody.setVelocity(0);
          this.hurtPlayer(animal, animal.animalBite); // 贴身就咬
        } else {
          const speed = animal.animalSpeed * 1.3; // 追击比平常快
          aBody.setVelocity((dx / dist) * speed, (dy / dist) * speed);
          const face = dx >= 0 ? 'right' : 'left';
          if (face !== animal.animalFace) {
            animal.animalFace = face;
            drawAnimal(animal.animalGfx, animal.animalKey, face); // 转身才重画
          }
        }
      } else if (animal.animalFleeUntil > 0 && now < animal.animalFleeUntil) {
        // 状态 2：温顺动物受惊逃跑，跑远（250 像素）就安心
        if (dist > 250) {
          animal.animalFleeUntil = 0;
          aBody.setVelocity(0);
        } else {
          const speed = animal.animalSpeed * 2.5; // 逃命比平常快
          aBody.setVelocity((-dx / dist) * speed, (-dy / dist) * speed);
          const face = -dx >= 0 ? 'right' : 'left';
          if (face !== animal.animalFace) {
            animal.animalFace = face;
            drawAnimal(animal.animalGfx, animal.animalKey, face);
          }
        }
      } else {
        // 状态 3：平常的游荡——每过 1~4 秒"想"一次：40% 发呆，60% 随机走 1~3 秒
        if (now > animal.animalThinkAt) {
          animal.animalThinkAt = now + Phaser.Math.Between(1000, 4000);
          if (Math.random() < 0.4) {
            animal.animalMoveUntil = 0; // 发呆：站着不动
            aBody.setVelocity(0);
          } else {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2); // 随机方向
            animal.animalMoveUntil = now + Phaser.Math.Between(1000, 3000);
            const face = Math.cos(angle) >= 0 ? 'right' : 'left';
            if (face !== animal.animalFace) {
              animal.animalFace = face;
              drawAnimal(animal.animalGfx, animal.animalKey, face);
            }
            aBody.setVelocity(Math.cos(angle) * animal.animalSpeed, Math.sin(angle) * animal.animalSpeed);
          }
        }
        if (animal.animalMoveUntil > 0 && now > animal.animalMoveUntil) {
          aBody.setVelocity(0); // 走够了，停下
        }
      }

      // 外观跟着身体走（取整，像素清晰），并参与前后遮挡
      animal.animalGfx.setPosition(Math.round(animal.x), Math.round(animal.y));
      animal.animalGfx.setDepth(animal.y);
    }
  }
}

/* =============================================================
   墨海寻珠 · 程序化贴图（阶段 4）
   设计文档：.documents/首页设计方案合集.md 第 9.2 / 9.3 节（文字与标线方案）、
             第 14.6 节（阶段 4 交付物）

   全部可见文字与标线都来自运行时 canvas，仓库里不新增任何 SVG / PNG：
   - 店招、路牌、海报、自动贩卖机标签、店内价签
   - 斑马线、停车位、排水沟、地面导视（人行道盲道）

   三条硬约束（第 14.6 节实现要点）：
   1. 贴图统一 colorSpace = SRGBColorSpace；
   2. 文字类贴图按「目标平面的实际宽高比」生成画布，避免拉伸变形；
   3. 尺寸够用就好：能 512 解决不上 1024（本文件最大的一张是店招 1024×96，
      因为它在最近机位下横向接近 460 屏幕像素，512 宽会糊）。
   ============================================================= */

const SANS = '"Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "PingFang SC", "SimHei", sans-serif';

const INK_BLUE = "#16386b";
const WARM = "#ff9f43";
const WARM_LIGHT = "#ffd6a5";

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toTexture(THREE, canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 1; // 入口模块拿到 renderer 后会按硬件上限再抬一次
  texture.needsUpdate = true;
  return texture;
}

function text(ctx, value, x, y, font, color, align, baseline) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align || "center";
  ctx.textBaseline = baseline || "middle";
  ctx.fillText(value, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ---------- 店招：目标平面 3.96 × 0.37（10.7:1） ---------- */
function signTexture(THREE) {
  const canvas = createCanvas(1024, 96);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#1d4784");
  gradient.addColorStop(1, "#102a52");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = WARM;
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(0, 0, canvas.width, 3);

  text(ctx, "墨海便利店", 372, 46, "bold 62px " + SANS, "#ffffff");
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.fillRect(640, 18, 3, 60);
  text(ctx, "MOHAI MART", 812, 36, "bold 30px " + SANS, WARM_LIGHT);
  text(ctx, "24H OPEN", 812, 68, "bold 22px " + SANS, "rgba(255, 214, 165, 0.82)");

  return toTexture(THREE, canvas);
}

/* ---------- 路牌：目标平面 0.52 × 0.37（1.4:1） ---------- */
function roadSignTexture(THREE) {
  const canvas = createCanvas(256, 184);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f5f8fc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = INK_BLUE;
  ctx.lineWidth = 10;
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);

  text(ctx, "墨海路", 128, 62, "bold 52px " + SANS, INK_BLUE);
  ctx.fillStyle = INK_BLUE;
  ctx.fillRect(30, 96, canvas.width - 60, 3);
  text(ctx, "MOHAI RD.", 128, 126, "bold 24px " + SANS, "#2f4a72");
  text(ctx, "↑ 前方 50m", 128, 156, "20px " + SANS, "#4b5f80");

  return toTexture(THREE, canvas);
}

/* ---------- 海报：目标平面 0.44 × 0.66（2:3） ---------- */
function posterSaleTexture(THREE) {
  const canvas = createCanvas(256, 384);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#ffd166");
  gradient.addColorStop(1, "#ff9f43");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  roundRect(ctx, 24, 128, canvas.width - 48, 108, 14);
  ctx.fill();

  text(ctx, "限时特惠", 128, 76, "bold 46px " + SANS, "#7a2e00");
  text(ctx, "SALE", 128, 182, "bold 66px " + SANS, "#e8590c");
  text(ctx, "全场 -20%", 128, 286, "bold 36px " + SANS, "#ffffff");
  text(ctx, "MOHAI MART", 128, 340, "bold 18px " + SANS, "rgba(255,255,255,0.85)");

  return toTexture(THREE, canvas);
}

function posterNewTexture(THREE) {
  const canvas = createCanvas(256, 384);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#ff6fae");
  gradient.addColorStop(1, "#7c3aed");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(40 + i * 36, 62 + (i % 2) * 16, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  text(ctx, "新品上市", 128, 148, "bold 46px " + SANS, "#ffffff");
  text(ctx, "NEW", 128, 226, "bold 72px " + SANS, "#ffffff");
  text(ctx, "ARRIVAL", 128, 282, "bold 30px " + SANS, "#ffe3f1");
  text(ctx, "墨海便利店", 128, 342, "bold 20px " + SANS, "rgba(255,255,255,0.9)");

  return toTexture(THREE, canvas);
}

function posterDrinkTexture(THREE) {
  const canvas = createCanvas(256, 384);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#67e8f9");
  gradient.addColorStop(1, "#0ea5e9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 冰杯剪影
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.beginPath();
  ctx.moveTo(88, 150);
  ctx.lineTo(168, 150);
  ctx.lineTo(156, 300);
  ctx.lineTo(100, 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0ea5e9";
  ctx.fillRect(124, 96, 10, 60);

  text(ctx, "冷饮上新", 128, 62, "bold 40px " + SANS, "#e8f8ff");
  text(ctx, "COLD DRINK", 128, 344, "bold 22px " + SANS, "#e8f8ff");

  return toTexture(THREE, canvas);
}

/* ---------- 自动贩卖机标签：目标平面 0.66 × 0.165（4:1） ---------- */
function vendingTexture(THREE) {
  const canvas = createCanvas(256, 64);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = INK_BLUE;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = WARM;
  ctx.fillRect(0, canvas.height - 5, canvas.width, 5);

  text(ctx, "墨海自販機", 92, 32, "bold 30px " + SANS, "#ffffff");
  text(ctx, "COLD / HOT", 206, 32, "bold 16px " + SANS, WARM_LIGHT);

  return toTexture(THREE, canvas);
}

/* ---------- 店内价签：目标平面 0.14 × 0.07（2:1） ---------- */
function priceTagTexture(THREE, price) {
  const canvas = createCanvas(128, 64);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#e0d8c8";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  text(ctx, price, 64, 30, "bold 32px " + SANS, "#d9342b");
  text(ctx, "税込", 64, 52, "bold 16px " + SANS, "#8b8478");

  return toTexture(THREE, canvas);
}

/* ---------- 地面标线 ---------- */
// 斑马线：目标平面 1.6 × 1.4（1.14:1），白条沿 x 方向
function crosswalkTexture(THREE) {
  const canvas = createCanvas(256, 224);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(0, 16 + i * 56, canvas.width, 26);
  }
  return toTexture(THREE, canvas);
}

// 停车位：目标平面 2.0 × 1.0（2:1）
function parkingTexture(THREE) {
  const canvas = createCanvas(256, 128);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 9;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  text(ctx, "P", 62, 64, "bold 62px " + SANS, "rgba(255,255,255,0.92)");
  text(ctx, "01", 176, 64, "bold 40px " + SANS, "rgba(255,255,255,0.8)");

  return toTexture(THREE, canvas);
}

// 排水沟：64×64 平铺
function drainTexture(THREE) {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2b3446";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#55617a";
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(0, 6 + i * 15, 64, 7);
  }
  return toTexture(THREE, canvas);
}

// 人行道盲道：64×64 平铺
function tactileTexture(THREE) {
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e9b949";
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#c99a2e";
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.beginPath();
      ctx.arc(12 + col * 14, 12 + row * 14, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(THREE, canvas);
}

/**
 * 生成阶段 4 用到的全部程序化贴图。
 * @param {object} THREE 入口模块传入的 three 命名空间
 */
export function createTextureLibrary(THREE) {
  const textures = {
    sign: signTexture(THREE),
    roadSign: roadSignTexture(THREE),
    posterSale: posterSaleTexture(THREE),
    posterNew: posterNewTexture(THREE),
    posterDrink: posterDrinkTexture(THREE),
    vending: vendingTexture(THREE),
    priceA: priceTagTexture(THREE, "¥6.5"),
    priceB: priceTagTexture(THREE, "¥12.8"),
    priceC: priceTagTexture(THREE, "¥8.0"),
    crosswalk: crosswalkTexture(THREE),
    parking: parkingTexture(THREE),
    drain: drainTexture(THREE),
    tactile: tactileTexture(THREE)
  };

  // 平铺类贴图：沿长度方向重复，避免为一条 4m 长的排水沟生成超宽画布
  ["drain", "tactile"].forEach(function (key) {
    textures[key].wrapS = THREE.RepeatWrapping;
    textures[key].wrapT = THREE.ClampToEdgeWrapping;
  });

  function dispose() {
    Object.keys(textures).forEach(function (key) { textures[key].dispose(); });
  }

  return { textures: textures, dispose: dispose };
}

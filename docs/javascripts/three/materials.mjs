/* =============================================================
   墨海寻珠 · 三渲二材质、轮廓与昼夜光照（阶段 2）
   设计文档：.documents/首页设计方案合集.md 第 4.1–4.3 节（三渲二 / 轮廓 / 双套色调）、
             第 9.4 节（渐变分档）、第 10 节（材质与灯光）、第 14.4 节（阶段 2 交付物）

   两个 three 实现细节（读源码确认，写错会直接失去三渲二效果）：
   1. MeshToonMaterial 的分档采样是 `texture2D(gradientMap, vec2(dotNL*0.5+0.5, 0.0)).r`：
      分档只沿 **u（宽度）方向**、且 **只取红色通道**。所以渐变贴图必须是 256×1 的灰度，
      做成 1×256 或彩色分档都会退化成一片平坦的明暗。
   2. Material 把主题写在 <body data-md-color-scheme>，监听这个属性即可实时换色。

   与阶段 1 的衔接：几何完全不动，只换材质与光照。所有材质在这里集中创建并复用，
   主题切换时只改 color / emissive / 分档数据，不重建任何几何。
   ============================================================= */

const RAMP_WIDTH = 256;
// 分档明度取自第 9.4 节示例色 (#1b2434 / #39445a / #8a93a6 / #e8edf5) 的相对明度；
// 白天用同一套分档整体向白提亮，对应第 4.3 节的「阴天亮灰蓝天光」
const RAMP_NIGHT = [0.14, 0.28, 0.59, 0.93];
const RAMP_DAY = [0.62, 0.71, 0.84, 0.97];

const FALLBACK = {
  sky1: "#bcc9d9",
  sky2: "#d3dde8",
  sky3: "#eaf0f6",
  ground1: "#b7c3d2",
  card: "#ffffff",
  line: "#dfe4ff",
  outline: "#2b3446",
  shop: "rgb(255, 180, 102)"
};

/* rgba() 里的 alpha 会被 three 记一条 console.warn，这里先自己剥掉 */
function cssColor(value, fallback) {
  const raw = value && String(value).trim() ? String(value).trim() : fallback;
  const m = /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,[^)]*\)$/i.exec(raw);
  if (m) return "rgb(" + m[1] + ", " + m[2] + ", " + m[3] + ")";
  return raw;
}

function alphaOf(value, fallback) {
  const m = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(String(value || ""));
  return m ? parseFloat(m[1]) : fallback;
}

function shade(color, factor) {
  return color.clone().multiplyScalar(factor);
}

function mix(a, b, t) {
  return a.clone().lerp(b, t);
}

/* ---------- 分档贴图（256×1 / NearestFilter / 灰度） ---------- */
function createRamp(THREE, bands) {
  const texture = new THREE.DataTexture(new Uint8Array(RAMP_WIDTH * 4), RAMP_WIDTH, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  writeRamp(texture, bands);
  return texture;
}

function writeRamp(texture, bands) {
  const data = texture.image.data;
  const span = RAMP_WIDTH / bands.length;
  for (let i = 0; i < RAMP_WIDTH; i++) {
    const band = bands[Math.min(bands.length - 1, Math.floor(i / span))];
    const level = Math.round(band * 255);
    data[i * 4] = level;
    data[i * 4 + 1] = level;
    data[i * 4 + 2] = level;
    data[i * 4 + 3] = 255;
  }
  texture.needsUpdate = true;
}

/* ---------- 天空渐变（CanvasTexture，1×256 竖直渐变） ---------- */
export function createSky(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  function update(tokens) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, cssColor(tokens.sky1, FALLBACK.sky1));
    gradient.addColorStop(0.55, cssColor(tokens.sky2, FALLBACK.sky2));
    gradient.addColorStop(1, cssColor(tokens.sky3, FALLBACK.sky3));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    texture.needsUpdate = true;
  }

  return {
    texture: texture,
    update: update,
    dispose: function () { texture.dispose(); }
  };
}

/* ---------- 材质库 ----------
   textures 来自 canvas-textures.mjs（阶段 4）；缺省时退化为无贴图的素色材质，
   保证任何一半加载失败都不会让首页白屏。 */
export function createMaterialLibrary(THREE, textures) {
  const ramp = createRamp(THREE, RAMP_DAY);
  const outlineGeometries = [];
  const materials = [];
  const decals = []; // 需要跟随主题调明暗的贴片材质

  function toon(color) {
    const material = new THREE.MeshToonMaterial({ color: color, gradientMap: ramp });
    materials.push(material);
    return material;
  }

  const set = {
    base: toon("#96a0ac"),
    road: toon("#a5afbd"),
    sidewalk: toon("#d1deef"),
    curb: toon("#dfe4ff"),
    trim: toon("#7d8388"),
    fixture: toon("#ece7dd"),  // 店内货架 / 柜台等固装（阶段 3）
    emissive: toon("#ffe3bd"), // 门头招牌与路灯灯头共用一份
    cool: new THREE.MeshToonMaterial({
      color: "#eaf6ff",
      gradientMap: ramp,
      emissive: new THREE.Color("#9fd8ff"),
      emissiveIntensity: 0.4
    }),
    // 店内内衬：BackSide 的倒扣房间。夜景时室外是深蓝、店内是暖白，
    // 这层就是「冷暖对比」里暖的那一半；不画描边，避免出现房间棱线。
    interior: new THREE.MeshToonMaterial({
      color: "#f7efe2",
      gradientMap: ramp,
      side: THREE.BackSide
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#eaf0f6",
      transparent: true,
      opacity: 0.34,
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.3,
      side: THREE.DoubleSide
    }),
    // 店招：贴图既当颜色贴图也当自发光贴图，白天弱、夜里强（第 14.6 节）
    sign: new THREE.MeshToonMaterial({
      color: "#ffffff",
      gradientMap: ramp,
      map: textures ? textures.sign : null,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: textures ? textures.sign : null,
      emissiveIntensity: 0.5
    }),
    roadSign: new THREE.MeshToonMaterial({
      color: "#ffffff",
      gradientMap: ramp,
      map: textures ? textures.roadSign : null,
      emissive: new THREE.Color("#ffffff"),
      emissiveMap: textures ? textures.roadSign : null,
      emissiveIntensity: 0.2
    }),
    // 远处信号灯的三盏灯：颜色固定，亮度由 animation-loop 的循环逐帧驱动
    signalRed: new THREE.MeshToonMaterial({
      color: "#ff6b6b",
      gradientMap: ramp,
      emissive: new THREE.Color("#ff3b3b"),
      emissiveIntensity: 0.08
    }),
    signalAmber: new THREE.MeshToonMaterial({
      color: "#ffd166",
      gradientMap: ramp,
      emissive: new THREE.Color("#ffb703"),
      emissiveIntensity: 0.08
    }),
    signalGreen: new THREE.MeshToonMaterial({
      color: "#7bd88f",
      gradientMap: ramp,
      emissive: new THREE.Color("#37b24d"),
      emissiveIntensity: 0.08
    }),
    /* ---- 阶段 8–11 材质拆分（方案 §4.1.1）----
       原 building 一人分饰五角 → 按色彩角色拆开；
       building 暂保留兜底（可能仍有旧调用点），后续集成移除。 */
    facade: toon("#f4efe4"),     // 店面主墙体：暖奶油
    facadeBand: toon("#c5d2e0"), // 墙裙分色带：雾蓝
    roof: toon("#9aa6b5"),       // 店屋顶 + 雨棚上表面：石板
    neighbor: toon("#b7c3d2"),   // 邻栋：蓝灰
    neighborWin: new THREE.MeshToonMaterial({ // 邻栋窗格：一张图白天当固有色、夜里当灯箱
      color: "#ffffff",
      gradientMap: ramp,
      map: textures ? textures.windowGrid : null,
      emissive: new THREE.Color("#ffd9a8"),
      emissiveMap: textures ? textures.windowGrid : null,
      emissiveIntensity: 0
    }),
    // 阶段 9：樱花树
    trunk: toon("#6b4a3b"),
    blossom: new THREE.MeshToonMaterial({
      color: "#f6b6c2",
      gradientMap: ramp,
      emissive: new THREE.Color("#f6b6c2"),
      emissiveIntensity: 0
    }),
    // 阶段 10：轨道电车
    tramBody: toon("#f2e8d8"),
    tramStripe: new THREE.MeshToonMaterial({
      color: "#1d4e89",
      gradientMap: ramp,
      emissive: new THREE.Color("#1d4e89"),
      emissiveIntensity: 0.05
    }),
    tramGlass: new THREE.MeshToonMaterial({
      color: "#eaf0f6",
      gradientMap: ramp,
      emissive: new THREE.Color("#ffe3bd"),
      emissiveIntensity: 0.25
    }),
    tramLamp: new THREE.MeshToonMaterial({
      color: "#ffe3bd",
      gradientMap: ramp,
      emissive: new THREE.Color("#ffd9a8"),
      emissiveIntensity: 0.3
    }),
    rail: toon("#5b6472"),
    // 阶段 11：远景天际线（不吃光、无描边，颜色/透明度读 --nmd-city）
    skyline: new THREE.MeshBasicMaterial({
      color: "#3e5270",
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    })
  };
  materials.push(set.cool, set.interior, set.glass, set.sign, set.roadSign,
    set.signalRed, set.signalAmber, set.signalGreen,
    set.neighborWin, set.blossom, set.tramStripe, set.tramGlass, set.tramLamp,
    set.skyline);

  // 店面侧墙/后墙淡砖缝：repeat(4,2)，空贴图库时静默跳过
  if (textures && textures.facadeTile) {
    textures.facadeTile.repeat.set(4, 2);
    set.facade.map = textures.facadeTile;
    set.facade.needsUpdate = true;
  }

  /* 贴片材质工厂（海报、价签、地面标线）：MeshBasicMaterial 不受光照影响，
     直接按主题给一个亮度倍数——白天 1、夜里按 nightDim 压暗。 */
  function decal(texture, options) {
    const config = options || {};
    const transparent = config.transparent !== false;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: transparent,
      depthWrite: !transparent,
      side: config.side || THREE.FrontSide,
      color: "#ffffff"
    });
    material.userData.nightDim = typeof config.nightDim === "number" ? config.nightDim : 0.85;
    materials.push(material);
    decals.push(material);
    return material;
  }

  const outlineMaterial = new THREE.LineBasicMaterial({ color: "#2b3446", transparent: true, opacity: 0.92 });
  const shellMaterial = new THREE.MeshBasicMaterial({ color: "#2b3446", side: THREE.BackSide });
  materials.push(outlineMaterial, shellMaterial);

  /** 方盒子等硬边物体：EdgesGeometry + LineSegments（第 4.2 节优先方案 1） */
  function outline(mesh, thresholdAngle) {
    const geometry = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle || 24);
    outlineGeometries.push(geometry);
    const lines = new THREE.LineSegments(geometry, outlineMaterial);
    mesh.add(lines);
    return lines;
  }

  /** 圆润物体：背面放大外壳法（第 4.2 节优先方案 2，用于圆柱类） */
  function outlineShell(mesh, scale) {
    const shell = new THREE.Mesh(mesh.geometry, shellMaterial);
    shell.scale.setScalar(scale || 1.07);
    mesh.add(shell);
    return shell;
  }

  /* 主题切换时重算颜色与分档；几何、材质数量都不变 */
  function update(tokens) {
    const dark = tokens.scheme === "slate";
    const ground = new THREE.Color(cssColor(tokens.ground1, FALLBACK.ground1));
    const card = new THREE.Color(cssColor(tokens.card, FALLBACK.card));
    const outlineColor = new THREE.Color(cssColor(tokens.outline, FALLBACK.outline));
    const shop = new THREE.Color(cssColor(tokens.shop, FALLBACK.shop));

    writeRamp(ramp, dark ? RAMP_NIGHT : RAMP_DAY);

    if (dark) {
      /* 夜晚雨天（第 4.3 节夜景表：地面与建筑用 #2b3446 / #3a4458）。
         CSS 降级层的 --nmd-ground-* 是给雨景渐变用的近黑（#0b1120 一带），
         直接当反照率会让店内暖光「没有东西可反射」，整屏发死黑；
         这里把 token 朝设计稿的夜景基色抬一档，几何与构图完全不变。 */
      const nightBase = new THREE.Color("#2b3446");
      const nightLift = new THREE.Color("#3a4458");
      set.base.color.copy(mix(ground, nightBase, 0.75));
      set.road.color.copy(mix(ground, nightBase, 0.6));
      set.sidewalk.color.copy(mix(ground, nightLift, 0.8));
      set.curb.color.copy(mix(ground, nightLift, 0.7));
      set.trim.color.copy(mix(card, outlineColor, 0.35));
      set.interior.color.set("#f3e5cd"); // 店内暖白，夜里由暖色点光点亮
      set.fixture.color.set("#e4ded0");
      // 阶段 8 分色（方案 §4.1.1 夜列）：暗夜 facade 保留 12% 暖底
      set.facade.color.copy(mix(card, nightLift, 0.72)).lerp(new THREE.Color("#5a4a42"), 0.12);
      set.facadeBand.color.set("#2f3b52");
      set.roof.color.set("#39445a");
      set.neighbor.color.copy(mix(ground, nightBase, 0.7));
      set.neighborWin.emissiveIntensity = 0.55; // 夜里窗格当灯箱
      // 阶段 9/10
      set.trunk.color.set("#4a3226");
      set.blossom.color.set("#d9879b");
      set.blossom.emissiveIntensity = 0.15;
      set.tramBody.color.set("#cfc6b8");
      set.tramStripe.emissiveIntensity = 0.18;
      set.tramGlass.emissiveIntensity = 0.9;
      set.tramLamp.emissiveIntensity = 1.1;
      set.rail.color.set("#3c4454");
    } else {
      // 白天雨天：同一套地面 token 里用明度拉开底座 / 车行道 / 人行道的层次
      set.base.color.copy(shade(ground, 0.82));
      set.road.color.copy(shade(ground, 0.9));
      set.sidewalk.color.copy(shade(ground, 1.14));
      set.curb.color.set(cssColor(tokens.line, FALLBACK.line));
      set.trim.color.copy(mix(card, outlineColor, 0.55));
      set.interior.color.set("#f7efe2");
      set.fixture.color.set("#ece7dd");
      // 阶段 8 分色（方案 §4.1.1 日列）
      set.facade.color.set("#f4efe4");
      set.facadeBand.color.set("#c5d2e0");
      set.roof.color.set("#9aa6b5");
      set.neighbor.color.set("#b7c3d2");
      set.neighborWin.emissiveIntensity = 0; // 白天只靠 map 显示格线
      // 阶段 9/10
      set.trunk.color.set("#6b4a3b");
      set.blossom.color.set("#f6b6c2");
      set.blossom.emissiveIntensity = 0;
      set.tramBody.color.set("#f2e8d8");
      set.tramStripe.emissiveIntensity = 0.05;
      set.tramGlass.emissiveIntensity = 0.25;
      set.tramLamp.emissiveIntensity = 0.3;
      set.rail.color.set("#5b6472");
    }

    // 阶段 11：天际线读 --nmd-city（剥 alpha 当色，alpha 当透明度）
    set.skyline.color.set(cssColor(tokens.city, dark ? "rgb(120, 165, 255)" : "rgb(62, 82, 112)"));
    set.skyline.opacity = alphaOf(tokens.city, dark ? 0.12 : 0.2);

    // 招牌 / 灯头：白天低强度常亮，夜里抬成自发光焦点（第 4.3 节冷暖对比）
    set.emissive.color.copy(mix(shop, new THREE.Color("#ffffff"), 0.35));
    set.emissive.emissive.copy(shop);
    set.emissive.emissiveIntensity = dark ? 1.35 : 0.5;

    // 饮料柜灯箱：夜里更亮，和暖色店内拉开冷暖两个层次
    set.cool.emissiveIntensity = dark ? 0.95 : 0.4;

    set.glass.color.set(cssColor(tokens.sky3, FALLBACK.sky3));
    set.glass.opacity = dark ? 0.3 : 0.34;
    set.glass.roughness = dark ? 0.12 : 0.2;

    outlineMaterial.color.copy(outlineColor);
    shellMaterial.color.copy(outlineColor);

    // 店招 / 路牌：夜里自发光抬起来，白天压下去
    set.sign.emissiveIntensity = dark ? 1.2 : 0.5;
    set.roadSign.emissiveIntensity = dark ? 0.65 : 0.2;

    /* 阶段 5 的招牌闪烁（animation-loop.createAmbientEffects）围绕「当前主题的
       基准亮度」抖动，基准值必须在这里随主题刷新——否则切到夜景后闪烁会把
       emissiveIntensity 拉回白天的 0.5，店招在夜里就亮不起来了。
       阶段 10 电车呼吸灯同口径（方案 §4.3.4）。 */
    set.sign.userData.baseEmissiveIntensity = set.sign.emissiveIntensity;
    set.cool.userData.baseEmissiveIntensity = set.cool.emissiveIntensity;
    set.tramGlass.userData.baseEmissiveIntensity = set.tramGlass.emissiveIntensity;
    set.tramLamp.userData.baseEmissiveIntensity = set.tramLamp.emissiveIntensity;
    set.tramStripe.userData.baseEmissiveIntensity = set.tramStripe.emissiveIntensity;

    for (let i = 0; i < decals.length; i++) {
      const factor = dark ? decals[i].userData.nightDim : 1;
      decals[i].color.setScalar(factor);
    }
  }

  function dispose() {
    for (let i = 0; i < materials.length; i++) materials[i].dispose();
    for (let i = 0; i < outlineGeometries.length; i++) outlineGeometries[i].dispose();
    outlineGeometries.length = 0;
    materials.length = 0;
    ramp.dispose();
  }

  return {
    materials: set,
    textures: textures || null,
    decal: decal,
    outline: outline,
    outlineShell: outlineShell,
    update: update,
    dispose: dispose
  };
}

/* ---------- 灯光：冷色低强度环境光 + 店内暖色点光 + 街灯暖黄 ---------- */
export function createLighting(THREE, anchors) {
  const group = new THREE.Group();
  group.name = "nmd-lighting";

  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const key = new THREE.DirectionalLight(0xffffff, 1);
  key.position.set(4.5, 7, 3.5);
  group.add(hemi, key);

  const lampAnchor = (anchors && anchors.lamp) || [0, 3, 0];
  const lamp = new THREE.PointLight(0xffffff, 0, 5.6, 2);
  lamp.position.set(lampAnchor[0], lampAnchor[1], lampAnchor[2]);
  group.add(lamp);

  const shopLights = ((anchors && anchors.shop) || []).map(function (point) {
    // distance 收在 4.4m：three 的点光不做遮挡，靠距离限制把暖光留在店内
    const light = new THREE.PointLight(0xffffff, 0, 4.4, 2);
    light.position.set(point[0], point[1], point[2]);
    group.add(light);
    return light;
  });

  // 阶段 9：樱花树下地灯（方案 §4.2.2）——夜里低强度暖粉，让树仍是暖色主角
  const sakuraAnchor = anchors && anchors.sakura;
    const sakura = sakuraAnchor ? new THREE.PointLight(0xffffff, 0, 3.5, 2) : null;
  if (sakura) {
    sakura.position.set(sakuraAnchor[0], sakuraAnchor[1], sakuraAnchor[2]);
    group.add(sakura);
  }

  function update(tokens) {
    const dark = tokens.scheme === "slate";
    if (dark) {
      // 夜晚雨天：冷蓝低强度环境光 + 店内暖黄成为唯一强光源（第 4.3 节）
      hemi.color.set("#1d2a45");
      hemi.groundColor.set("#0b1120");
      hemi.intensity = 1.0;
      key.color.set("#9fc0ff");
      key.intensity = 0.8;
      for (let i = 0; i < shopLights.length; i++) {
        shopLights[i].color.set("#ffcf9e");
        shopLights[i].intensity = 3.2;
      }
      lamp.color.set("#ffc78a");
      lamp.intensity = 5;
      if (sakura) {
      sakura.color.set("#ffc2d4");
      sakura.intensity = 1.8;
      // 阶段 14（方案 §9）：树更高更远，distance 3.5 / intensity 1.8
      }
    } else {
      // 白天雨天：亮灰蓝天光为主，店内暖光仍然亮着
      hemi.color.set(cssColor(tokens.sky2, FALLBACK.sky2));
      hemi.groundColor.set(cssColor(tokens.ground1, FALLBACK.ground1));
      hemi.intensity = 1.6;
      key.color.set("#ffffff");
      key.intensity = 1.4;
      for (let i = 0; i < shopLights.length; i++) {
        shopLights[i].color.set("#ffd9a8");
        shopLights[i].intensity = 1.6;
      }
      lamp.color.set("#ffcf9e");
      lamp.intensity = 1.2;
      if (sakura) {
        sakura.color.set("#ffc2d4");
        sakura.intensity = 0;
      }
    }
  }

  return {
    group: group,
    update: update,
    dispose: function () { group.clear(); }
  };
}

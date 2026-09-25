/* =============================================================
   墨海寻珠 · 白盒街区搭建（阶段 1）
   设计文档：.documents/首页设计方案合集.md 第 2 节（总布局）、
             第 3 节（场景清单）、第 14.3 节（阶段 1 交付物）

   负责「几何」：底座、便利店体块、车行道与人行道、斑马线占位、
   路灯与电线杆的位置标记，以及各处的描边。

   材质与灯光不在这里创建：由 materials.mjs 统一提供（阶段 2 起），
   本模块只负责用它们摆几何、挂描边、报出灯光锚点。

   明确不在这里做的：
   - 街角道具与店内陈列 → 阶段 3（interior-builder.mjs）
   - 招牌文字、路面标线贴图 → 阶段 4（canvas-textures.mjs）
   - 雨、积水、门开合 → 阶段 5（rain-system.mjs）

   坐标约定：单位 ≈ 米；底座 7.2m 正方形，顶面在 y = 0，镜头从 +x/+z 方向看。
   ============================================================= */

const BASE = 7.2;          // 底座边长（§2.1）
const BASE_THICKNESS = 0.18;
const ROAD_Z0 = 1.9;       // 车行道近侧边界（沿 x 走向）
const SIDEWALK_Z0 = 0.6;   // 人行道近侧边界（贴着店面）
const SIDEWALK_TOP = 0.06; // 人行道比车行道高 6cm，形成路缘
const ROAD_TOP = 0.01;
const STORE = { x0: -1.0, x1: 3.0, z0: -2.6, z1: 0.6, h: 2.6, wall: 0.12 };
const NEIGHBOR = { x0: -3.6, x1: -1.6, z0: -3.6, z1: 0.6, h: 3.4 };
const EPS = 0.002;           // 2mm：共面脱开余量（方案 A/D/G 共用，见 .documents/首页Bug分析与修复.md）
const CURB_Z0 = ROAD_Z0 - 0.1; // 1.8：路缘后沿 = 人行道前沿（方案 G：人行道收 10cm 让路缘原位独立）

/** 灯光锚点：与几何同位，交给 materials.createLighting 使用（阶段 2） */
export const LIGHT_ANCHORS = {
  // 店内 3 盏暖色点光（第 10.2 节的 2–4 盏），贴着店内地面上方
  shop: [
    [0.0, 2.25, -1.6],
    [2.0, 2.25, -1.6],
    [1.0, 2.25, -0.4]
  ],
  // 街灯灯头（与下面的路灯几何同位置）
  lamp: [3.25, SIDEWALK_TOP + 2.78, 1.75 - 0.6],
  // 阶段 20（《樱花树搭建方案.md》）：樱花树迁至便利店后方靠右侧
  // 点光放在树冠前下方，夜里照亮冠底与店顶后段
  sakura: [2.0, 3.0, -2.2]
};

/** 阶段 20（《樱花树搭建方案.md》）：樱花树落位与树冠规格（供花瓣系统复用）。
 *  树干落在便利店后方靠右侧；树冠是一个「椭球」，在 prop:sakura 里按
 *  「1 中心 + 3 层环形 × 8 向 + 1 顶」铺出 26 颗花球 —— 8 向对称，冠大而茂盛、
 *  左右均匀，避免「只有半棵树」的不对称观感。 */
export const SAKURA = {
  x: 2.0,            // 树干 x：便利店右半侧后方
  z: -2.85,          // 树干 z：便利店后墙 z0 = -2.6 再往后 0.25m（避开墙厚与描边）
  trunkHeight: 3.6,  // 干高（干顶伸进树冠中心花球）
  trunkRadius: 0.14, // 干底半径（顶半径取一半）
  blobR: 0.55,       // 花球基础半径（实际半径 = blobR × scale）
  // 树冠椭球：中心 + 三轴半径（rx 冠宽 / ry 冠高 / rz 冠深）
  crown: { x: 2.0, y: 3.85, z: -2.5, rx: 1.0, ry: 0.9, rz: 0.55 },
  canopy: [2.0, 3.85, -2.5] // 花瓣发射盒中心 = 树冠中心
};

/** 屋檐滴水线（阶段 5）：雨丝从雨棚前缘滴到人行道上 */
export const DRIP_LINE = {
  x: [STORE.x0 + 0.25, STORE.x1 - 0.25],
  y: 1.93,
  z: STORE.z1 + 0.53
};

export const LAYOUT = {
  base: { size: BASE, thickness: BASE_THICKNESS },
  road: { z0: ROAD_Z0, z1: BASE / 2 - EPS },
  sidewalk: { z0: SIDEWALK_Z0, z1: CURB_Z0, top: SIDEWALK_TOP },
  store: STORE,
  neighbor: NEIGHBOR
};

/**
 * 搭出街区几何。
 * @param {object} THREE 由入口模块传入的 three 命名空间（避免重复加载）
 * @param {object} library materials.mjs 的材质库（提供 materials / outline / outlineShell）
 * @returns {{ group: object, dispose: Function }}
 */
export function buildScene(THREE, library) {
  const group = new THREE.Group();
  group.name = "nmd-blockout";

  const geometries = [];
  const mats = library.materials;
  let target = group; // 当前挂载父节点：每件街角道具一个具名子组，便于验收时逐件隐藏/统计

  function withGroup(name, build) {
    const part = new THREE.Group();
    part.name = name;
    target.add(part);
    const previous = target;
    target = part;
    build();
    target = previous;
  }

  function box(w, h, d, cx, cy, cz, mat, outlined) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(cx, cy, cz);
    // 描边默认关闭（阶段 8–12 draw call 预算 ≤180）：仅显式 outlined === true 的主轮廓描边
    if (outlined === true) library.outline(mesh);
    target.add(mesh);
    return mesh;
  }

  // 按「顶面高度」摆放薄板：路面、人行道、底板这类都用它
  function slab(w, d, cx, cz, top, thickness, mat, outlined) {
    return box(w, thickness, d, cx, top - thickness / 2, cz, mat, outlined);
  }

  // 贴图平面：平躺（地面标线）与竖直（店招/海报/标签）两种
  function plane(w, h) {
    const geometry = new THREE.PlaneGeometry(w, h);
    geometries.push(geometry);
    return geometry;
  }

  function flatPlane(w, d, cx, cz, top, mat) {
    const mesh = new THREE.Mesh(plane(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(cx, top, cz);
    target.add(mesh);
    return mesh;
  }

  function uprightPlane(w, h, cx, cy, cz, mat) {
    const mesh = new THREE.Mesh(plane(w, h), mat);
    mesh.position.set(cx, cy, cz);
    target.add(mesh);
    return mesh;
  }

  function cylinder(radius, height, cx, cy, cz, mat, radialSegments) {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments || 10);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(cx, cy, cz);
    target.add(mesh);
    return mesh;
  }

  /* ---------- 1. 正方形底座（§2.1） ---------- */
  slab(BASE, BASE, 0, 0, 0, BASE_THICKNESS, mats.base);

  /* ---------- 2. 车行道与人行道（§2.2 街角转折、§2.3 前景/中景） ----------
     方案 G：三处几何脱开六组共面（.documents/首页Bug分析与修复.md §8）
     1) 人行道前沿收到 CURB_Z0=1.8，让路缘原位独立（顶/前/侧不再共面）；
     2) 路缘、车行道宽度缩 2*EPS，脱开底座侧面 x=±3.6；
     3) 车行道前沿收 EPS，脱开底座前面 z=3.6。 */
  const roadDepth = BASE / 2 - EPS - ROAD_Z0;
  slab(BASE - EPS * 2, roadDepth, 0, (ROAD_Z0 + BASE / 2 - EPS) / 2,
    ROAD_TOP, 0.02, mats.road);

  const walkDepth = CURB_Z0 - SIDEWALK_Z0;
  slab(BASE, walkDepth, 0, (SIDEWALK_Z0 + CURB_Z0) / 2, SIDEWALK_TOP, SIDEWALK_TOP, mats.sidewalk);
  // 路缘：人行道临车行道的一条窄边（原位不动，宽缩 2mm 脱开底座侧面）
  box(BASE - EPS * 2, 0.08, 0.1, 0, SIDEWALK_TOP - 0.04, ROAD_Z0 - 0.05, mats.curb);

  /* 地面标线（阶段 4）：斑马线 / 停车位 / 排水沟 / 人行道盲道，
     全部用平面叠 CanvasTexture，尺寸与画布宽高比一一对应（不变形） */
  if (library.textures) {
    flatPlane(1.6, 1.4, -1.30, 2.8, ROAD_TOP + 0.012,
      library.decal(library.textures.crosswalk, { nightDim: 0.78 }));
    flatPlane(2.0, 1.0, 1.3, 2.75, ROAD_TOP + 0.012,
      library.decal(library.textures.parking, { nightDim: 0.78 }));
    // 排水沟沿路缘一条：靠贴图平铺，不用为 4m 长画一张超宽图。
    // 重复次数按「每格尽量正方形」取，避免格栅被横向拉伸
    library.textures.drain.repeat.set(22, 1);
    flatPlane(4.0, 0.18, 0, 1.98, ROAD_TOP + 0.014,
      library.decal(library.textures.drain, { transparent: false, nightDim: 0.7 }));
    // 人行道盲道：日式街道很典型的一条黄色点状引导带
    library.textures.tactile.repeat.set(15, 1);
    flatPlane(4.6, 0.3, 0.9, 1.5, SIDEWALK_TOP + 0.008,
      library.decal(library.textures.tactile, { transparent: false, nightDim: 0.85 }));
  }

  /* ---------- 3. 便利店体块（§2.2 面对镜头的主立面） ---------- */
  const storeW = STORE.x1 - STORE.x0;
  const storeD = STORE.z1 - STORE.z0;
  const storeCx = (STORE.x0 + STORE.x1) / 2;
  const storeCz = (STORE.z0 + STORE.z1) / 2;

  // 店内内衬：倒扣房间（BackSide），四面内墙 + 地面 + 天花一次成形。
  // 阶段 2 靠它承接店内暖光、和室外冷色形成冷暖对比；阶段 3 往里面摆货架。
  // EPS：内衬整体缩进 2mm，脱开外墙内表面（x0+wall / x1-wall / z0+wall）
  // 与底座顶面（y=0），消除镜头移动时的 Z-Fighting 闪烁。
  // EPS 常量定义在模块顶层（方案 A/D/G 共用）。
  // 详见 .documents/首页Bug分析与修复.md 方案 A。
  const roomZ0 = STORE.z0 + STORE.wall + EPS;
  const roomZ1 = STORE.z1 - 0.02;
  const roomH = STORE.h - 0.06;
  box(storeW - STORE.wall * 2 - EPS * 2, roomH, roomZ1 - roomZ0, storeCx,
    roomH / 2 + EPS,
    (roomZ0 + roomZ1) / 2, mats.interior, false);
  // 后墙、左右侧墙、屋顶：刻意留出面向 +z 的整面开口，阶段 3 往里面放货架
  // 阶段 8 分色（方案 §4.1.1）：墙体 → facade，屋顶板 → roof
  box(storeW, STORE.h, STORE.wall, storeCx, STORE.h / 2, STORE.z0 + STORE.wall / 2, mats.facade);
  box(STORE.wall, STORE.h, storeD, STORE.x0 + STORE.wall / 2, STORE.h / 2, storeCz, mats.facade);
  box(STORE.wall, STORE.h, storeD, STORE.x1 - STORE.wall / 2, STORE.h / 2, storeCz, mats.facade);
  slab(storeW, storeD, storeCx, storeCz, STORE.h + 0.16, 0.16, mats.roof);

  // 阶段 8 墙裙分色带（方案 §6.1）：+x 侧墙一条 0.55m 雾蓝裙带，无描边
  box(0.03, 0.55, storeD, STORE.x1 + 0.01, 0.275, storeCz, mats.facadeBand, false);
  // +z 正面裙带：设计稿 z1+0.01 会与玻璃(z=z1)、移门(z=z1+0.015) 共面相交，
  // 改放到店内侧、玻璃之后（z1-0.06..z1-0.03），读作下段实墙裙而不穿模
  box(storeW + 0.02, 0.55, 0.03, storeCx, 0.275, STORE.z1 - 0.045, mats.facadeBand, false);

  /* 店面竖向分层（自下而上）刻意压得比真实便利店矮一点：
     第 5.2 节「街角」机位是 (3.8,1.7,3.2) → (-0.2,1.3,-0.6)、fov 38 的仰视，
     层高再高一点，门头招牌就会被画面顶边切掉（阶段 4 要让招牌文字可读）。 */
  const glassBottom = 0.06;
  const glassH = 1.85;
  const glassTop = glassBottom + glassH;
  const frameTop = 0.14;

  /* 玻璃橱窗：中间留出 1.28m 的自动门开口，两侧是固定玻璃。
     两扇门是具名对象（door:left / door:right），阶段 5 由 animation-loop 滑动开合。 */
  const glassY = glassBottom + glassH / 2;
  const innerX0 = STORE.x0 + STORE.wall;
  const innerX1 = STORE.x1 - STORE.wall;
  const doorGap = 1.28;
  const fixedW = (innerX1 - innerX0 - doorGap) / 2;

  function glassPanel(w, cx, cz, name) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, glassH), mats.glass);
    geometries.push(mesh.geometry);
    mesh.position.set(cx, glassY, cz);
    if (name) mesh.name = name;
    target.add(mesh);
    return mesh;
  }

  glassPanel(fixedW, innerX0 + fixedW / 2, STORE.z1);
  glassPanel(fixedW, innerX1 - fixedW / 2, STORE.z1);
  glassPanel(doorGap / 2, storeCx - doorGap / 4, STORE.z1 + 0.015, "door:left");
  glassPanel(doorGap / 2, storeCx + doorGap / 4, STORE.z1 + 0.015, "door:right");

  // 门洞两侧竖梃（方案 E）：门扇比固定玻璃凸出 15mm，斜视时视线会从
  // 接缝（x = 0.36 / 1.64）的深度台阶"漏"进店内。竖梃占住台阶深度
  // z ∈ [z1, z1+0.013]，前表面比门扇 0.615 退 2mm，堵死侧向通道且不与门共面。
  // 详见 .documents/首页Bug分析与修复.md 方案 E（§7）。
  const MULLION_W = 0.03;
  const MULLION_D = 0.013;
  box(MULLION_W, glassH, MULLION_D, innerX0 + fixedW, glassY,
    STORE.z1 + MULLION_D / 2, mats.trim, false);
  box(MULLION_W, glassH, MULLION_D, innerX1 - fixedW, glassY,
    STORE.z1 + MULLION_D / 2, mats.trim, false);

  // storefront trim（横梁 + 左右竖门框）在 x 向各缩 2mm：它们与侧墙共用
  // x0..x0+wall / x1-wall..x1 区间，外侧面 x=x0/x1、内侧面 x=x0+wall/x1-wall
  // 会与外墙共面，镜头在街角↔橱窗机位间移动时立柱闪动（白/灰面片翻转 +
  // 墙/横梁描边黑线）。缩进后与墙各面拉开 2mm；重叠段本就埋在墙体内，外观无感。
  // 详见 .documents/首页Bug分析与修复.md 方案 D（§6）。
  box(storeW - EPS * 2, frameTop, 0.14, storeCx, glassTop + frameTop / 2, STORE.z1, mats.trim);
  // 左右竖门框不描边：描边线的后侧棱线落在 x0+wall / x1-wall 平面上，
  // 与侧墙内表面共面，镜头移动时会闪出两条黑边（描边 Z-Fighting）。
  box(STORE.wall - EPS * 2, glassH + frameTop, 0.14, STORE.x0 + STORE.wall / 2,
    glassBottom + (glassH + frameTop) / 2,
    STORE.z1, mats.trim, false);
  box(STORE.wall - EPS * 2, glassH + frameTop, 0.14, STORE.x1 - STORE.wall / 2,
    glassBottom + (glassH + frameTop) / 2,
    STORE.z1, mats.trim, false);

  // 门头招牌占位（阶段 4 换成 CanvasTexture 文字）+ 屋檐雨棚
  // 阶段 8：雨棚上表面改 roof 石板色（不再与墙体共用白材质）
  const awningY = glassTop + 0.07;
  box(storeW + 0.2, 0.1, 0.55, storeCx, awningY, STORE.z1 + 0.26, mats.roof);
  box(storeW, 0.38, 0.12, storeCx, awningY + 0.34, STORE.z1 + 0.07, mats.emissive);

  // 店招贴图：贴在招牌体块正面，3.96 × 0.37 对应画布 1024 × 96（10.7:1）
  if (library.textures) {
    uprightPlane(3.96, 0.37, storeCx, awningY + 0.34, STORE.z1 + 0.135, mats.sign).name = "sign:face";

    // 玻璃海报：三张，刻意避开「橱窗」机位的画面中心
    uprightPlane(0.44, 0.66, -0.5, 1.15, STORE.z1 + 0.012,
      library.decal(library.textures.posterNew, { transparent: false, nightDim: 0.95 }));
    uprightPlane(0.44, 0.66, 2.05, 1.15, STORE.z1 + 0.012,
      library.decal(library.textures.posterSale, { transparent: false, nightDim: 0.95 }));
    uprightPlane(0.44, 0.66, 2.58, 1.15, STORE.z1 + 0.012,
      library.decal(library.textures.posterDrink, { transparent: false, nightDim: 0.95 }));
  }

  /* ---------- 4. 邻栋 + 小巷入口（§2.2 左后方保留狭窄小巷） ---------- */
  const neighborW = NEIGHBOR.x1 - NEIGHBOR.x0;
  const neighborD = NEIGHBOR.z1 - NEIGHBOR.z0;
  // 阶段 8：邻栋改蓝灰 neighbor 材质，并朝镜头两面贴窗格（夜里透灯）
  box(neighborW, NEIGHBOR.h, neighborD,
    (NEIGHBOR.x0 + NEIGHBOR.x1) / 2, NEIGHBOR.h / 2,
    (NEIGHBOR.z0 + NEIGHBOR.z1) / 2, mats.neighbor);
  if (library.textures) {
    uprightPlane(neighborW - 0.3, NEIGHBOR.h - 0.5,
      (NEIGHBOR.x0 + NEIGHBOR.x1) / 2, NEIGHBOR.h / 2 + 0.1,
      NEIGHBOR.z1 + 0.01, mats.neighborWin);
    uprightPlane(neighborD - 0.3, NEIGHBOR.h - 0.5,
      NEIGHBOR.x1 + 0.01, NEIGHBOR.h / 2 + 0.1,
      (NEIGHBOR.z0 + NEIGHBOR.z1) / 2, mats.neighborWin)
      .rotation.y = Math.PI / 2;
  }
  // 邻栋靠巷口的一侧压一条深色竖边，让 0.6m 宽的小巷在远处也能被认出来
  box(0.08, NEIGHBOR.h, 0.12, NEIGHBOR.x1 + 0.04, NEIGHBOR.h / 2, NEIGHBOR.z1 - 0.06, mats.trim);

  /* ---------- 5. 路灯与电线杆（位置标记，实体细节留到阶段 3） ---------- */
  // 路灯：立在人行道靠右端、贴近底座外沿的位置。
  // 位置刻意避开第 5.1–5.3 节三个机位的视线：灯杆落在 (1.7, 1.35) 一带时，
  // 会正好插在「街角 / 橱窗」两个机位的画面正中，把便利店挡成一条竖线。
  cylinder(0.055, 2.9, 3.25, SIDEWALK_TOP + 1.45, 1.75, mats.trim, 8);
  box(0.08, 0.08, 0.62, 3.25, SIDEWALK_TOP + 2.86, 1.75 - 0.31, mats.trim);
  box(0.34, 0.12, 0.24, LIGHT_ANCHORS.lamp[0], LIGHT_ANCHORS.lamp[1],
    LIGHT_ANCHORS.lamp[2], mats.emissive);

  // 电线杆：立在巷口附近，两根横担标出电线走向
  cylinder(0.08, 3.6, -1.3, SIDEWALK_TOP + 1.8, 1.2, mats.trim, 8);
  box(0.9, 0.06, 0.06, -1.3, SIDEWALK_TOP + 3.2, 1.2, mats.trim);
  box(0.9, 0.06, 0.06, -1.3, SIDEWALK_TOP + 3.45, 1.2, mats.trim);

  /* ---------- 6. 街角道具（阶段 3，§3 场景清单·街角/街景） ----------
     位置同样按三个机位反推：道具要进「街角」画面，又不能挡住「橱窗」视线。
     细杆与成排小物件不逐个建 Mesh：细杆用两点连圆柱，成排用 InstancedMesh。 */

  function rod(a, b, radius, mat, segments) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const geometry = new THREE.CylinderGeometry(radius, radius, length, segments || 6);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx / length, dy / length, dz / length)
    );
    target.add(mesh);
    return mesh;
  }

  function instances(items, mat) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometries.push(geometry);
    const mesh = new THREE.InstancedMesh(geometry, mat, items.length);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    let colored = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      position.set(item.p[0], item.p[1], item.p[2]);
      scale.set(item.s[0], item.s[1], item.s[2]);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
      if (item.c) {
        color.set(item.c);
        mesh.setColorAt(i, color);
        colored = true;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (colored && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    target.add(mesh);
    return mesh;
  }

  // 自动贩卖机：贴在邻栋墙面下，进「街角」机位左侧，且不遮挡橱窗视线
  // 阶段 13：右移 0.52m 让开左迁后的电车（方案 §9）
  withGroup("prop:vending", function () {
  box(0.8, 1.9, 0.45, -1.68, SIDEWALK_TOP + 0.95, 0.85, mats.trim, true);
  box(0.7, 1.05, 0.06, -1.68, SIDEWALK_TOP + 1.25, 1.08, mats.cool, false);
  if (library.textures) {
    uprightPlane(0.66, 0.165, -1.68, SIDEWALK_TOP + 1.74, 1.115,
      library.decal(library.textures.vending, { transparent: false, nightDim: 0.92 }));
  }
  const vendingGoods = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      vendingGoods.push({
        p: [-1.94 + col * 0.175, SIDEWALK_TOP + 0.85 + row * 0.3, 1.1],
        s: [0.12, 0.22, 0.04],
        c: ["#ff8a5b", "#ffd166", "#8ecae6", "#b8e986", "#f7a1c4", "#7fd1c1"][(row + col) % 6]
      });
    }
  }
  instances(vendingGoods, mats.fixture);
  });

  // 自行车：圆柱 + 圆环拼剪影，停在店前人行道上当景深前景
  withGroup("prop:bicycle", function () {
  const wheelGeometry = new THREE.TorusGeometry(0.3, 0.022, 6, 18);
  geometries.push(wheelGeometry);
  [-0.45, 0.45].forEach(function (dx) {
    const wheel = new THREE.Mesh(wheelGeometry, mats.trim);
    wheel.position.set(1.0 + dx, SIDEWALK_TOP + 0.3, 1.3);
    target.add(wheel);
  });
  const bikeY = SIDEWALK_TOP;
  rod([0.55, bikeY + 0.3, 1.3], [1.05, bikeY + 0.62, 1.3], 0.022, mats.trim);
  rod([1.05, bikeY + 0.62, 1.3], [1.45, bikeY + 0.3, 1.3], 0.022, mats.trim);
  rod([0.55, bikeY + 0.3, 1.3], [1.15, bikeY + 0.3, 1.3], 0.022, mats.trim);
  rod([1.15, bikeY + 0.3, 1.3], [1.3, bikeY + 0.78, 1.3], 0.022, mats.trim);
  rod([1.3, bikeY + 0.78, 1.3], [1.3, bikeY + 0.92, 1.3], 0.02, mats.trim, 5); // 车把立管
  box(0.34, 0.05, 0.05, 1.3, bikeY + 0.92, 1.3, mats.trim, false); // 车把
  box(0.22, 0.06, 0.12, 0.75, bikeY + 0.78, 1.3, mats.trim, false); // 车座
  box(0.26, 0.2, 0.3, 1.0, bikeY + 0.72, 1.3, mats.trim, false);    // 车筐
  });

  // 雨伞架：店门口左手边的小圆筒 + 几把伞
  withGroup("prop:umbrella", function () {
  cylinder(0.13, 0.55, -0.75, SIDEWALK_TOP + 0.28, 0.85, mats.trim, 10);
  [[-0.05, 0.12], [0.06, -0.08], [0.02, 0.14]].forEach(function (offset, i) {
    rod([-0.75 + offset[0], SIDEWALK_TOP + 0.3, 0.85 + offset[1]],
      [-0.75 + offset[0] * 2.6, SIDEWALK_TOP + 0.92 + i * 0.05, 0.85 + offset[1] * 2.6],
      0.018, mats.trim, 5);
  });
  });

  // 垃圾桶：店门右侧，进「街角」画面右下角
  // 阶段 10：原 x=2.75 正压电车轨道，移到灯杆与店墙之间（方案 §4.3.2）
  withGroup("prop:bin", function () {
  box(0.42, 0.72, 0.42, 3.32, SIDEWALK_TOP + 0.36, 0.95, mats.fixture, true);
  box(0.46, 0.06, 0.46, 3.32, SIDEWALK_TOP + 0.75, 0.95, mats.trim, false);
  });

  // 路牌：斑马线旁的立杆 + 面板
  withGroup("prop:sign", function () {
  cylinder(0.03, 2.2, -1.9, SIDEWALK_TOP + 1.1, 1.55, mats.trim, 8);
  box(0.55, 0.4, 0.05, -1.9, SIDEWALK_TOP + 2.02, 1.55, mats.fixture, true);
  if (library.textures) {
    uprightPlane(0.52, 0.37, -1.9, SIDEWALK_TOP + 2.02, 1.58, mats.roadSign);
  }
  });

  // 远处交通信号灯：三盏灯的颜色固定在材质里，亮度由 animation-loop 循环切换
  // 阶段 13：x −3.2 → −2.15，配对右移后的斑马线、让开左轨（方案 §9）
  withGroup("prop:signal", function () {
    cylinder(0.045, 2.5, -2.15, SIDEWALK_TOP + 1.25, 3.42, mats.trim, 8);
    box(0.24, 0.68, 0.18, -2.15, SIDEWALK_TOP + 2.34, 3.42, mats.trim, false);
    [
      { name: "signal:red", y: 2.58, mat: mats.signalRed },
      { name: "signal:amber", y: 2.34, mat: mats.signalAmber },
      { name: "signal:green", y: 2.10, mat: mats.signalGreen }
    ].forEach(function (lamp) {
      const mesh = box(0.15, 0.15, 0.06, -2.15, SIDEWALK_TOP + lamp.y, 3.5, lamp.mat, false);
      mesh.name = lamp.name;
    });
  });

  // 护栏：立柱走实例化，横杆两根，沿人行道临车行道一侧
  // 阶段 10：立柱 5→4、横杆缩到 x≤1.475，右端让开左轨 2.27（方案 §4.3.2）
  withGroup("prop:rail", function () {
  const railPosts = [];
  for (let i = 0; i < 4; i++) {
    railPosts.push({ p: [-1.2 + i * 0.85, SIDEWALK_TOP + 0.43, 1.74], s: [0.07, 0.86, 0.07] });
  }
  instances(railPosts, mats.trim);
  box(2.65, 0.06, 0.06, 0.15, SIDEWALK_TOP + 0.82, 1.74, mats.trim, false);
  box(2.65, 0.05, 0.05, 0.15, SIDEWALK_TOP + 0.5, 1.74, mats.trim, false);
  });

  // 电线：从电线杆顶沿街拉三段，用 TubeGeometry 做出垂坠
  withGroup("prop:wire", function () {
  function wire(a, b, sag) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(a[0], a[1], a[2]),
      new THREE.Vector3((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - sag, (a[2] + b[2]) / 2),
      new THREE.Vector3(b[0], b[1], b[2])
    ]);
    const geometry = new THREE.TubeGeometry(curve, 14, 0.012, 4, false);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mats.trim);
    target.add(mesh);
    return mesh;
  }
  // 收在底座范围内（第 15 节：所有元素都位于底座之上），别让线头飘出 7.2m 的台面
  wire([-1.3, SIDEWALK_TOP + 3.45, 1.2], [3.56, SIDEWALK_TOP + 3.2, 2.34], 0.18);
  wire([-1.3, SIDEWALK_TOP + 3.2, 1.2], [3.56, SIDEWALK_TOP + 3.0, 2.14], 0.16);
  wire([-1.3, SIDEWALK_TOP + 3.32, 1.2], [-1.0, SIDEWALK_TOP + 2.72, 0.62], 0.06);
  });

  /* ---------- 7. 樱花树（阶段 20，《樱花树搭建方案.md》） ----------
     便利店后方靠右侧 (2.0, -2.85)：树冠按「1 中心 + 3 层环形 × 8 向 + 1 顶」
     在椭球内铺 26 颗花球，8 向对称 → 冠大、茂盛、左右均匀，避免「只有半棵树」。
     花瓣发射盒与灯锚点见 SAKURA.canopy / LIGHT_ANCHORS.sakura。 */
  withGroup("prop:sakura", function () {
    const S = SAKURA, C = S.crown, GROUND = 0;

    // 主干：下粗上细，干顶直接伸进树冠中心花球（不露秃头）
    const trunkGeo = new THREE.CylinderGeometry(S.trunkRadius * 0.5, S.trunkRadius, S.trunkHeight, 8);
    geometries.push(trunkGeo);
    const trunk = new THREE.Mesh(trunkGeo, mats.trunk);
    trunk.position.set(S.x, GROUND + S.trunkHeight / 2, S.z);
    target.add(trunk);

    // 树冠花球表：中心 + 3 层环形（每层 8 向，绕 y 均匀分布）+ 顶。
    // 8 向对称保证左右/前后均匀；椭圆三轴 rx/ry/rz 决定冠宽/冠高/冠深。
    const blobs = [];
    blobs.push([C.x, C.y, C.z, 1.15]); // 中心（包住干顶）
    [
      { fy: -0.35, k: 0.90, s: 0.95 },
      { fy: 0.00, k: 1.00, s: 1.00 },
      { fy: 0.32, k: 0.78, s: 0.90 }
    ].forEach(function (ring) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        blobs.push([
          C.x + Math.cos(a) * C.rx * ring.k,
          C.y + ring.fy * C.ry,
          C.z + Math.sin(a) * C.rz * ring.k,
          ring.s
        ]);
      }
    });
    blobs.push([C.x, C.y + 0.50 * C.ry, C.z, 0.82]); // 冠顶

    // 3 根短枝：把干顶接到树冠下沿（只做结构过渡，重点在冠不在枝）。
    // 端点仍由目标花球中心反推（拉到 0.55r 处），保证枝端埋在花球内。
    function branchTip(blob, k) {
      const r = S.blobR * blob[3];
      const bx = S.x, by = S.trunkHeight - 0.25, bz = S.z;
      const dx = bx - blob[0], dy = by - blob[1], dz = bz - blob[2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const g = r * k / len;
      return [blob[0] + dx * g, blob[1] + dy * g, blob[2] + dz * g];
    }
    // 下环（blobs[1..8]）里朝店顶方向的三颗：45° / 90° / 135°
    [[2, 0.045], [3, 0.045], [4, 0.040]].forEach(function (spec) {
      rod([S.x, S.trunkHeight - 0.25, S.z], branchTip(blobs[spec[0]], 0.55),
        spec[1], mats.trunk, 6);
    });

    // 树冠：26 颗二十面体团块 → 1 个 InstancedMesh
    const blobGeo = new THREE.IcosahedronGeometry(S.blobR, 1);
    geometries.push(blobGeo);
    const canopy = new THREE.InstancedMesh(blobGeo, mats.blossom, blobs.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(),
      p = new THREE.Vector3(), s = new THREE.Vector3(),
      eul = new THREE.Euler();
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const rnd = (i * 2654435761 % 1000) / 1000; // 确定性伪随机，截图可复现
      p.set(b[0], b[1], b[2]);
      eul.set(0, rnd * Math.PI * 2, 0);
      q.setFromEuler(eul);
      s.setScalar(b[3]);
      m.compose(p, q, s);
      canopy.setMatrixAt(i, m);
    }
    canopy.instanceMatrix.needsUpdate = true;
    target.add(canopy);

    // 树池：环 + 泥土片（外径 0.235，在便利店后墙 z=-2.6 之外，不压墙、不越底座）
    const ringGeo = new THREE.TorusGeometry(0.2, 0.035, 6, 20);
    geometries.push(ringGeo);
    const ring = new THREE.Mesh(ringGeo, mats.trim);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(S.x, GROUND + 0.01, S.z);
    target.add(ring);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), mats.trim);
    geometries.push(soil.geometry);
    soil.rotation.x = -Math.PI / 2;
    soil.position.set(S.x, GROUND + 0.008, S.z);
    target.add(soil);

    // 静止落瓣 7 片 → 1 InstancedMesh（夜里 nightDim 0.9；贴在干周，不越入店体）
    if (library.textures && library.textures.petal) {
      const petalGeo = new THREE.PlaneGeometry(0.06, 0.06);
      geometries.push(petalGeo);
      const petalMat = library.decal(library.textures.petal, { nightDim: 0.9 });
      const petalMesh = new THREE.InstancedMesh(petalGeo, petalMat, 7);
      const pm = new THREE.Matrix4();
      const pq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      const ps = new THREE.Vector3(1, 1, 1);
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9;
        pm.compose(
          new THREE.Vector3(
            S.x + Math.cos(a) * 0.2,
            GROUND + 0.012,
            S.z + Math.sin(a) * 0.2
          ),
          pq,
          ps
        );
        petalMesh.setMatrixAt(i, pm);
      }
      petalMesh.instanceMatrix.needsUpdate = true;
      target.add(petalMesh);
    }

    // 地灯（夜里亮，配合 LIGHT_ANCHORS.sakura 点光）
    box(0.07, 0.14, 0.07, S.x + 0.38, GROUND + 0.07, S.z + 0.1, mats.emissive, false);
  });

  /* ---------- 8. 轨道电车（阶段 13，方案 §9） ----------
     轨道中心 x=-2.55 沿 z：面对商店左侧、邻栋门前；停靠位中心 z=1.65 不变
     （车体完全在店外）。 */
  withGroup("prop:tram", function () {
    const TX = -2.55, TZ = 1.65, RY = ROAD_TOP;
    const TRACK_X = -2.55, GAUGE = 0.28;

    // 钢轨两根：从店前人行道沿 z 到底座边（避免伸进店面 z<0.6）
    [-GAUGE, GAUGE].forEach(function (dx) {
      box(0.05, 0.025, 2.98, TRACK_X + dx, RY + 0.012, 2.11, mats.rail, false);
    });

    // 枕木 10 块（阶段 13 修 z 越界：0.75..3.45 ≤ 底座 3.6），InstancedMesh
    const ties = [];
    for (let i = 0; i < 10; i++) {
      ties.push({ p: [TRACK_X, RY + 0.006, 0.75 + i * 0.25], s: [0.66, 0.02, 0.12] });
    }
    instances(ties, mats.trim);

    // 走行部 + 车轮（无描边，省 draw call）
    box(0.72, 0.14, 1.9, TX, RY + 0.11, TZ, mats.trim, false);
    [TZ - 0.6, TZ + 0.6].forEach(function (wz) {
      [-0.3, 0.3].forEach(function (wx) {
        const wheelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12);
        geometries.push(wheelGeo);
        const wheel = new THREE.Mesh(wheelGeo, mats.trim);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(TX + wx, RY + 0.14, wz);
        target.add(wheel);
      });
    });
    // 裙板（比车身宽 2cm → 蓝腰线）
    box(0.80, 0.18, 2.02, TX, RY + 0.27, TZ, mats.tramStripe, false);
    // 主车身（保留 1 条描边轮廓，预算内）
    box(0.78, 0.86, 2.0, TX, RY + 0.79, TZ, mats.tramBody, true);
    // 弧顶（半圆柱横放，平面向上；无描边）
    const roofGeo = new THREE.CylinderGeometry(0.39, 0.39, 2.0, 14, 1, false, 0, Math.PI);
    geometries.push(roofGeo);
    const tramRoof = new THREE.Mesh(roofGeo, mats.tramStripe);
    tramRoof.rotation.z = Math.PI / 2;
    tramRoof.rotation.y = Math.PI / 2;
    tramRoof.position.set(TX, RY + 1.22, TZ);
    target.add(tramRoof);
    // 空调盒 + 受电弓
    box(0.4, 0.1, 0.7, TX, RY + 1.5, TZ, mats.trim, false);
    rod([TX, RY + 1.55, TZ - 0.2], [TX, RY + 1.85, TZ + 0.1], 0.015, mats.trim, 5);
    rod([TX, RY + 1.85, TZ + 0.1], [TX, RY + 1.9, TZ + 0.35], 0.015, mats.trim, 5);

    // 侧窗 4 扇 × 2 侧 → 1 个 InstancedMesh（8 实例 1 call）
    const winGeo = new THREE.PlaneGeometry(0.38, 0.4);
    geometries.push(winGeo);
    const winMesh = new THREE.InstancedMesh(winGeo, mats.tramGlass, 8);
    const winM = new THREE.Matrix4();
    const winQ = new THREE.Quaternion();
    const winP = new THREE.Vector3();
    const winS = new THREE.Vector3(1, 1, 1);
    const winE = new THREE.Euler();
    let wi = 0;
    for (let i = 0; i < 4; i++) {
      const wz = TZ - 0.72 + i * 0.48;
      winE.set(0, Math.PI / 2, 0);
      winQ.setFromEuler(winE);
      winP.set(TX + 0.401, RY + 0.95, wz);
      winM.compose(winP, winQ, winS);
      winMesh.setMatrixAt(wi++, winM);
      winE.set(0, -Math.PI / 2, 0);
      winQ.setFromEuler(winE);
      winP.set(TX - 0.401, RY + 0.95, wz);
      winM.compose(winP, winQ, winS);
      winMesh.setMatrixAt(wi++, winM);
    }
    winMesh.instanceMatrix.needsUpdate = true;
    target.add(winMesh);
    // 车头大窗 + 头灯（朝 +z 路外沿）
    uprightPlane(0.6, 0.45, TX, RY + 1.0, TZ + 1.01, mats.tramGlass);
    // 头灯 2 → InstancedMesh
    const lampGeo = new THREE.CircleGeometry(0.06, 12);
    geometries.push(lampGeo);
    const lampMesh = new THREE.InstancedMesh(lampGeo, mats.tramLamp, 2);
    [-0.22, 0.22].forEach(function (dx, li) {
      const lm = new THREE.Matrix4();
      lm.setPosition(TX + dx, RY + 0.45, TZ + 1.015);
      lampMesh.setMatrixAt(li, lm);
    });
    lampMesh.instanceMatrix.needsUpdate = true;
    target.add(lampMesh);

    // 侧带文字（两面都贴，街角/全景各自能看到一侧）
    if (library.textures) {
      uprightPlane(1.9, 0.16, TX + 0.405, RY + 0.52, TZ,
        library.decal(library.textures.tramLivery, { nightDim: 0.85 }))
        .rotation.y = Math.PI / 2;
      uprightPlane(1.9, 0.16, TX - 0.405, RY + 0.52, TZ,
        library.decal(library.textures.tramLivery, { nightDim: 0.85 }))
        .rotation.y = -Math.PI / 2;
      // 车门缝（靠店 +x 面）
      uprightPlane(0.55, 1.1, TX + 0.403, RY + 0.8, TZ + 0.45,
        library.decal(library.textures.doorSeam || library.textures.posterNew,
          { transparent: false, nightDim: 0.9 }))
        .rotation.y = Math.PI / 2;
    }
  });

  /* ---------- 9. 背景天际线（阶段 11，方案 §4.4 / §6.4） ----------
     底座外 radius 8.5–11m 一圈远景楼宇剪影；颜色/透明度由 materials.update
     读 --nmd-city 驱动（mats.skyline），此处只摆几何，不吃光、无描边。 */
  (function buildSkyline() {
    const isNarrow = window.innerWidth < 900 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    const COUNT = isNarrow ? 16 : 32;
    const buildings = [];
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      const radius = 8.5 + ((i * 2654435761) % 100) / 100 * 2.5;
      const w = 0.8 + ((i * 40503) % 100) / 100 * 1.6;
      const h = 1.2 + ((i * 99991) % 100) / 100 * 3.4;
      buildings.push({
        p: [Math.cos(a) * radius, h / 2 - 0.4, Math.sin(a) * radius],
        s: [w, h, w * 0.8]
      });
    }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geometries.push(geo);
    const mesh = new THREE.InstancedMesh(geo, mats.skyline, buildings.length);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      matrix.compose(
        new THREE.Vector3(b.p[0], b.p[1], b.p[2]),
        new THREE.Quaternion(),
        new THREE.Vector3(b.s[0], b.s[1], b.s[2])
      );
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = "skyline";
    group.add(mesh);
  })();

  /* ---------- 10. 底座侧边色带（阶段 11，方案 §6.4） ----------
     底座立面外圈四条深色薄片 + 上缘一条暖橙细线，强化「手办地台」感。
     贴在底座外表面之外 5mm，避免与底座侧面共面 Z-Fighting。 */
  (function buildBaseBand() {
    const BAND_H = 0.06;
    const OUT = 0.005; // 比底座面外凸 5mm
    [0, 1, 2, 3].forEach(function (side) {
      const isZ = side < 2;
      const sign = side % 2 === 0 ? 1 : -1;
      const w = isZ ? BASE : 0.03;
      const d = isZ ? 0.03 : BASE;
      const px = isZ ? 0 : sign * (BASE / 2 - 0.015 + OUT);
      const pz = isZ ? sign * (BASE / 2 - 0.015 + OUT) : 0;
      box(w, BAND_H, d, px, -BASE_THICKNESS + BAND_H / 2, pz, mats.trim, false);
      box(isZ ? BASE : 0.032, 0.012, isZ ? 0.032 : BASE,
        px, -BASE_THICKNESS + BAND_H + 0.006, pz, mats.emissive, false);
    });
  })();

  function dispose() {
    for (let i = 0; i < geometries.length; i++) geometries[i].dispose();
    geometries.length = 0;
    group.clear();
  }

  return { group: group, dispose: dispose };
}

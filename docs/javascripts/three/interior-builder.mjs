/* =============================================================
   墨海寻珠 · 店内陈列（阶段 3）
   设计文档：.documents/首页设计方案合集.md 第 3 节（场景清单·室内）、
             第 5.3 节（橱窗机位要看清楚什么）、第 11 节（性能预算）、
             第 14.5 节（阶段 3 交付物）

   交付：货架、饮料柜（发光面）、便当区、收银台、关东煮柜台、后场门。
   约定：
   - 全部程序化几何，不引入外部模型；
   - 同类小物件（饮料、商品）走 InstancedMesh + 实例色，不逐个建 Mesh；
   - 只做「隔着玻璃看」的层次，细节密度低于门面：远处物件只保留剪影与色块；
   - 固装统一用 materials.mjs 的 fixture / cool / trim 等共享材质，不新增材质。

   房间范围（与 scene-builder 的营业执照一致）：x ∈ [-0.88, 2.88]、
   z ∈ [-2.48, 0.58]、y ∈ [0, 2.54]，玻璃面在 z = 0.58。
   ============================================================= */

const ROOM = { x0: -0.88, x1: 2.88, z0: -2.48, z1: 0.58, h: 2.54 };

const PRODUCT_COLORS = [
  "#ff8a5b", "#ffd166", "#8ecae6", "#b8e986", "#f7a1c4", "#c7b3ff", "#ffd6a5", "#7fd1c1"
];

/**
 * 搭出店内陈列。
 * @param {object} THREE 入口模块传入的 three 命名空间
 * @param {object} library materials.mjs 的材质库
 * @returns {{ group: object, dispose: Function, bounds: object }}
 */
export function buildInterior(THREE, library) {
  const group = new THREE.Group();
  group.name = "nmd-interior";
  const geometries = [];
  const mats = library.materials;
  let target = group; // 当前挂载父节点：每类固装一个具名子组，便于验收时逐件隐藏/统计

  function withPart(name, build) {
    const part = new THREE.Group();
    part.name = "interior:" + name;
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
    if (outlined) library.outline(mesh);
    target.add(mesh);
    return mesh;
  }

  function cylinder(radius, height, cx, cy, cz, mat, segments) {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, segments || 10);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(cx, cy, cz);
    target.add(mesh);
    return mesh;
  }

  // 竖直贴图平面：价签用，正对 +z（也就是正对橱窗外的相机）
  function tagPlane(w, h, cx, cy, cz, mat) {
    const geometry = new THREE.PlaneGeometry(w, h);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(cx, cy, cz);
    target.add(mesh);
    return mesh;
  }

  /* 单位立方体 + 逐实例缩放：小商品、护栏立柱这类成排物件都用它，
     一整排只占 1 个 draw call（第 11 节的性能预算） */
  function instances(items, material) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometries.push(geometry);
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
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

  /* ---------- 1. 饮料柜：左墙的发光灯箱 + 一排排饮料 ---------- */
  withPart("cooler", function () {
  box(0.5, 2.0, 0.9, -0.63, 1.0, -1.6, mats.fixture, true);
  box(0.05, 1.8, 0.82, -0.36, 1.06, -1.6, mats.cool, false); // 灯箱正面
  const bottles = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      bottles.push({
        p: [-0.33, 0.5 + row * 0.42, -1.95 + col * 0.175],
        s: [0.06, 0.2, 0.08],
        c: PRODUCT_COLORS[(row * 5 + col) % PRODUCT_COLORS.length]
      });
    }
  }
  instances(bottles, mats.fixture);
  });

  /* ---------- 2. 货架：中岛三层，商品成排 ---------- */
  withPart("shelf", function () {
  const gondolaX = 0.7;
  const gondolaZ = -1.5;
  box(1.6, 0.1, 0.5, gondolaX, 0.05, gondolaZ, mats.trim, true);
  box(0.06, 1.5, 0.5, gondolaX - 0.8, 0.75, gondolaZ, mats.trim, false);
  box(0.06, 1.5, 0.5, gondolaX + 0.8, 0.75, gondolaZ, mats.trim, false);
  const goods = [];
  for (let shelf = 0; shelf < 3; shelf++) {
    const y = 0.46 + shelf * 0.45;
    box(1.56, 0.05, 0.44, gondolaX, y, gondolaZ, mats.fixture, false);
    for (let i = 0; i < 6; i++) {
      goods.push({
        p: [gondolaX - 0.62 + i * 0.25, y + 0.1, gondolaZ],
        s: [0.16, 0.19, 0.3],
        c: PRODUCT_COLORS[(shelf * 6 + i) % PRODUCT_COLORS.length]
      });
    }
  }
  instances(goods, mats.fixture);

  // 层板前沿的价签（阶段 4）：0.14 × 0.07 对应画布 128 × 64
  if (library.textures) {
    const tags = [
      { texture: library.textures.priceA, x: 0.35, y: 0.53 },
      { texture: library.textures.priceB, x: 0.85, y: 0.98 },
      { texture: library.textures.priceC, x: 1.24, y: 1.43 }
    ];
    tags.forEach(function (item) {
      tagPlane(0.14, 0.07, item.x, item.y, gondolaZ + 0.23,
        library.decal(item.texture, { transparent: false, nightDim: 0.9 }));
    });
  }
  });

  /* ---------- 3. 便当区：后墙货架 + 顶部暖色灯带 ---------- */
  withPart("bento", function () {
  box(1.3, 1.05, 0.38, 1.0, 0.53, -2.28, mats.fixture, true);
  box(1.2, 0.06, 0.3, 1.0, 1.1, -2.26, mats.emissive, false); // 灯带
  const bento = [];
  for (let i = 0; i < 4; i++) {
    bento.push({
      p: [0.52 + i * 0.32, 0.72, -2.24],
      s: [0.26, 0.14, 0.24],
      c: ["#ffe0a3", "#ffd08a", "#f7c98c", "#ffe7bb"][i]
    });
  }
  instances(bento, mats.fixture);
  });

  /* ---------- 4. 收银台：柜台 + 收银机 + 小屏 ---------- */
  withPart("register", function () {
  box(1.0, 0.9, 0.5, 2.25, 0.45, -0.2, mats.fixture, true);
  box(0.34, 0.22, 0.3, 2.05, 1.01, -0.2, mats.trim, false);
  box(0.3, 0.2, 0.04, 2.05, 1.16, -0.36, mats.cool, false); // 收银小屏
  });

  /* ---------- 5. 关东煮柜台：柜台 + 暖色台面 + 几个锅 ---------- */
  withPart("oden", function () {
  box(0.9, 0.85, 0.55, 0.0, 0.42, -0.1, mats.fixture, true);
  box(0.74, 0.06, 0.4, 0.0, 0.88, -0.1, mats.emissive, false);
  for (let i = 0; i < 3; i++) {
    cylinder(0.1, 0.12, -0.26 + i * 0.26, 0.97, -0.1, mats.trim, 10);
  }
  });

  /* ---------- 6. 后场门：后墙上的一扇门 ---------- */
  withPart("backdoor", function () {
  box(0.8, 2.0, 0.06, 2.35, 1.0, -2.44, mats.trim, true);
  box(0.9, 2.1, 0.04, 2.35, 1.05, -2.46, mats.fixture, false);
  });

  function dispose() {
    for (let i = 0; i < geometries.length; i++) geometries[i].dispose();
    geometries.length = 0;
    group.clear();
  }

  return { group: group, dispose: dispose, bounds: ROOM };
}

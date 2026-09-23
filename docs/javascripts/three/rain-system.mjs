/* =============================================================
   墨海寻珠 · 雨与水的动效系统（阶段 5）
   设计文档：.documents/首页设计方案合集.md 第 3 节（氛围清单）、
             第 10.3 节（反射）、第 11 节（性能预算）、第 14.7 节（阶段 5 交付物）

   交付：
   - THREE.Points 雨滴 + 程序化雨滴贴图（竖直雨丝）
   - 屋檐滴水（InstancedMesh，少量实例）
   - 地面积水波纹（InstancedMesh + 加法混合，扩散即淡出）
   - 玻璃雨痕（CanvasTexture，逐帧滚动 UV）
   - 湿地面：桌面用 Reflector 真反射、移动端退化为低粗糙度湿面 + 高光条纹

   数量策略（第 14.7 节）：按视口宽度与 pointer 类型给档，
   桌面约 96 滴 / 移动约 54 滴；页面不可见时由主循环统一暂停。
   ============================================================= */

const RAIN_CENTER = [0.6, 3.4, 0.6];
const RAIN_AREA = [11, 7, 9];      // 雨区尺寸（x, y, z）
const RAIN_FALL = 9.5;             // 下落速度 m/s
const RAIN_DRIFT = 0.5;            // 侧向漂移 m/s
const RIPPLE_LIFE = 1.25;          // 波纹从出现到消失的秒数
const DRIP_FALL = 3.2;

/* 雨丝贴图：8×64 的竖直渐变条，比默认圆点更像雨 */
function dropTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(3, 0, 2, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* 玻璃雨痕贴图：竖直的断续水痕，逐帧滚动 UV 就是「雨水往下滑」 */
function glassStreakTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let seed = 7;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }

  for (let i = 0; i < 90; i++) {
    const x = random() * canvas.width;
    const top = random() * canvas.height * 0.7;
    const length = 30 + random() * 150;
    const width = 1 + random() * 2.2;
    const alpha = 0.08 + random() * 0.22;
    const gradient = ctx.createLinearGradient(0, top, 0, top + length);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255," + alpha.toFixed(2) + ")");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, top, width, length);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function parseColor(value, fallback) {
  const raw = value && String(value).trim() ? String(value).trim() : fallback;
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,[^)]*)?\)$/i.exec(raw);
  if (m) return "rgb(" + m[1] + ", " + m[2] + ", " + m[3] + ")";
  return raw;
}

function alphaOf(value, fallback) {
  const m = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(String(value || ""));
  return m ? parseFloat(m[1]) : fallback;
}

/**
 * 雨、屋檐滴水、地面积水波纹、玻璃雨痕。
 * @param {object} THREE 入口模块传入的 three 命名空间
 * @param {object} options { drip: {x:[min,max], y, z}, quality: {...} }
 */
export function createRainSystem(THREE, options) {
  const settings = options || {};
  const quality = settings.quality || {};
  const dripLine = settings.drip || { x: [-1.1, 3.1], y: 1.93, z: 1.13 };

  const group = new THREE.Group();
  group.name = "nmd-rain";
  const disposables = [];
  let elapsed = 0;

  /* ---------- 1. 雨滴：Points ---------- */
  const rainCount = quality.rain || 96;
  const rainTexture = dropTexture(THREE);
  disposables.push(rainTexture);
  const rainPositions = new Float32Array(rainCount * 3);
  const rainSpeed = new Float32Array(rainCount);
  const rainMaterial = new THREE.PointsMaterial({
    size: quality.rainSize || 0.22,
    sizeAttenuation: true,
    map: rainTexture,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    color: new THREE.Color("#4a648a")
  });
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = RAIN_CENTER[0] + (Math.random() - 0.5) * RAIN_AREA[0];
    rainPositions[i * 3 + 1] = Math.random() * RAIN_AREA[1];
    rainPositions[i * 3 + 2] = RAIN_CENTER[2] + (Math.random() - 0.5) * RAIN_AREA[2];
    rainSpeed[i] = 0.75 + Math.random() * 0.5;
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
  const rain = new THREE.Points(rainGeometry, rainMaterial);
  rain.name = "rain:points";
  group.add(rain);
  disposables.push(rainGeometry);

  /* ---------- 2. 屋檐滴水：少量实例 ---------- */
  const dripCount = quality.drips || 8;
  const dripGeometry = new THREE.BoxGeometry(0.022, 0.07, 0.022);
  const dripMaterial = new THREE.MeshBasicMaterial({ color: "#bcd4ea", transparent: true, opacity: 0.5 });
  const drips = new THREE.InstancedMesh(dripGeometry, dripMaterial, dripCount);
  drips.name = "rain:drips";
  const dripState = [];
  for (let i = 0; i < dripCount; i++) {
    dripState.push({
      x: dripLine.x[0] + Math.random() * (dripLine.x[1] - dripLine.x[0]),
      y: dripLine.y - Math.random() * (dripLine.y - 0.1)
    });
  }
  group.add(drips);
  disposables.push(dripGeometry, dripMaterial);

  /* ---------- 3. 地面积水波纹：环形实例，扩散同时淡出 ---------- */
  const rippleCount = quality.ripples || 12;
  const rippleGeometry = new THREE.RingGeometry(0.72, 1, 24);
  const rippleMaterial = new THREE.MeshBasicMaterial({
    color: "#ffffff",
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ripples = new THREE.InstancedMesh(rippleGeometry, rippleMaterial, rippleCount);
  ripples.name = "rain:ripples";
  const rippleState = [];
  const flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  for (let i = 0; i < rippleCount; i++) {
    rippleState.push({
      x: RAIN_CENTER[0] + (Math.random() - 0.5) * 6.4,
      z: 1.95 + Math.random() * 1.6,
      age: Math.random() * RIPPLE_LIFE,
      scale: 0.2
    });
  }
  group.add(ripples);
  disposables.push(rippleGeometry, rippleMaterial);

  /* ---------- 4. 玻璃雨痕：一张贴图 + UV 滚动 ---------- */
  const streakTexture = glassStreakTexture(THREE);
  disposables.push(streakTexture);
  const streakMaterial = new THREE.MeshBasicMaterial({
    map: streakTexture,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const streakGeometry = new THREE.PlaneGeometry(3.76, 1.85);
  const streaks = new THREE.Mesh(streakGeometry, streakMaterial);
  streaks.name = "rain:glass";
  streaks.position.set(1.0, 0.06 + 1.85 / 2, 0.606);
  group.add(streaks);
  disposables.push(streakGeometry, streakMaterial);

  /* ---------- 每帧更新 ---------- */
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();

  function update(dt, reducedMotion) {
    if (!(dt > 0)) return;
    elapsed += dt;

    if (reducedMotion) {
      // 减弱动效：雨变静态雨丝、波纹停住、雨痕不再下滑
      return;
    }

    // 雨：下落 + 侧向漂移，落到地面就从顶部循环
    const positions = rainGeometry.attributes.position.array;
    for (let i = 0; i < rainCount; i++) {
      const i3 = i * 3;
      positions[i3 + 1] -= RAIN_FALL * rainSpeed[i] * dt;
      positions[i3] += RAIN_DRIFT * dt;
      if (positions[i3 + 1] < 0.05) {
        positions[i3 + 1] = RAIN_AREA[1];
        positions[i3] = RAIN_CENTER[0] + (Math.random() - 0.5) * RAIN_AREA[0];
        positions[i3 + 2] = RAIN_CENTER[2] + (Math.random() - 0.5) * RAIN_AREA[2];
      } else if (positions[i3] > RAIN_CENTER[0] + RAIN_AREA[0] / 2) {
        positions[i3] -= RAIN_AREA[0];
      }
    }
    rainGeometry.attributes.position.needsUpdate = true;

    // 屋檐滴水
    for (let i = 0; i < dripCount; i++) {
      const state = dripState[i];
      state.y -= DRIP_FALL * dt;
      if (state.y < 0.06) {
        state.y = dripLine.y;
        state.x = dripLine.x[0] + Math.random() * (dripLine.x[1] - dripLine.x[0]);
      }
      position.set(state.x, state.y, dripLine.z);
      scale.set(1, 1, 1);
      matrix.compose(position, new THREE.Quaternion(), scale);
      drips.setMatrixAt(i, matrix);
    }
    drips.instanceMatrix.needsUpdate = true;

    // 积水波纹：扩散 + 淡出
    for (let i = 0; i < rippleCount; i++) {
      const state = rippleState[i];
      state.age += dt;
      if (state.age > RIPPLE_LIFE) {
        state.age = 0;
        state.x = RAIN_CENTER[0] + (Math.random() - 0.5) * 6.4;
        state.z = 1.95 + Math.random() * 1.6;
      }
      const t = state.age / RIPPLE_LIFE;
      const radius = 0.12 + t * 0.55;
      position.set(state.x, 0.03, state.z);
      scale.set(radius, radius, radius);
      matrix.compose(position, flat, scale);
      ripples.setMatrixAt(i, matrix);
      // 加法混合下，颜色压到 0 就等于消失，正好当淡出用
      color.setScalar((1 - t) * 0.28);
      ripples.setColorAt(i, color);
    }
    ripples.instanceMatrix.needsUpdate = true;
    if (ripples.instanceColor) ripples.instanceColor.needsUpdate = true;

    // 玻璃雨痕：往下滑
    streakTexture.offset.y = (streakTexture.offset.y + dt * 0.06) % 1;
  }

  function setTheme(tokens) {
    const rainToken = tokens.rain || "rgba(74, 100, 138, 0.3)";
    const dark = tokens.scheme === "slate";
    rainMaterial.color.set(parseColor(rainToken, "#4a648a"));
    rainMaterial.opacity = Math.max(0.18, alphaOf(rainToken, 0.3) * 1.1);
    dripMaterial.color.set(dark ? "#a8d4ff" : "#bcd4ea");
    rippleMaterial.color.set(dark ? "#9fe4ff" : "#ffffff");
    streakMaterial.opacity = dark ? 0.42 : 0.5;
  }

  function dispose() {
    for (let i = 0; i < disposables.length; i++) disposables[i].dispose();
    disposables.length = 0;
    group.clear();
  }

  return {
    group: group,
    update: update,
    setTheme: setTheme,
    dispose: dispose
  };
}

/**
 * 湿地面：桌面（非窄屏 + 精细指针）用 Reflector 做真反射，
 * 其余情况退化为「低粗糙度湿面 + 高光条纹」，保持湿润观感但不做第二次渲染。
 * @param {object} THREE
 * @param {object} options { Reflector, area: {w, d, cx, cz, y}, quality: {reflection} }
 */
export function createWetGround(THREE, options) {
  const settings = options || {};
  const area = settings.area || { w: 7.2, d: 1.7, cx: 0, cz: 2.75, y: 0.02 };
  const quality = settings.quality || {};
  const disposables = [];
  const group = new THREE.Group();
  group.name = "nmd-wet-ground";

  let reflector = null;
  if (quality.reflection && settings.Reflector) {
    reflector = new settings.Reflector(new THREE.PlaneGeometry(area.w, area.d), {
      textureWidth: 512,
      textureHeight: 512,
      color: 0x4a5566 // 压暗反射，让它像湿沥青而不是镜子
    });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.set(area.cx, area.y, area.cz);
    group.add(reflector);
    disposables.push(reflector.geometry, reflector.material);
  }

  // 高光条纹：两种模式都保留，是湿地面的「保底湿润感」
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * canvas.width;
    const w = 1 + Math.random() * 3;
    const alpha = 0.06 + Math.random() * 0.16;
    ctx.fillStyle = "rgba(255, 255, 255, " + alpha.toFixed(2) + ")";
    ctx.fillRect(x, 0, w, canvas.height);
  }
  const sheenTexture = new THREE.CanvasTexture(canvas);
  sheenTexture.colorSpace = THREE.SRGBColorSpace;
  sheenTexture.wrapS = THREE.RepeatWrapping;
  sheenTexture.repeat.set(3, 1);
  const sheenMaterial = new THREE.MeshBasicMaterial({
    map: sheenTexture,
    transparent: true,
    opacity: 0.5,
    depthWrite: false
  });
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(area.w, area.d), sheenMaterial);
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.set(area.cx, area.y + 0.004, area.cz);
  group.add(sheen);
  disposables.push(sheenTexture, sheenMaterial, sheen.geometry);

  function setTheme(tokens) {
    const dark = tokens.scheme === "slate";
    sheenMaterial.opacity = dark ? 0.35 : 0.5;
    if (reflector && reflector.material.uniforms && reflector.material.uniforms.color) {
      reflector.material.uniforms.color.value.set(dark ? "#2b3446" : "#4a5566");
    }
  }

  function dispose() {
    for (let i = 0; i < disposables.length; i++) disposables[i].dispose();
    disposables.length = 0;
    group.clear();
  }

  return {
    group: group,
    usingReflection: !!reflector,
    setTheme: setTheme,
    dispose: dispose
  };
}

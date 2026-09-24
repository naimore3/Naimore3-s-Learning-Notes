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
const RIPPLE_LIFE = 0.9;           // 波纹寿命（阶段 12：1.25 → 0.9s，方案 §4.6.3）
const DRIP_FALL = 3.2;
const FADE_TIME = 0.35;            // 昼夜粒子族淡变时长（方案 §4.5.2）

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
 * 昼夜置换（阶段 12 / 方案 §4.5）：白天整族淡出隐藏，夜晚淡入；与花瓣互斥。
 * @param {object} THREE 入口模块传入的 three 命名空间
 * @param {object} options { drip, quality, rippleTexture, prefersReduced }
 */
export function createRainSystem(THREE, options) {
  const settings = options || {};
  const quality = settings.quality || {};
  const dripLine = settings.drip || { x: [-1.1, 3.1], y: 1.93, z: 1.13 };
  const prefersReduced = !!settings.prefersReduced;

  const group = new THREE.Group();
  group.name = "nmd-rain";
  const disposables = [];
  let elapsed = 0;

  // 昼夜淡变状态（阶段 12）：fade 等声明见 update 段；themeApplied 同段
  let rainBaseOpacity = 0.34;
  let dripBaseOpacity = 0.5;
  let streakBaseOpacity = 0.5;

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

  /* ---------- 3. 地面积水波纹（阶段 12 / 方案 §4.6）----------
     PlaneGeometry + 羽化双环 rippleTexture + AdditiveBlending 冷光；
     确定性 LCG 布点，easeOutQuad 扩散，pow(1-t,1.6) 衰减；只在夜晚出现。 */
  const rippleCount = quality.ripples || 18;
  const rippleGeometry = new THREE.PlaneGeometry(1, 1);
  rippleGeometry.rotateX(-Math.PI / 2);
  const rippleMaterial = new THREE.MeshBasicMaterial({
    map: settings.rippleTexture || null,
    color: "#9ec9ff",
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const ripples = new THREE.InstancedMesh(rippleGeometry, rippleMaterial, rippleCount);
  ripples.name = "rain:ripples";
  const RIPPLE_Y = 0.038; // ROAD_TOP(0.01) + 0.028，防 Z-Fighting
  let lcgSeed = 0x9e3779b9;
  function lcg() {
    lcgSeed = (Math.imul(lcgSeed, 1664525) + 1013904223) >>> 0;
    return lcgSeed / 4294967296;
  }
  function spawnRipple(state) {
    state.x = -2.6 + lcg() * 6.0;   // [-2.6, 3.4]
    state.z = 1.95 + lcg() * 1.55;  // [1.95, 3.5]
    state.age = 0;
  }
  const rippleState = [];
  for (let i = 0; i < rippleCount; i++) {
    const state = { x: 0, z: 0, age: 0 };
    spawnRipple(state);
    state.age = lcg() * RIPPLE_LIFE;
    rippleState.push(state);
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
  const identityQuat = new THREE.Quaternion();
  const rainChildren = [rain, drips, ripples, streaks];

  let fade = 1;
  let fadeTarget = 1;
  let fadeFrom = 1;
  let fadeStartedAt = 0;
  let themeApplied = false;

  function beginFade(next) {
    // 目标未变则不重启时钟：阶段 2 对已朝 0 淡出的出场族再 beginFade(0)
    // 会把 fadeFrom 拉回当前中间值，导致与入场族短暂同框
    if (next === fadeTarget) return;
    fadeFrom = fade;
    fadeTarget = next;
    fadeStartedAt = performance.now();
  }

  function applyFade() {
    rainMaterial.opacity = rainBaseOpacity * fade;
    dripMaterial.opacity = dripBaseOpacity * fade;
    streakMaterial.opacity = streakBaseOpacity * fade;
    // 加法混合：material.opacity 同样乘 fade，实例色只负责寿命曲线
    rippleMaterial.opacity = fade;
    const show = fade > 0.001;
    for (let i = 0; i < rainChildren.length; i++) {
      rainChildren[i].visible = show;
    }
    // 方案 §4.6.3-6：reduced-motion 下波纹整族隐藏（含 setTheme 即时落定路径）
    if (prefersReduced) ripples.visible = false;
  }

  function update(dt, reducedMotion) {
    // 昼夜淡变：按墙钟推进（0.35s），避免无头/低帧率下被 MAX_DELTA 拖慢
    if (fade !== fadeTarget) {
      if (prefersReduced || reducedMotion) {
        fade = fadeTarget;
      } else {
        const u = Math.min(1, (performance.now() - fadeStartedAt) / (FADE_TIME * 1000));
        fade = fadeFrom + (fadeTarget - fadeFrom) * u;
      }
      applyFade();
    }
    if (fade < 0.001) return;
    if (!(dt > 0)) return;
    elapsed += dt;

    if (reducedMotion || prefersReduced) {
      // 减弱动效：雨变静态雨丝、波纹整族隐藏（方案 §4.6.3-6）
      ripples.visible = false;
      return;
    }
    ripples.visible = fade > 0.001;

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
      matrix.compose(position, identityQuat, scale);
      drips.setMatrixAt(i, matrix);
    }
    drips.instanceMatrix.needsUpdate = true;

    // 积水波纹：easeOutQuad 扩散 + pow 非线性衰减（方案 §4.6.3）
    for (let i = 0; i < rippleCount; i++) {
      const state = rippleState[i];
      state.age += dt;
      if (state.age > RIPPLE_LIFE) spawnRipple(state);
      const t = state.age / RIPPLE_LIFE;
      const e = 1 - (1 - t) * (1 - t);              // easeOutQuad
      const s = 0.10 + e * 0.24;                    // 最大边长 0.34m
      const brightness = Math.pow(1 - t, 1.6) * 0.55;
      position.set(state.x, RIPPLE_Y, state.z);
      scale.set(s, s, s);
      matrix.compose(position, identityQuat, scale);
      ripples.setMatrixAt(i, matrix);
      color.setScalar(brightness);
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
    // 颜色逻辑保持现状；可见性交给 fade（白天 0、夜晚 1）
    rainBaseOpacity = Math.max(0.18, alphaOf(rainToken, 0.3) * 1.1);
    rainMaterial.color.set(parseColor(rainToken, "#4a648a"));
    rainMaterial.opacity = rainBaseOpacity * fade;
    dripMaterial.color.set(dark ? "#a8d4ff" : "#bcd4ea");
    dripMaterial.opacity = dripBaseOpacity * fade;
    // 波纹冷光色固定 #9ec9ff（材质构造已设），此处只跟淡变
    streakBaseOpacity = dark ? 0.42 : 0.5;
    streakMaterial.opacity = streakBaseOpacity * fade;

    fadeTarget = dark ? 1 : 0;
    if (!themeApplied || prefersReduced) {
      fade = fadeTarget;
      fadeFrom = fade;
      themeApplied = true;
    } else {
      beginFade(fadeTarget);
    }
    applyFade();
  }

  /** 阶段 12 互斥：更新颜色与 fadeTarget；override 可强制压到 0（错峰第一阶段） */
  function setThemeTargets(tokens, fadeTargetOverride) {
    const rainToken = tokens.rain || "rgba(74, 100, 138, 0.3)";
    const dark = tokens.scheme === "slate";
    rainBaseOpacity = Math.max(0.18, alphaOf(rainToken, 0.3) * 1.1);
    rainMaterial.color.set(parseColor(rainToken, "#4a648a"));
    dripMaterial.color.set(dark ? "#a8d4ff" : "#bcd4ea");
    streakBaseOpacity = dark ? 0.42 : 0.5;
    beginFade(fadeTargetOverride !== undefined ? fadeTargetOverride : (dark ? 1 : 0));
  }

  /** 立即落定当前 fadeTarget（reduced-motion / 验收兜底） */
  function settleFade() {
    fade = fadeTarget;
    fadeFrom = fade;
    themeApplied = true;
    applyFade();
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
    setThemeTargets: setThemeTargets,
    settleFade: settleFade,
    dispose: dispose
  };
}

/**
 * 白昼花瓣粒子（阶段 9 / 方案 §4.2.3、§6.2）。
 * 与雨互斥：白天 fade→1，夜晚 fade→0；风场把瓣从树冠吹过人行道。
 * @param {object} THREE
 * @param {object} options { count, map, center, prefersReduced }
 */
export function createPetalSystem(THREE, options) {
  const config = options || {};
  const count = config.count || 48;
  const center = config.center || { x: -3.05, y: 2.0, z: 1.15 };
  const half = { x: 1.6, y: 1.2, z: 1.3 };
  const prefersReduced = !!config.prefersReduced;

  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  const wind = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = center.x + (Math.random() * 2 - 1) * half.x;
    positions[i * 3 + 1] = center.y + (Math.random() * 2 - 1) * half.y;
    positions[i * 3 + 2] = center.z + (Math.random() * 2 - 1) * half.z;
    speeds[i] = 0.24 + Math.random() * 0.16;
    phases[i] = Math.random() * Math.PI * 2;
    wind[i] = 0.18 + Math.random() * 0.14;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: config.map || null,
    size: 0.06,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    color: "#f6b6c2",
    opacity: 1
  });
  const points = new THREE.Points(geometry, material);
  points.name = "petals";
  points.frustumCulled = false;
  points.visible = true;

  let fade = 1;
  let fadeTarget = 1;
  let fadeFrom = 1;
  let fadeStartedAt = 0;
  let themeApplied = false;

  function beginFade(next) {
    // 目标未变则不重启时钟（与雨族一致，避免阶段 2 重置出场族淡出进度）
    if (next === fadeTarget) return;
    fadeFrom = fade;
    fadeTarget = next;
    fadeStartedAt = performance.now();
  }

  function setTheme(tokens) {
    const isDay = tokens.scheme !== "slate";
    // 夜里即便不可见也同步色，防切换瞬间闪色
    material.color.set(isDay ? "#f6b6c2" : "#d9879b");
    const next = isDay ? 1 : 0;
    if (!themeApplied || prefersReduced) {
      fade = next;
      fadeFrom = fade;
      fadeTarget = next;
      themeApplied = true;
      material.opacity = fade;
      points.visible = fade > 0.001;
    } else {
      beginFade(next);
    }
  }

  /** 阶段 12 互斥：更新颜色与 fadeTarget；override 可强制压到 0（错峰第一阶段） */
  function setThemeTargets(tokens, fadeTargetOverride) {
    const isDay = tokens.scheme !== "slate";
    material.color.set(isDay ? "#f6b6c2" : "#d9879b");
    beginFade(fadeTargetOverride !== undefined ? fadeTargetOverride : (isDay ? 1 : 0));
  }

  /** 立即落定当前 fadeTarget（reduced-motion / 验收兜底） */
  function settleFade() {
    fade = fadeTarget;
    fadeFrom = fade;
    themeApplied = true;
    material.opacity = fade;
    points.visible = fade > 0.001;
  }

  function update(dt, elapsed, reducedMotion) {
    // 按墙钟推进 0.35s 淡变（与雨族一致，避免无头低帧率拖慢）
    if (fade !== fadeTarget) {
      if (prefersReduced || reducedMotion) {
        fade = fadeTarget;
      } else {
        const u = Math.min(1, (performance.now() - fadeStartedAt) / (FADE_TIME * 1000));
        fade = fadeFrom + (fadeTarget - fadeFrom) * u;
      }
      material.opacity = fade;
      points.visible = fade > 0.001;
    }
    if (!points.visible) return;
    if (reducedMotion || prefersReduced) return;

    const attr = geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      let x = attr.array[i * 3] + wind[i] * dt
        + Math.sin(elapsed * 1.1 + phases[i]) * dt * 0.18;
      let y = attr.array[i * 3 + 1] - speeds[i] * dt;
      let z = attr.array[i * 3 + 2] + Math.cos(elapsed * 0.9 + phases[i]) * dt * 0.14;
      // z 摇曳越界先钳再写回（方案 §6.2 的写回顺序修正）
      if (z > center.z + half.z) z = center.z - half.z;
      else if (z < center.z - half.z) z = center.z + half.z;
      // 落地或漂出底座边界 → 回树冠顶重生
      if (y < 0.02 || x > center.x + half.x + 2.5) {
        y = center.y + half.y;
        x = center.x + (Math.random() * 2 - 1) * half.x;
        z = center.z + (Math.random() * 2 - 1) * half.z;
      }
      attr.array[i * 3] = x;
      attr.array[i * 3 + 1] = y;
      attr.array[i * 3 + 2] = z;
    }
    attr.needsUpdate = true;
  }

  return {
    points: points,
    setTheme: setTheme,
    setThemeTargets: setThemeTargets,
    settleFade: settleFade,
    update: update,
    dispose: function () {
      geometry.dispose();
      material.dispose();
    }
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
    // 白天保留湿痕但降档（方案 §4.5.3 ×0.55 ≈ 0.28），不关 Reflector
    sheenMaterial.opacity = dark ? 0.35 : 0.28;
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

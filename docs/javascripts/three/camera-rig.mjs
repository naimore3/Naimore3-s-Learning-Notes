/* =============================================================
   墨海寻珠 · 滚动镜头与自由观察
   设计文档：.documents/首页设计方案合集.md 第 5 节（三个场景）、
             第 6.2 节（拖拽 / 旋转 / 缩放）、第 16.4 节（章节与进度映射）、
             第 14.3 节（阶段 1）、第 14.8 节（阶段 6）

   阶段 1：滚动驱动的基础机位
   - 三个机位关键帧来自第 5.1 / 5.2 / 5.3 节
   - 进度来源是 homepage.js 写好的 --nmd-scroll（0~1），本模块不另建滚动监听
   - 位置与目标点走 CatmullRomCurve3，视场角分段线性，段内 easeInOutCubic
   - 0.6s 指数平滑跟随，过滤滚轮抖动，上滚可逆
   - prefers-reduced-motion 时不推进镜头：入口模块只 snap 到首帧

   阶段 6：在基础机位上叠加 OrbitControls
   - 交互进行中：相机位置完全交给 OrbitControls（这样它的阻尼增量才能正常累积，
     轨道中心跟随基础目标，限制窗口按「基础机位的方位角 ±22°、俯仰 ±25°」逐帧刷新）
   - 交互结束（最后一次指针 / 滚轮事件后 0.9s）：相机与轨道中心一起指数缓动回
     当前滚动进度对应的基础机位，收敛后再交还给纯滚动镜头
   - 若用户从未交互（相机就在基础机位），行为与阶段 1 完全一致，不做多余插值
   ============================================================= */

// 关键帧进度按第 16.4 节：封面 0–0.18 全景、缘起 0.18–0.40 全景→街角、
// 关于我 0.40–0.72 街角→橱窗、学历 0.72 之后停在橱窗
export const CAMERA_KEYS = [
  // 阶段 19（方案 §10）：全景改为「店 + 整棵樱花树」入画。原 (5.2,4.6,5.2)→(0,0.8,0)
  // 会把树冠右半与冠顶切出画面（冠 screen x 975→1602、top −191px），看不出树形。
  { at: 0.18, pos: [5.7, 4.9, 5.7], target: [1.1, 2.55, -1.3], fov: 40 },
  { at: 0.40, pos: [3.8, 1.7, 3.2], target: [-0.2, 1.3, -0.6], fov: 38 },
  { at: 0.72, pos: [2.2, 1.5, 2.4], target: [0.4, 1.2, -1.2], fov: 50 }
];

const SMOOTHING_SECONDS = 0.6; // 滚动跟随时的时间常数
const RETURN_SECONDS = 0.9;    // 松手后回到基础机位的时间常数（第 6.2 节「缓慢回位」）
const POS_EPSILON = 0.0005;    // 0.5mm 以内视为到位，停止重绘
const FOV_EPSILON = 0.02;
const NARROW_LIFT = 0.85;      // 竖屏时相机整体抬高（米）
const NARROW_PULL = 1.1;       // 竖屏时沿视线后退（米）
const AZIMUTH_LIMIT = 0.384;   // 水平偏移 ±22°（第 6.2 节）
const POLAR_LIMIT = 0.436;     // 俯仰在基础机位上下各 ±25°，合计约 50°（对应第 6.2 节的 30°–80°）
const MIN_DISTANCE = 1.8;      // 最近：贴着橱窗也看得清
const MAX_DISTANCE = 13.0;     // 最远：整块底座都在画面里
const ACTIVE_HOLD_MS = 900;    // 最后一次交互事件之后多久开始回位

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function createCameraRig(THREE, camera, options) {
  const settings = options || {};
  const OrbitControls = settings.OrbitControls || null;
  const domElement = settings.domElement || null;

  const positionCurve = new THREE.CatmullRomCurve3(
    CAMERA_KEYS.map(function (key) { return new THREE.Vector3().fromArray(key.pos); })
  );
  const targetCurve = new THREE.CatmullRomCurve3(
    CAMERA_KEYS.map(function (key) { return new THREE.Vector3().fromArray(key.target); })
  );

  const state = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: CAMERA_KEYS[0].fov };
  const desired = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: CAMERA_KEYS[0].fov };
  const liftVector = new THREE.Vector3();
  const baseVector = new THREE.Vector3();
  const baseSpherical = new THREE.Spherical();
  const scratchPosition = new THREE.Vector3();

  let narrowLift = 0;
  let dirty = true;
  let wasSettled = true;
  let progress = 0;
  let scrollLocked = false; // 减弱动效：镜头不随滚动推进（第 12 节）

  /* ---------- OrbitControls：只在交互时接管相机 ---------- */
  let controls = null;
  let activeUntil = 0;

  function markActive() {
    activeUntil = (window.performance && performance.now ? performance.now() : Date.now()) + ACTIVE_HOLD_MS;
  }

  function now() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function onPointerDown() { markActive(); }
  function onPointerMove(event) { if (event.buttons) markActive(); }
  function onWheel() { markActive(); }

  if (OrbitControls && domElement) {
    controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;        // 第 6.2 节：关闭平移，避免把场景拖出视野
    controls.enableZoom = true;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.65;
    controls.minDistance = MIN_DISTANCE;
    controls.maxDistance = MAX_DISTANCE;
    controls.enabled = false;          // 默认不接管指针（第 14.8 节）
    controls.target.copy(state.target);

    /* OrbitControls 构造函数会把 domElement 的 touch-action 设成 none（禁止触摸滚动）。
       本项目的口径是「移动端竖向滑动仍然滚页面」（第 14.8 节），所以显式改回 pan-y：
       竖向平移交给浏览器，横向拖动与双指捏合留给 OrbitControls。 */
    if (domElement.style) domElement.style.touchAction = "pan-y";

    domElement.addEventListener("pointerdown", onPointerDown);
    domElement.addEventListener("pointermove", onPointerMove, { passive: true });
    domElement.addEventListener("wheel", onWheel, { passive: true });
  }

  function isActive() {
    return now() < activeUntil;
  }

  /* --nmd-scroll 由 homepage.js 写进 <html> 的内联样式，直接读内联样式即可 */
  function readProgress() {
    if (scrollLocked) return 0;
    const raw = document.documentElement.style.getPropertyValue("--nmd-scroll");
    if (!raw) return 0;
    const value = parseFloat(raw);
    return isNaN(value) ? 0 : clamp01(value);
  }

  /* 把 0~1 的滚动进度映射到曲线参数：关键帧之间段内做 easeInOutCubic，
     首尾各留一段停留，让「看模型 / 望橱窗」两个机位站得住 */
  function curveParam(p) {
    const first = CAMERA_KEYS[0].at;
    const last = CAMERA_KEYS[CAMERA_KEYS.length - 1].at;
    if (p <= first) return 0;
    if (p >= last) return 1;
    for (let i = 0; i < CAMERA_KEYS.length - 1; i++) {
      const a = CAMERA_KEYS[i];
      const b = CAMERA_KEYS[i + 1];
      if (p <= b.at) {
        const t = (p - a.at) / (b.at - a.at);
        return (i + easeInOutCubic(t)) / (CAMERA_KEYS.length - 1);
      }
    }
    return 1;
  }

  function fovAt(p) {
    if (p <= CAMERA_KEYS[0].at) return CAMERA_KEYS[0].fov;
    for (let i = 0; i < CAMERA_KEYS.length - 1; i++) {
      const a = CAMERA_KEYS[i];
      const b = CAMERA_KEYS[i + 1];
      if (p <= b.at) {
        const t = easeInOutCubic((p - a.at) / (b.at - a.at));
        return a.fov + (b.fov - a.fov) * t;
      }
    }
    return CAMERA_KEYS[CAMERA_KEYS.length - 1].fov;
  }

  function computeDesired(p) {
    const u = curveParam(p);
    desired.position.copy(positionCurve.getPoint(u));
    desired.target.copy(targetCurve.getPoint(u));
    desired.fov = fovAt(p);

    /* 竖屏（手机）横向视野只有桌面的一半不到，街角 / 橱窗机位会贴到平整墙面上、
       整屏一片死白。这里只抬高 + 沿视线后退，不改每个机位各自的朝向。 */
    if (narrowLift > 0) {
      liftVector.subVectors(desired.position, desired.target).normalize();
      desired.position.addScaledVector(liftVector, narrowLift * NARROW_PULL);
      desired.position.y += narrowLift * NARROW_LIFT;
    }
  }

  function applyFov() {
    if (Math.abs(camera.fov - state.fov) > 1e-4) {
      camera.fov = state.fov;
      camera.updateProjectionMatrix();
    }
  }

  function apply() {
    camera.position.copy(state.position);
    camera.lookAt(state.target);
    applyFov();
  }

  /* 交互中把限制窗口按基础机位刷新：水平 ±22°、俯仰 ±25°，
     这样无论滚动到哪个机位，用户都在「当前镜头附近」活动。 */
  function refreshLimits() {
    baseVector.subVectors(state.position, state.target);
    baseSpherical.setFromVector3(baseVector);
    controls.minAzimuthAngle = baseSpherical.theta - AZIMUTH_LIMIT;
    controls.maxAzimuthAngle = baseSpherical.theta + AZIMUTH_LIMIT;
    controls.minPolarAngle = Math.max(0.12, baseSpherical.phi - POLAR_LIMIT);
    controls.maxPolarAngle = Math.min(Math.PI - 0.12, baseSpherical.phi + POLAR_LIMIT);
  }

  /** 立刻贴到当前（或指定）进度对应的机位，不做平滑 */
  function snap(toProgress) {
    progress = typeof toProgress === "number" ? clamp01(toProgress) : readProgress();
    computeDesired(progress);
    state.position.copy(desired.position);
    state.target.copy(desired.target);
    state.fov = desired.fov;
    dirty = false;
    wasSettled = true;
    if (controls) {
      controls.target.copy(state.target);
      refreshLimits();
    }
    apply();
  }

  /** 每帧调用：读取滚动进度、平滑跟随、叠加用户交互；返回是否需要重绘 */
  function update(dt) {
    progress = readProgress();
    computeDesired(progress);

    if (dirty) {
      snap(progress);
      return true;
    }

    const step = Math.max(0, Math.min(dt, 0.1));
    const alpha = 1 - Math.exp(-step / SMOOTHING_SECONDS);
    state.position.lerp(desired.position, alpha);
    state.target.lerp(desired.target, alpha);
    state.fov += (desired.fov - state.fov) * alpha;

    const settled =
      state.position.distanceToSquared(desired.position) < POS_EPSILON * POS_EPSILON &&
      state.target.distanceToSquared(desired.target) < POS_EPSILON * POS_EPSILON &&
      Math.abs(state.fov - desired.fov) < FOV_EPSILON;

    if (settled) {
      const needed = !wasSettled;
      state.position.copy(desired.position);
      state.target.copy(desired.target);
      state.fov = desired.fov;
      wasSettled = true;
      if (!controls) { apply(); return needed; }
      const moved = stepControls(step, needed);
      return moved || needed;
    }

    wasSettled = false;
    if (!controls) { apply(); return true; }
    stepControls(step, true);
    return true;
  }

  /* 相机在基础机位上时与阶段 1 完全一致；有用户偏移时才做回位插值 */
  function stepControls(step, forceRender) {
    const active = isActive();
    const offsetSq =
      camera.position.distanceToSquared(state.position) +
      controls.target.distanceToSquared(state.target);

    if (active) {
      // 交互中：相机位置归 OrbitControls，轨道中心跟基础目标走
      controls.target.copy(state.target);
      scratchPosition.copy(camera.position);
      refreshLimits();
      controls.update();
      applyFov();
      return scratchPosition.distanceToSquared(camera.position) > 1e-10 || forceRender;
    }

    /* 减弱动效：用户摆到哪就停在哪，不做自动回位（第 12 节「镜头不自动推进」） */
    if (scrollLocked) {
      controls.target.copy(state.target);
      applyFov();
      return !!forceRender;
    }

    if (offsetSq < 1e-8) {
      // 没有用户偏移：完全交回纯滚动镜头（阶段 1 行为）
      controls.target.copy(state.target);
      apply();
      return !!forceRender;
    }

    // 交互结束：相机与轨道中心一起缓动回基础机位；OrbitControls 的残余阻尼同时衰减
    const alpha = 1 - Math.exp(-step / RETURN_SECONDS);
    camera.position.lerp(state.position, alpha);
    controls.target.lerp(state.target, alpha);
    refreshLimits();
    controls.update();
    applyFov();
    return true;
  }

  /** 视口比例变化时更新竖屏抬升系数（aspect < 1 视为竖屏） */
  function setAspect(aspect) {
    const next = aspect >= 1 ? 0 : Math.min(1, (1 - aspect) / 0.6);
    if (Math.abs(next - narrowLift) < 1e-4) return;
    narrowLift = next;
    snap(progress);
  }

  /** 交互模式开关（阶段 6 由入口模块按修饰键 / 指针类型控制） */
  /** 减弱动效：锁定滚动推进；由入口模块按 prefers-reduced-motion 调用 */
  function setScrollLocked(value) {
    if (scrollLocked === !!value) return;
    scrollLocked = !!value;
    snap(scrollLocked ? 0 : progress);
  }

  function setInteractive(value) {
    if (!controls) return false;
    controls.enabled = !!value;
    if (controls.enabled) markActive();
    return controls.enabled;
  }

  function isInteractive() {
    return !!(controls && controls.enabled);
  }

  /** 离场时释放 OrbitControls 与自建监听（navigation.instant 复用同一份脚本） */
  function disposeControls() {
    if (!controls) return;
    controls.enabled = false;
    if (domElement) {
      domElement.removeEventListener("pointerdown", onPointerDown);
      domElement.removeEventListener("pointermove", onPointerMove);
      domElement.removeEventListener("wheel", onWheel);
    }
    if (typeof controls.dispose === "function") controls.dispose();
    controls = null;
  }

  /** 只读探针：验收 / 调参时核对「用户偏移 vs 基础机位」（阶段 6、7） */
  function probe() {
    const out = {
      hasControls: !!controls,
      interactive: !!(controls && controls.enabled),
      active: isActive(),
      base: null,
      camera: null,
      limits: null
    };
    baseVector.subVectors(state.position, state.target);
    baseSpherical.setFromVector3(baseVector);
    out.base = { theta: +baseSpherical.theta.toFixed(4), phi: +baseSpherical.phi.toFixed(4), radius: +baseSpherical.radius.toFixed(3) };
    if (controls) {
      const current = new THREE.Spherical().setFromVector3(
        new THREE.Vector3().subVectors(camera.position, controls.target)
      );
      out.camera = { theta: +current.theta.toFixed(4), phi: +current.phi.toFixed(4), radius: +current.radius.toFixed(3) };
      out.limits = {
        minAz: +controls.minAzimuthAngle.toFixed(4),
        maxAz: +controls.maxAzimuthAngle.toFixed(4),
        minPolar: +controls.minPolarAngle.toFixed(4),
        maxPolar: +controls.maxPolarAngle.toFixed(4),
        minDistance: controls.minDistance,
        maxDistance: controls.maxDistance,
        damping: controls.dampingFactor
      };
    }
    return out;
  }

  return {
    update: update,
    snap: snap,
    setAspect: setAspect,
    setScrollLocked: setScrollLocked,
    setInteractive: setInteractive,
    isInteractive: isInteractive,
    hasControls: !!controls,
    disposeControls: disposeControls,
    probe: probe,
    getProgress: function () { return progress; }
  };
}

/* =============================================================
   墨海寻珠 · 场景主循环（阶段 1 建立，阶段 5 扩展）
   设计文档：.documents/首页设计方案合集.md 第 6.1 节（rAF 主循环）、
             第 11 节（性能预算）、第 14.3 节（阶段 1）、第 14.7 节（阶段 5）

   - requestAnimationFrame 主循环，逐帧把时间交给 onFrame(dt, elapsed)
   - 阶段 5 起：用 add()/remove() 注册动效更新（雨、门、招牌、信号灯），
     由主循环统一驱动，暂停/销毁时一并生效
   - 页面不可见（visibilitychange）或场景容器不在视口内（IntersectionObserver）
     时自动暂停，不做无意义的渲染
   - prefers-reduced-motion 下不启动循环（入口模块只渲染静态首帧）
   - 与 navigation.instant 配合：容器被移除时由入口模块调用 dispose()
   ============================================================= */

const MAX_DELTA = 0.1; // 切后台回来时钳住时间步长，避免镜头一次性跳过去

export function createAnimationLoop(options) {
  const container = options.container;
  const onFrame = options.onFrame;
  const prefersReduced = !!options.prefersReduced;
  /* 减弱动效时主循环仍然要跑：雨 / 门 / 招牌 / 信号灯这些 updater 全部冻结，
     但相机与用户交互（拖拽、缩放）要靠 onFrame 驱动，否则第 12 节要求的
     「只保留静态场景，用户仍可拖拽观察」做不到。 */
  const frozen = !!options.frozen;

  let rafId = null;
  let lastTime = 0;
  let running = false;
  let inViewport = true;
  let pageVisible = !document.hidden;
  let disposed = false;
  let observer = null;
  const updaters = [];
  let elapsed = 0;

  function frame(now) {
    rafId = null;
    if (!running) return;

    const dt = lastTime ? Math.min((now - lastTime) / 1000, MAX_DELTA) : 0;
    lastTime = now;
    elapsed += dt;
    if (!frozen) {
      for (let i = 0; i < updaters.length; i++) updaters[i](dt, elapsed);
    }
    onFrame(dt, now);

    if (running) rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || disposed) return;
    running = true;
    lastTime = 0;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function sync() {
    if (inViewport && pageVisible) start();
    else stop();
  }

  function onVisibilityChange() {
    pageVisible = !document.hidden;
    sync();
  }

  if ("IntersectionObserver" in window && container) {
    observer = new IntersectionObserver(function (entries) {
      inViewport = entries[entries.length - 1].isIntersecting;
      sync();
    });
    observer.observe(container);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  return {
    start: start,
    stop: stop,
    sync: sync,
    dispose: dispose,
    add: function (updater) {
      if (typeof updater === "function" && updaters.indexOf(updater) === -1) updaters.push(updater);
    },
    remove: function (updater) {
      const index = updaters.indexOf(updater);
      if (index !== -1) updaters.splice(index, 1);
    },
    isRunning: function () { return running; },
    prefersReduced: prefersReduced
  };
}

/* =============================================================
   阶段 5 的「环境动效」：招牌 emissive 抖动、自动门开合、远处信号灯循环。
   第 14.7 节把这三项归到 animation-loop.mjs 的扩展里，因此放在同一个文件；
   实现上只按名字操作场景里已有的对象，不持有任何几何。
   ============================================================= */

const DOOR_OPEN_TIME = 1.2;
const DOOR_HOLD_TIME = 2.4;
const DOOR_CLOSE_TIME = 1.5;
const DOOR_TRAVEL = 0.62; // 门扇滑开的距离（m）
const SIGNAL_CYCLE = { green: 9, amber: 2.5, red: 8.5 };

export function createAmbientEffects(THREE, scene, library) {
  const leftDoor = scene.getObjectByName("door:left");
  const rightDoor = scene.getObjectByName("door:right");
  const doorBaseLeft = leftDoor ? leftDoor.position.x : 0;
  const doorBaseRight = rightDoor ? rightDoor.position.x : 0;

  const signMaterial = library && library.materials ? library.materials.sign : null;
  const signalLamps = ["signal:red", "signal:amber", "signal:green"].map(function (name) {
    return scene.getObjectByName(name);
  });

  let doorPhase = "closed";
  let doorTimer = 5 + Math.random() * 5; // 首次开门前先安静一会儿
  let doorProgress = 0;
  let flickerTimer = 2 + Math.random() * 3;
  let flickerDip = 0;
  let signalTime = 0;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function applyDoors(open) {
    if (leftDoor) leftDoor.position.x = doorBaseLeft - open * DOOR_TRAVEL;
    if (rightDoor) rightDoor.position.x = doorBaseRight + open * DOOR_TRAVEL;
  }

  function update(dt, elapsed) {
    if (!(dt > 0)) return;

    // 自动门：大部分时间关着，偶尔开一次，间隔随机
    if (doorPhase === "closed") {
      doorTimer -= dt;
      if (doorTimer <= 0) {
        doorPhase = "opening";
        doorTimer = 0;
      }
    } else if (doorPhase === "opening") {
      doorTimer += dt;
      doorProgress = easeInOut(Math.min(1, doorTimer / DOOR_OPEN_TIME));
      if (doorTimer >= DOOR_OPEN_TIME) {
        doorPhase = "open";
        doorTimer = 0;
      }
    } else if (doorPhase === "open") {
      doorTimer += dt;
      if (doorTimer >= DOOR_HOLD_TIME) {
        doorPhase = "closing";
        doorTimer = 0;
      }
    } else {
      doorTimer += dt;
      doorProgress = 1 - easeInOut(Math.min(1, doorTimer / DOOR_CLOSE_TIME));
      if (doorTimer >= DOOR_CLOSE_TIME) {
        doorPhase = "closed";
        doorProgress = 0;
        doorTimer = 8 + Math.random() * 8; // 下一次开门间隔
      }
    }
    applyDoors(doorProgress);

    // 招牌：平时 ±3% 呼吸，偶尔一次极短的小掉电（幅度克制，不干扰阅读）
    if (signMaterial) {
      const base = signMaterial.userData.baseEmissiveIntensity || 0.5;
      if (flickerDip > 0) {
        flickerDip -= dt;
        signMaterial.emissiveIntensity = base * (0.55 + Math.random() * 0.18);
      } else {
        flickerTimer -= dt;
        if (flickerTimer <= 0) {
          flickerDip = 0.05 + Math.random() * 0.12;
          flickerTimer = 4 + Math.random() * 5;
        }
        signMaterial.emissiveIntensity = base * (1 + Math.sin(elapsed * 6.5) * 0.03);
      }
    }

    // 远处信号灯：绿 → 黄 → 红 缓慢循环
    signalTime = (signalTime + dt) % (SIGNAL_CYCLE.green + SIGNAL_CYCLE.amber + SIGNAL_CYCLE.red);
    const active = signalTime < SIGNAL_CYCLE.green ? 0
      : signalTime < SIGNAL_CYCLE.green + SIGNAL_CYCLE.amber ? 1 : 2;
    for (let i = 0; i < signalLamps.length; i++) {
      const lamp = signalLamps[i];
      if (!lamp) continue;
      lamp.material.emissiveIntensity = i === active ? 1.6 : 0.06;
    }
  }

  function dispose() {
    applyDoors(0); // 复位成关门状态，供 navigation.instant 重新挂载时使用
    if (signMaterial) {
      signMaterial.emissiveIntensity = signMaterial.userData.baseEmissiveIntensity || 0.5;
    }
  }

  return { update: update, dispose: dispose };
}

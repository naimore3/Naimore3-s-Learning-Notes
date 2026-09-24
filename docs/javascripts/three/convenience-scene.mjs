/* =============================================================
   墨海寻珠 · 首页 Three.js 微缩场景入口
   设计文档：.documents/首页设计方案合集.md 第 13 节（接入）、
             第 14.2 节（阶段 0）、第 14.3 节（阶段 1）、第 14.4 节（阶段 2）、
              第 14.5 节（阶段 3）、第 14.6 节（阶段 4）、第 14.7 节（阶段 5）、
              第 14.8 节（阶段 6）、第 14.9 节（阶段 7）、
              .documents/首页美化-模型上色樱花与电车设计方案.md（阶段 8–12）

   已完成：
   - 阶段 0：canvas 挂进 #convenience-scene、天空渐变、地台、尺寸自适应、生命周期
   - 阶段 1：白盒街区（scene-builder）+ 三机位滚动镜头（camera-rig）
              + rAF 主循环与暂停策略（animation-loop）
   - 阶段 2：三渲二材质与描边、昼夜灯光（materials）+ 主题实时换色
   - 阶段 3：街角道具与电线（scene-builder）+ 店内陈列（interior-builder）
   - 阶段 4：程序化贴图（canvas-textures）：店招、路牌、海报、价签、地面标线
   - 阶段 5：雨 / 滴水 / 波纹 / 玻璃雨痕 / 湿地面（rain-system）+ 门、招牌、信号灯（animation-loop）
   - 阶段 6：OrbitControls 拖拽旋转 / 滚轮缩放，松手后缓回滚动镜头（camera-rig）
   - 阶段 7：像素比上限、页面不可见暂停、移动端降载、减弱动效静态观察
   - 阶段 8：材质按角色拆分上色（facade/roof/neighbor/skyline）+ 分色带 + 邻栋窗格
   - 阶段 9：樱花树（trunk/树冠/花瓣贴地）+ 白昼樱吹雪花瓣粒子（createPetalSystem）
   - 阶段 10：有轨电车 + 轨道/枕木，垂直于道路停放于店侧
   - 阶段 11：底座外天际线剪影（InstancedMesh）+ 底座侧分色带
   - 阶段 12：白天落樱 / 夜晚落雨互斥置换（0.35s 淡变）+ 波纹重做（细软冷光环）

   边界：
   - 非首页零开销：容器不存在时不加载 three 与任何子模块
   - WebGL 不可用或初始化失败：不加 .is-live，保留 extra.css 的 CSS 雨天降级层
   - prefers-reduced-motion：不启动主循环，镜头停在全景机位（第 12 节降级口径）
   - three 来自仓库内 vendor（three@0.160.0），运行时不请求 CDN
   ============================================================= */
(function () {
  "use strict";

  var CONTAINER_ID = "convenience-scene";
  var LIVE_CLASS = "is-live";
  var PIXEL_RATIO_MAX = 2;

  var prefersReduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  var current = null; // 已挂载的场景句柄：{ container, destroy() }
  var pending = null; // 正在异步加载模块的句柄：{ container }

  /* ---------- 0. 加载 three 与场景子模块 ----------
     主入口优先用首页 import map 的裸标识符 "three"；若 import map 尚未生效
     （例如从深链接页 navigation.instant 切回首页），退回显式 vendor 路径。
     子模块通过相对 URL 动态加载，因此只有首页会付出这部分网络开销。
     子模块不自己 import three，统一接收这里传入的 THREE 实例，避免多份运行时。 */
  function loadModules() {
    return Promise.all([
      import("three").catch(function () {
        return import(new URL("../vendor/three/build/three.module.js", import.meta.url).href);
      }),
      import("./materials.mjs"),
      import("./canvas-textures.mjs"),
      import("./scene-builder.mjs"),
      import("./interior-builder.mjs"),
      import("./camera-rig.mjs"),
      import("./animation-loop.mjs"),
      import("./rain-system.mjs"),
      loadReflector(),
      loadOrbitControls()
    ]);
  }

  /* Reflector 是 addons 模块，内部用裸标识符 import 'three'：
     有 import map 时直接可用；万一解析不了就返回 null，
     湿地面自动退化为「低粗糙度湿面 + 高光条纹」，不影响其余功能。 */
  function loadReflector() {
    return import("three/addons/objects/Reflector.js").then(function (mod) {
      return mod.Reflector || null;
    }).catch(function () {
      return import(new URL("../vendor/three/examples/jsm/objects/Reflector.js", import.meta.url).href)
        .then(function (mod) { return mod.Reflector || null; })
        .catch(function () { return null; });
    });
  }

  /* OrbitControls 也是 addons 模块（内部裸标识符 import 'three'）：
     拿不到就退化成「只有滚动镜头、没有拖拽缩放」，其余功能不受影响。 */
  function loadOrbitControls() {
    return import("three/addons/controls/OrbitControls.js").then(function (mod) {
      return mod.OrbitControls || null;
    }).catch(function () {
      return import(new URL("../vendor/three/examples/jsm/controls/OrbitControls.js", import.meta.url).href)
        .then(function (mod) { return mod.OrbitControls || null; })
        .catch(function () { return null; });
    });
  }

  /* 画质档：窄屏或触屏降载（第 14.7 节的雨滴数量策略） */
  function qualityProfile() {
    var coarse = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;
    var low = coarse || window.innerWidth < 900;
    return {
      rain: low ? 54 : 96,
      rainSize: low ? 0.26 : 0.22,
      drips: low ? 4 : 8,
      ripples: low ? 10 : 18,   // 阶段 12：更小更多（方案 §4.6.3）
      petals: low ? 24 : 48,    // 阶段 9：白昼唯一降水（方案 §4.2.3）
      reflection: !low
    };
  }

  /* ---------- 1. 读取 extra.css 的场景 tokens ----------
     Material 把明暗主题写在 <body data-md-color-scheme> 上，两套 tokens
     都定义在 extra.css 第 1 节，这里只负责取出来交给 materials 映射。 */
  function readTokens() {
    var styles = window.getComputedStyle(document.body);
    function token(name, fallback) {
      var value = styles.getPropertyValue(name);
      return value && value.trim() ? value.trim() : fallback;
    }
    return {
      scheme: document.body.getAttribute("data-md-color-scheme") || "default",
      sky1: token("--nmd-sky-1", "#bcc9d9"),
      sky2: token("--nmd-sky-2", "#d3dde8"),
      sky3: token("--nmd-sky-3", "#eaf0f6"),
      ground1: token("--nmd-ground-1", "#b7c3d2"),
      card: token("--nmd-card", "#ffffff"),
      line: token("--nmd-line", "#dfe4ff"),
      shop: token("--nmd-shop", "rgb(255, 180, 102)"),
      outline: token("--nmd-outline", "#2b3446"),
      // 阶段 11：远景天际线颜色/透明度（方案 §4.4）
      city: token("--nmd-city", "rgba(62, 82, 112, 0.2)")
    };
  }

  /* ---------- 2. 创建场景 ---------- */
  function createScene(THREE, modules, container) {
    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAX));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    var canvas = renderer.domElement;
    /* 第 12 节：画布用 aria-label 说明这是雨夜便利店微缩模型。
       用 role="img" 而不是 aria-hidden：它在阶段 6 之后是可交互的品牌元素。
       容器上的 aria-hidden 已随之去掉（见 docs/index.md）。 */
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "雨夜便利店街角微缩模型");

    var tokens = readTokens();
    var scene = new THREE.Scene();
    var sky = modules.materials.createSky(THREE);
    sky.update(tokens);
    scene.background = sky.texture;

    // 程序化贴图（阶段 4）：所有可见文字与标线都由运行时 canvas 生成
    var textures = modules.canvasTextures.createTextureLibrary(THREE);
    var maxAnisotropy = renderer.capabilities.getMaxAnisotropy
      ? renderer.capabilities.getMaxAnisotropy()
      : 1;
    Object.keys(textures.textures).forEach(function (key) {
      textures.textures[key].anisotropy = maxAnisotropy;
    });

    // 共享材质库：三渲二材质 + 描边工具 + 贴片材质工厂
    var library = modules.materials.createMaterialLibrary(THREE, textures.textures);
    library.update(tokens);

    // 白盒街区几何：底座、便利店体块、车行道与人行道、斑马线、路灯与电线杆
    var blockout = modules.sceneBuilder.buildScene(THREE, library);
    scene.add(blockout.group);

    // 店内陈列：货架、饮料柜、便当区、收银台、关东煮柜台、后场门（阶段 3）
    var interior = modules.interiorBuilder.buildInterior(THREE, library);
    scene.add(interior.group);

    // 昼夜灯光：冷色环境光 + 店内暖色点光 + 街灯暖黄
    var lighting = modules.materials.createLighting(THREE, modules.sceneBuilder.LIGHT_ANCHORS);
    lighting.update(tokens);
    scene.add(lighting.group);

    // 阶段 5 + 12：雨 / 滴水 / 波纹 / 玻璃雨痕（白天整族隐藏，夜晚淡入）
    var quality = qualityProfile();
    var rain = modules.rainSystem.createRainSystem(THREE, {
      drip: modules.sceneBuilder.DRIP_LINE,
      quality: quality,
      rippleTexture: textures.textures && textures.textures.ripple,
      prefersReduced: prefersReduced
    });
    rain.setTheme(tokens);
    scene.add(rain.group);

    // 阶段 9 + 12 + 14：白昼樱吹雪（与雨互斥；阶段 14 迁至新树冠，方案 §9）
    var petals = modules.rainSystem.createPetalSystem(THREE, {
      count: quality.petals,
      center: {
        x: modules.sceneBuilder.SAKURA.canopy[0],
        y: modules.sceneBuilder.SAKURA.canopy[1] + 0.15,
        z: modules.sceneBuilder.SAKURA.canopy[2]
      },
      map: textures.textures && textures.textures.petal,
      prefersReduced: prefersReduced
    });
    petals.setTheme(tokens);
    scene.add(petals.points);

    // 湿地面：桌面走 Reflector 真反射，移动端/弱设备退化为高光条纹
    var wet = modules.rainSystem.createWetGround(THREE, {
      Reflector: modules.reflector,
      quality: quality
    });
    wet.setTheme(tokens);
    scene.add(wet.group);

    // 镜头：三机位关键帧由 camera-rig 持有，相机只在这里创建一次
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    var rig = modules.cameraRig.createCameraRig(THREE, camera, {
      OrbitControls: modules.orbitControls,
      domElement: canvas
    });

    /* ---------- 交互模式（第 6.2 / 14.8 节） ----------
       指针事件策略：画布默认 pointer-events: none，不抢页面滚动。
       桌面（精细指针）：按住 Alt / Shift 进入交互模式——画布接管拖拽与滚轮，
         松开立刻退出；此时页面文字不可选中（user-select: none），退出即恢复。
       触屏（粗指针）：不做修饰键，交给 CSS 的 touch-action: pan-y ——
         竖向滑动继续滚页面，横向拖动转动模型，双指缩放拉近拉远。 */
    var interactive = false;
    var coarsePointer = window.matchMedia
      ? window.matchMedia("(pointer: coarse)").matches
      : false;

    function setInteractive(next) {
      if (interactive === next) return;
      interactive = next;
      rig.setInteractive(next);
      document.documentElement.classList.toggle("nmd-interact", next);
    }

    function onKeyDown(event) {
      if (event.altKey || event.shiftKey) setInteractive(true);
    }

    function onKeyUp(event) {
      if (!event.altKey && !event.shiftKey) setInteractive(false);
    }

    function onWindowBlur() {
      setInteractive(false);
    }

    if (rig.hasControls) {
      if (coarsePointer) {
        setInteractive(true);
      } else {
        document.documentElement.addEventListener("keydown", onKeyDown);
        document.documentElement.addEventListener("keyup", onKeyUp);
        window.addEventListener("blur", onWindowBlur);
      }
    }

    // 减弱动效：镜头锁定在全景机位，不随滚动推进（第 12 节）
    rig.setScrollLocked(prefersReduced);

    // 环境动效：自动门、招牌抖动、远处信号灯
    var effects = modules.animationLoop.createAmbientEffects(THREE, scene, library);

    /* ---------- 渲染与尺寸自适应 ---------- */
    var rafId = null;
    var resizeObserver = null;
    var themeObserver = null;
    var released = false;

    function render() {
      renderer.render(scene, camera);
    }

    // reduced-motion 下直接同步重绘；否则用 rAF 合并连续的 resize 事件
    function scheduleRender() {
      if (prefersReduced) {
        render();
        return;
      }
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = null;
        render();
      });
    }

    function resize() {
      var width = container.clientWidth || window.innerWidth;
      var height = container.clientHeight || window.innerHeight;
      if (!width || !height) return;
      var aspect = width / height;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_MAX));
      renderer.setSize(width, height, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      rig.setAspect(aspect);
      scheduleRender();
    }

    /* ---------- 主题实时换色（第 14.4 节） ----------
       切主题时几何、相机、材质数量都不变，只重算 tokens → 材质颜色 / 自发光 /
       分档贴图 / 灯光强度，然后补一帧。主循环在镜头静止时不重绘，所以这里必须
       主动 render()，否则 reduced-motion 与静止状态下切主题不会更新画面。
       阶段 12 互斥（方案 §4.5.2）：先错峰收掉出场族（0.35s），再放出入场族，
       保证 0.35s 切换窗口内不出现雨 + 花瓣同框。 */
    var themeEpoch = 0;
    var themeInTimer = null;

    function applyTheme() {
      var epoch = ++themeEpoch;
      if (themeInTimer !== null) {
        clearTimeout(themeInTimer);
        themeInTimer = null;
      }
      tokens = readTokens();
      library.update(tokens);
      lighting.update(tokens);
      wet.setTheme(tokens);
      sky.update(tokens);

      var dark = tokens.scheme === "slate";

      if (prefersReduced) {
        // 减弱动效：两族都直接落定，无交叉窗口
        rain.setTheme(tokens);
        petals.setTheme(tokens);
        render();
        return;
      }

      // 阶段 1 互斥（方案 §4.5.2）：双族 fadeTarget 先都压到 0——
      // 出场族在接下来 0.35s 内淡出，入场族保持隐藏，窗口内绝不两族同框。
      rain.setThemeTargets(tokens, 0);
      petals.setThemeTargets(tokens, 0);

      // 阶段 2：0.35s 后出场族已到 0，再按最终主题放出入场族
      themeInTimer = setTimeout(function () {
        themeInTimer = null;
        if (epoch !== themeEpoch || released) return;
        rain.setThemeTargets(tokens);
        petals.setThemeTargets(tokens);
        render();
      }, 350);

      render();
    }

    /* ---------- 主循环：逐帧读 --nmd-scroll，镜头动到哪就渲染到哪 ---------- */
    var loop = modules.animationLoop.createAnimationLoop({
      container: container,
      prefersReduced: prefersReduced,
      frozen: prefersReduced,
      onFrame: function (dt) {
        // 阶段 5 起画面每帧都在动（雨持续下落），所以正常模式每帧都画；
        // 减弱动效时动效全部冻结，只在用户拖拽 / 缩放让镜头真的动了才补一帧，
        // 静态画面不空转渲染（第 12 节）。页面不可见 / 容器离屏时主循环整体暂停。
        var moved = rig.update(dt);
        if (!prefersReduced || moved) render();
      }
    });
    loop.add(function (dt) { rain.update(dt, prefersReduced); });
    loop.add(function (dt, elapsed) { petals.update(dt, elapsed, prefersReduced); });
    loop.add(effects.update);

    /* ---------- 销毁：初始化失败回滚 + navigation.instant 离开首页 ---------- */
    function release() {
      if (released) return;
      released = true;
      if (themeInTimer !== null) {
        clearTimeout(themeInTimer);
        themeInTimer = null;
      }
      loop.dispose();
      setInteractive(false);
      if (rig.hasControls) {
        document.documentElement.removeEventListener("keydown", onKeyDown);
        document.documentElement.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", onWindowBlur);
        if (rig.disposeControls) rig.disposeControls();
      }
      if (themeObserver) {
        themeObserver.disconnect();
        themeObserver = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      } else {
        window.removeEventListener("resize", resize);
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }

      blockout.dispose();
      interior.dispose();
      rain.dispose();
      petals.dispose();
      wet.dispose();
      effects.dispose();
      lighting.dispose();
      library.dispose();
      textures.dispose();
      sky.dispose();
      renderer.dispose();
      if (typeof renderer.forceContextLoss === "function") {
        renderer.forceContextLoss();
      }

      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      container.classList.remove(LIVE_CLASS);
    }

    // 到这里为止还没有产生副作用（renderer 尚未插进 DOM）。真正改 DOM 的只有
    // 下面几步，任意一步失败都会回滚，避免半成品 canvas 盖住 CSS 降级层。
    try {
      rig.snap(0); // 首帧先站在全景机位，避免从原点飞过来
      container.appendChild(canvas);
      if ("ResizeObserver" in window) {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
      } else {
        window.addEventListener("resize", resize, { passive: true });
      }
      resize();
      render();
      // canvas 渲染出第一帧后才接管：CSS 同时淡出降级层、去掉容器缩放与漂移
      container.classList.add(LIVE_CLASS);
      // reduced-motion 时 sync() 不会启动循环，画面停在首帧机位
      loop.sync();
      // 主题观察放在最后：此时场景已经完全可用，换色失败也不会影响首帧
      if ("MutationObserver" in window) {
        themeObserver = new MutationObserver(applyTheme);
        themeObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ["data-md-color-scheme"]
        });
      }
      // 验收/调试用的只读句柄（阶段 7 的性能核对也要用）：不挂全局变量，
      // 只挂在首页容器上，离场时随 DOM 一起消失
      container.nmdScene = { renderer: renderer, scene: scene, camera: camera, loop: loop, rig: rig };
    } catch (err) {
      release();
      throw err;
    }

    return { container: container, destroy: release };
  }

  /* ---------- 3. 初始化 / 清理 ---------- */
  function init() {
    if (current || pending) return;
    var container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    var handle = { container: container };
    pending = handle;
    loadModules().then(function (modules) {
      if (pending !== handle) return; // 加载期间已离场或已重新初始化
      pending = null;
      if (current || !container.isConnected) return;
      try {
        current = createScene(modules[0], {
          materials: modules[1],
          canvasTextures: modules[2],
          sceneBuilder: modules[3],
          interiorBuilder: modules[4],
          cameraRig: modules[5],
          animationLoop: modules[6],
          rainSystem: modules[7],
          reflector: modules[8],
          orbitControls: modules[9]
        }, container);
      } catch (err) {
        fail(err);
      }
    }).catch(function (err) {
      if (pending === handle) pending = null;
      fail(err);
    });
  }

  function fail(err) {
    // 不抛出、不白屏：CSS 降级层继续显示
    if (window.console && window.console.warn) {
      window.console.warn("[convenience-scene] Three.js 场景未启用，保留 CSS 降级层：", err);
    }
  }

  function teardown() {
    pending = null;
    if (!current) return;
    current.destroy();
    current = null;
  }

  function nodeRemoved(removedNodes, node) {
    for (var i = 0; i < removedNodes.length; i++) {
      if (removedNodes[i] === node || removedNodes[i].contains(node)) return true;
    }
    return false;
  }

  init();

  /* ---------- 4. 兼容 navigation.instant ----------
     extra_javascript 只在首次加载执行一次；主题用 XHR 替换内容区后，
     这里观察 <html> 的节点增删：容器被移除就销毁 renderer 与主循环，
     容器重新出现就重新初始化，避免后台残留 WebGL 上下文与事件监听 */
  if ("MutationObserver" in window) {
    new MutationObserver(function (mutations) {
      var removed = false;
      for (var i = 0; i < mutations.length; i++) {
        var nodes = mutations[i].removedNodes;
        if (!nodes.length) continue;
        if ((current && nodeRemoved(nodes, current.container)) ||
            (pending && nodeRemoved(nodes, pending.container))) {
          removed = true;
          break;
        }
      }
      if (removed) teardown();
      init();
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

/* =============================================================
   墨海寻珠 · 首页微交互（打字机 / 滚动显现 / 卡片聚光）
   设计文档：.documents/首页美化设计与工作日志.md
   - 非首页零开销：仅当 .nmd-hero 存在时初始化
   - 兼容 navigation.instant：MutationObserver 监听 .nmd-hero
     出现 —— 页面经 XHR 替换后脚本虽不重执行，但 DOM 插入会
     触发观察器，自动重新初始化（修复「点击主页空白」bug）
   - 无 JS 兜底：给 <html> 加 .nmd-js 类，滚动显现的隐藏态
     只在 JS 可用时生效（见 extra.css 第 8 节）
   ============================================================= */
(function () {
  "use strict";

  // 标记 JS 可用（CSS 据此决定是否启用「先隐藏再显现」）
  document.documentElement.classList.add("nmd-js");

  /* ---------- 4. 全屏 Hero 视口变量 ----------
     100vw 含滚动条宽度而布局视口不含（经典滚动条系统相差 15~17px），
     把差值写入 --nmd-sb，extra.css 的 hero 据此微调宽度与负边距，
     使其精确贴齐布局视口左右边缘；overlay 滚动条系统差值为 0，无影响 */
  function setViewportVars() {
    var sb = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--nmd-sb", sb + "px");
  }
  setViewportVars();
  window.addEventListener("resize", setViewportVars);

  var prefersReduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  var typeTimer = null; // 打字机计时器（跨初始化实例，重新初始化前先清理）
  var io = null;        // 滚动显现观察器（同上）
  var typeEl = null;      // 打字机元素引用（定格时使用）
  var typePhrases = null; // 打字机短语表引用
  var typePi = 0;         // 打字机当前短语下标

  /* ---------- 5. 电影片头序列状态（跨初始化实例管理） ---------- */
  var seqTimers = [];     // 序列定时器列表
  var seqScroll = null;   // 当前平滑滚动取消句柄
  var seqActive = false;  // 序列是否进行中
  var seqHero = null;     // 当前序列所在的 hero
  var parallaxRaf = null; // 鼠标视差 rAF 句柄
  var parallaxEls = null; // 视差图层引用 {far, mid, near}
  var parallaxIO = null;  // hero 视口观察器
  var seqCleanupFns = []; // 序列监听器移除函数列表

  /* ---------- 1. 打字机副题 ---------- */
  function startTypewriter(el) {
    if (prefersReduced) {
      el.textContent = "在知识的海洋里，挖掘每一颗智慧的明珠 🦪";
      return;
    }
    typeEl = el;
    var phrases = [
      "在知识的海洋里，挖掘每一颗智慧的明珠 🦪",
      "从 2025 年 1 月 15 日写起，记录成长的足迹",
      "课程笔记 · 自学笔记 · 科研笔记 · 读书笔记"
    ];
    typePhrases = phrases;
    var pi = 0, ci = 0, deleting = false;
    typePi = pi;

    clearTimeout(typeTimer); // 防重复初始化叠加计时器

    function step() {
      var current = phrases[pi];
      if (!deleting) {
        ci++;
        el.textContent = current.slice(0, ci);
        if (ci === current.length) {
          deleting = true;
          typeTimer = setTimeout(step, 2200); // 停顿后回删
        } else {
          typeTimer = setTimeout(step, 70 + Math.random() * 60);
        }
      } else {
        ci--;
        el.textContent = current.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
          typePi = pi;
          typeTimer = setTimeout(step, 450);
        } else {
          typeTimer = setTimeout(step, 34);
        }
      }
    }
    step();
  }

  /* ---------- 2. 滚动显现 ---------- */
  function startReveal() {
    var reveals = document.querySelectorAll(".nmd-reveal");
    if (!reveals.length) return;
    if (io) io.disconnect(); // 防重复初始化叠加观察器
    if ("IntersectionObserver" in window && !prefersReduced) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }

  /* ---------- 3. 卡片聚光跟随（--mx / --my） ---------- */
  function bindSpotlight() {
    document.querySelectorAll(".nmd-spot").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- 5. 电影片头序列（initHeroSequence） ----------
     时间轴：a=0ms 冷开场 → b=1200ms 显影（打字机开始）→ c=3400ms 单镜头推进
     → d=5800ms 门板关闭 → 6800ms 暗场平滑滚动至 #nmd-intro →
     滚动完成 → e 门板打开 → +800ms 收尾（is-done，内容全可见）。
     所有隐藏态都由 data-nmd-seq="running" 门控；序列结束/中断即全量可见；
     prefers-reduced-motion 时完全跳过（不设 running、不滚动）。 */
  function clearSeqTimers() {
    seqTimers.forEach(function (id) { clearTimeout(id); });
    seqTimers = [];
  }

  function cancelSeqScroll() {
    if (seqScroll) { seqScroll(); seqScroll = null; }
  }

  function removeInterruptListeners() {
    seqCleanupFns.forEach(function (fn) { fn(); });
    seqCleanupFns = [];
  }

  /* 手动平滑滚动（返回取消句柄；滚动可中断，不固定 setTimeout 假设滚动必结束） */
  function smoothScrollTo(targetY, duration, onDone) {
    var startY = window.pageYOffset || document.documentElement.scrollTop;
    var delta = targetY - startY;
    var startT = null;
    var raf = null;
    var finished = false;

    function frame(t) {
      if (finished) return;
      if (startT === null) startT = t;
      var p = Math.min(1, (t - startT) / duration);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      window.scrollTo(0, startY + delta * eased);
      if (p < 1) { raf = requestAnimationFrame(frame); }
      else { finished = true; if (onDone) onDone(); }
    }

    function cancel() {
      if (finished) return;
      finished = true;
      if (raf) cancelAnimationFrame(raf);
    }

    raf = requestAnimationFrame(frame);
    return cancel;
  }

  /* 打字机定格：序列结束后停在当前短语完整文本（阅读回落）；
     若打字机尚未启动（过早中断/跳过），直接写入首句完整文本 */
  function freezeTypewriter() {
    clearTimeout(typeTimer);
    var el = typeEl || document.getElementById("nmd-typewriter");
    if (el) {
      el.textContent = (typePhrases && typePhrases[typePi]) || "在知识的海洋里，挖掘每一颗智慧的明珠 🦪";
    }
  }

  function finishSequence() {
    seqActive = false;
    clearSeqTimers();
    cancelSeqScroll();
    if (seqHero) {
      seqHero.classList.add("is-done");
      seqHero.removeAttribute("data-nmd-phase");
      seqHero.removeAttribute("data-nmd-seq");
    }
    freezeTypewriter();
    removeInterruptListeners();
    seqHero = null;
  }

  function interruptSequence() {
    if (!seqActive) return;
    seqActive = false;
    clearSeqTimers();
    cancelSeqScroll();
    finishSequence();
  }

  function nodeRemoved(removedNodes, hero) {
    for (var i = 0; i < removedNodes.length; i++) {
      if (removedNodes[i] === hero || removedNodes[i].contains(hero)) return true;
    }
    return false;
  }

  /* 完整清理（重新初始化前调用：清定时器/滚动/监听/视差） */
  function cleanupSequence() {
    clearSeqTimers();
    cancelSeqScroll();
    clearTimeout(typeTimer);
    removeInterruptListeners();
    if (parallaxRaf) { cancelAnimationFrame(parallaxRaf); parallaxRaf = null; }
    if (parallaxIO) { parallaxIO.disconnect(); parallaxIO = null; }
    if (parallaxEls) {
      if (parallaxEls.far) parallaxEls.far.style.translate = "";
      if (parallaxEls.mid) parallaxEls.mid.style.translate = "";
      if (parallaxEls.near) parallaxEls.near.style.translate = "";
    }
    parallaxEls = null;
    seqHero = null;
    seqActive = false;
  }

  function addInterruptListeners() {
    var wheel = function () { interruptSequence(); };
    var touch = function () { interruptSequence(); };
    var key = function (e) {
      if (e.key && [" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].indexOf(e.key) !== -1) {
        interruptSequence();
      }
    };
    var skip = document.getElementById("nmd-skip");
    var click = function () { interruptSequence(); };

    window.addEventListener("wheel", wheel, { passive: true, capture: true });
    window.addEventListener("touchstart", touch, { passive: true, capture: true });
    window.addEventListener("keydown", key);
    if (skip) skip.addEventListener("click", click);

    seqCleanupFns.push(function () {
      window.removeEventListener("wheel", wheel, { capture: true });
      window.removeEventListener("touchstart", touch, { capture: true });
      window.removeEventListener("keydown", key);
      if (skip) skip.removeEventListener("click", click);
    });
  }

  /* 桌面端鼠标视差（仅 pointer:fine；用独立 translate 属性，与 phase 推进的
     transform scale 互不冲突；rAF 节流；序列结束或离开视口后自动解除） */
  function bindParallax(hero) {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    var far = hero.querySelector(".nmd-layer-far");
    var mid = hero.querySelector(".nmd-layer-mid");
    var near = hero.querySelector(".nmd-layer-near");
    if (!far || !mid || !near) return;
    parallaxEls = { far: far, mid: mid, near: near };

    var heroVisible = true;
    if ("IntersectionObserver" in window) {
      parallaxIO = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }, { threshold: 0.02 });
      parallaxIO.observe(hero);
    }

    var lastX = 0, lastY = 0;

    function tick() {
      parallaxRaf = null;
      if (!seqActive && !heroVisible) {
        if (parallaxEls.far) parallaxEls.far.style.translate = "";
        if (parallaxEls.mid) parallaxEls.mid.style.translate = "";
        if (parallaxEls.near) parallaxEls.near.style.translate = "";
        return;
      }
      var nx = (lastX / window.innerWidth - 0.5) * 2;   // -1..1
      var ny = (lastY / window.innerHeight - 0.5) * 2;
      if (parallaxEls.far) parallaxEls.far.style.translate = (nx * 6).toFixed(2) + "px " + (ny * 6).toFixed(2) + "px";
      if (parallaxEls.mid) parallaxEls.mid.style.translate = (nx * 8).toFixed(2) + "px " + (ny * 8).toFixed(2) + "px";
      if (parallaxEls.near) parallaxEls.near.style.translate = (nx * 4).toFixed(2) + "px " + (ny * 4).toFixed(2) + "px";
    }

    var move = function (e) {
      lastX = e.clientX;
      lastY = e.clientY;
      if (parallaxRaf) return;
      parallaxRaf = requestAnimationFrame(tick);
    };

    hero.addEventListener("mousemove", move);
  }

  /* 序列主入口：设置 running 并按时间轴推进相位；prefersReduced 直接 done 态 */
  function initHeroSequence(hero) {
    var intro = document.getElementById("nmd-intro");
    if (prefersReduced || !intro) {
      hero.classList.add("is-done");
      return;
    }
    seqHero = hero;
    seqActive = true;

    bindParallax(hero);
    addInterruptListeners();

    // Phase A：冷开场（0ms）
    hero.dataset.nmdSeq = "running";
    hero.dataset.nmdPhase = "a";

    // Phase B：显影建立（1200ms）—— 打字机此时开始
    seqTimers.push(setTimeout(function () {
      if (!seqActive) return;
      hero.dataset.nmdPhase = "b";
      var twEl = document.getElementById("nmd-typewriter");
      if (twEl) startTypewriter(twEl);
    }, 1200));

    // Phase C：单镜头推进（3400ms）
    seqTimers.push(setTimeout(function () {
      if (!seqActive) return;
      hero.dataset.nmdPhase = "c";
    }, 3400));

    // Phase D：门板关闭（5800ms）
    seqTimers.push(setTimeout(function () {
      if (!seqActive) return;
      hero.dataset.nmdPhase = "d";
    }, 5800));

    // Phase E：门板关闭的暗场期间平滑滚动（6800ms），滚动完成后开门并收尾
    seqTimers.push(setTimeout(function () {
      if (!seqActive) return;
      var targetY = intro.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
      seqScroll = smoothScrollTo(targetY, 900, function () {
        if (!seqActive) return;
        hero.dataset.nmdPhase = "e"; // 门板打开
        seqTimers.push(setTimeout(function () {
          finishSequence();
        }, 800));
      });
    }, 6800));
  }

  /* ---------- 初始化（同一 DOM 实例只执行一次） ---------- */
  function initHome() {
    var hero = document.querySelector(".nmd-hero");
    if (!hero || hero.dataset.nmdInit) return; // 非首页 / 已初始化则跳过
    hero.dataset.nmdInit = "1";

    cleanupSequence(); // 先清理上一实例的序列定时器/滚动/监听（instant 换页后不叠加）

    var twEl = document.getElementById("nmd-typewriter");
    var willRun = !prefersReduced && !!document.getElementById("nmd-intro");
    if (!willRun && twEl) startTypewriter(twEl); // 无序列（降级/无锚点）时保持原打字机行为
    startReveal();
    bindSpotlight();
    initHeroSequence(hero);
  }

  initHome();

  /* ---------- 兼容 navigation.instant ----------
     点击链接时主题用 XHR 替换内容区，extra_javascript 不会重执行；
     观察 <html>（不会被替换）下的节点插入，发现新 hero 即重新初始化；
     若序列进行中 hero 被移除（换页），立即清理，防止后台定时器/滚动泄漏 */
  if ("MutationObserver" in window) {
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (seqHero && mutations[i].removedNodes.length && nodeRemoved(mutations[i].removedNodes, seqHero)) {
          cleanupSequence();
        }
        if (mutations[i].addedNodes.length) {
          initHome();
          break;
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

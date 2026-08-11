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

  var prefersReduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  var typeTimer = null; // 打字机计时器（跨初始化实例，重新初始化前先清理）
  var io = null;        // 滚动显现观察器（同上）

  /* ---------- 1. 打字机副题 ---------- */
  function startTypewriter(typeEl) {
    if (prefersReduced) {
      typeEl.textContent = "在知识的海洋里，挖掘每一颗智慧的明珠 🦪";
      return;
    }
    var phrases = [
      "在知识的海洋里，挖掘每一颗智慧的明珠 🦪",
      "从 2025 年 1 月 15 日写起，记录成长的足迹",
      "课程笔记 · 自学笔记 · 科研笔记 · 读书笔记"
    ];
    var pi = 0, ci = 0, deleting = false;

    clearTimeout(typeTimer); // 防重复初始化叠加计时器

    function step() {
      var current = phrases[pi];
      if (!deleting) {
        ci++;
        typeEl.textContent = current.slice(0, ci);
        if (ci === current.length) {
          deleting = true;
          typeTimer = setTimeout(step, 2200); // 停顿后回删
        } else {
          typeTimer = setTimeout(step, 70 + Math.random() * 60);
        }
      } else {
        ci--;
        typeEl.textContent = current.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
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

  /* ---------- 初始化（同一 DOM 实例只执行一次） ---------- */
  function initHome() {
    var hero = document.querySelector(".nmd-hero");
    if (!hero || hero.dataset.nmdInit) return; // 非首页 / 已初始化则跳过
    hero.dataset.nmdInit = "1";

    var typeEl = document.getElementById("nmd-typewriter");
    if (typeEl) startTypewriter(typeEl);
    startReveal();
    bindSpotlight();
  }

  initHome();

  /* ---------- 兼容 navigation.instant ----------
     点击链接时主题用 XHR 替换内容区，extra_javascript 不会重执行；
     观察 <html>（不会被替换）下的节点插入，发现新 hero 即重新初始化 */
  if ("MutationObserver" in window) {
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length) {
          initHome();
          break;
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

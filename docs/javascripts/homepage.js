/* =============================================================
   墨海寻珠 · 首页交互（章节淡入淡出 / 滚动进度 / 卡片聚光）
   设计文档：.documents/首页设计方案合集.md（v2 雨天便利店街角：亮色白天 / 暗色夜晚）
             .codex/PROJECT.md（第 6 节：粒子与动效实现规范）

   - 非首页零开销：仅当 .nmd-story 存在时初始化
   - 兼容 navigation.instant：extra_javascript 不会重复执行，用
     MutationObserver 监听内容区替换后重新初始化，并在离场时清理
   - 无 JS 兜底：<html>.nmd-js 由本脚本添加；章节的隐藏态只在
     观察器就绪（.nmd-story.nmd-fade）后生效，脚本未执行或中途
     出错时内容始终可见（见 extra.css 第 4 节）
   - prefers-reduced-motion：不做淡出与镜头漂移，只保留静态场景
   - --nmd-scroll：0~1 的滚动进度，供 CSS 背景层与后续 Three.js
     镜头路径（camera-rig）共用
   ============================================================= */
(function () {
  "use strict";

  var docEl = document.documentElement;
  docEl.classList.add("nmd-js");

  var prefersReduced = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* ---------- 0. 视口变量 ----------
     100vw 含滚动条宽度而布局视口不含（经典滚动条系统相差 15~17px），
     把差值写入 --nmd-sb，extra.css 的满视口区块据此贴齐布局视口左右边缘 */
  function setViewportVars() {
    var sb = window.innerWidth - docEl.clientWidth;
    docEl.style.setProperty("--nmd-sb", sb + "px");
  }
  setViewportVars();
  window.addEventListener("resize", setViewportVars, { passive: true });

  /* ---------- 跨初始化实例的状态 ---------- */
  var chapterIO = null;  // 章节观察器
  var scrollRaf = null;  // 滚动进度 rAF 句柄
  var storyRef = null;   // 当前首页内容层引用

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  /* ---------- 1. 章节淡入淡出 ----------
     章节进入视口中段时淡入，离开时淡出（根边距 -16% 定义激活带，
     高于一屏的长章节在阅读过程中始终落在带内，不会中途消失） */
  function startChapterFade(story) {
    var chapters = story.querySelectorAll(".nmd-chapter");
    if (!chapters.length) return;
    if (chapterIO) {
      chapterIO.disconnect();
      chapterIO = null;
    }

    if (prefersReduced || !("IntersectionObserver" in window)) {
      story.classList.remove("nmd-fade");
      each(chapters, function (el) { el.classList.add("is-active"); });
      return;
    }

    chapterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-active", entry.isIntersecting);
      });
    }, { rootMargin: "-16% 0px -16% 0px", threshold: 0 });

    each(chapters, function (el) { chapterIO.observe(el); });
    story.classList.add("nmd-fade"); // 观察器就绪后才启用隐藏态
  }

  /* ---------- 2. 滚动进度（--nmd-scroll） ----------
     由 rAF 节流后写入根元素，背景层据此做极轻微的镜头漂移；
     后续 Three.js 镜头路径可直接复用同一进度值 */
  function updateScrollProgress() {
    scrollRaf = null;
    var max = docEl.scrollHeight - window.innerHeight;
    var y = window.pageYOffset || docEl.scrollTop || 0;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    docEl.style.setProperty("--nmd-scroll", p.toFixed(4));
  }

  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(updateScrollProgress);
  }

  function startScrollProgress() {
    window.removeEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    updateScrollProgress();
  }

  /* ---------- 3. 卡片聚光跟随（--mx / --my） ---------- */
  function bindSpotlight(root) {
    each(root.querySelectorAll(".nmd-spot"), function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- 4. 初始化 / 清理 ---------- */
  function initHome() {
    var story = document.querySelector(".nmd-story");
    if (!story || story.dataset.nmdInit) return; // 非首页 / 已初始化则跳过
    story.dataset.nmdInit = "1";
    storyRef = story;

    startChapterFade(story);
    startScrollProgress();
    bindSpotlight(story);
  }

  function teardown() {
    if (chapterIO) {
      chapterIO.disconnect();
      chapterIO = null;
    }
    window.removeEventListener("scroll", onScroll);
    if (scrollRaf) {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = null;
    }
    if (storyRef) {
      storyRef = null;
    }
    docEl.style.setProperty("--nmd-scroll", "0");
  }

  function nodeRemoved(removedNodes, node) {
    for (var i = 0; i < removedNodes.length; i++) {
      if (removedNodes[i] === node || removedNodes[i].contains(node)) return true;
    }
    return false;
  }

  initHome();

  /* ---------- 5. 兼容 navigation.instant ----------
     主题用 XHR 替换内容区后 extra_javascript 不会重执行；观察
     <html>（不会被替换）的节点增删，新内容出现即初始化，首页
     内容被移除即清理观察器与滚动监听，避免后台开销 */
  if ("MutationObserver" in window) {
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (storyRef && mutations[i].removedNodes.length &&
            nodeRemoved(mutations[i].removedNodes, storyRef)) {
          teardown(); // 离开首页：先清理，再判断新页面是否需要重新初始化
          break;
        }
      }
      initHome();
    }).observe(docEl, { childList: true, subtree: true });
  }
})();

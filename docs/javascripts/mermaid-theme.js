/*
 * Mermaid 主题配置 —— 复刻 DeepSeek 思维导图配色
 *
 * 目标：mermaid 渲染配色与 DeepSeek 思维导图完全一致（classic 圆角风格）。
 * 所有色值均直接取自 DeepSeek 思维导图导出的 SVG（mermaid mindmap classic 渲染产物）：
 *   - cScale0-11      分支填充色（section-N → cScale(N+1)，12 色循环）
 *   - cScaleLabel0-11 分支文字色（蓝、紫分支为白色，其余黑色）
 *   - cScaleInv0-11   分支节点底部横线色（填充色色相 +180°）
 *   - git0 / gitBranchLabel0  根节点背景（深蓝）/ 根节点文字（白）
 *
 * 实现要点（多重保险，确保在任何加载时序下主题都生效）：
 *   1. theme 使用 "base"：mermaid 为自定义而设计的基础主题，themeVariables 完全生效
 *      （"default" 主题的 updateColors() 派生逻辑在部分场景会回退默认色板）。
 *   2. 包装 mermaid.initialize：Material for MkDocs 会自动调用，注入主题变量与 themeCSS。
 *   3. 包装 mermaid.render：每次渲染前强制重新注入主题配置——无论 Material 何时调用、
 *      配置是否被覆盖，渲染必定使用本主题（彻底消除时序竞态）。
 *   4. 若 mermaid 尚未加载（jsDelivr 失败时 Material 会兜底从 unpkg 动态加载），
 *      通过拦截 window.mermaid 赋值，在 Material 调用 initialize() 之前同步完成包装。
 *   5. mindmap 文字颜色通过 themeCSS 注入（Material 把 SVG 放进 closed Shadow DOM，
 *      页面级 CSS 无法穿透；themeCSS 随 SVG 注入 shadow 内部）。
 * 配套样式见 stylesheets/mermaid-theme.css。
 */

(function () {
  var wrapped = false;

  function applyTheme(m) {
    if (wrapped || !m || typeof m.initialize !== "function") return;
    wrapped = true;

    var themeVariables = {
      /* 分支填充色（12 色循环） */
      cScale0: "hsl(240, 100%, 76.2745098039%)", // 蓝
      cScale1: "hsl(60, 100%, 73.5294117647%)", // 黄
      cScale2: "hsl(80, 100%, 76.2745098039%)", // 黄绿
      cScale3: "hsl(270, 100%, 76.2745098039%)", // 紫
      cScale4: "hsl(300, 100%, 76.2745098039%)", // 紫红
      cScale5: "hsl(330, 100%, 76.2745098039%)", // 粉
      cScale6: "hsl(0, 100%, 76.2745098039%)", // 红
      cScale7: "hsl(30, 100%, 76.2745098039%)", // 橙
      cScale8: "hsl(90, 100%, 76.2745098039%)", // 绿
      cScale9: "hsl(150, 100%, 76.2745098039%)", // 青绿
      cScale10: "hsl(180, 100%, 76.2745098039%)", // 青
      cScale11: "hsl(210, 100%, 76.2745098039%)", // 天蓝

      /* 分支文字色（蓝、紫分支白色，其余黑色） */
      cScaleLabel0: "#ffffff",
      cScaleLabel1: "#000000",
      cScaleLabel2: "#000000",
      cScaleLabel3: "#ffffff",
      cScaleLabel4: "#000000",
      cScaleLabel5: "#000000",
      cScaleLabel6: "#000000",
      cScaleLabel7: "#000000",
      cScaleLabel8: "#000000",
      cScaleLabel9: "#000000",
      cScaleLabel10: "#000000",
      cScaleLabel11: "#000000",

      /* 分支节点底部横线色（填充色色相 +180°） */
      cScaleInv0: "hsl(60, 100%, 86.2745098039%)",
      cScaleInv1: "hsl(150, 100%, 83.5294117647%)",
      cScaleInv2: "hsl(260, 100%, 86.2745098039%)",
      cScaleInv3: "hsl(90, 100%, 86.2745098039%)",
      cScaleInv4: "hsl(120, 100%, 86.2745098039%)",
      cScaleInv5: "hsl(150, 100%, 86.2745098039%)",
      cScaleInv6: "hsl(180, 100%, 86.2745098039%)",
      cScaleInv7: "hsl(210, 100%, 86.2745098039%)",
      cScaleInv8: "hsl(270, 100%, 86.2745098039%)",
      cScaleInv9: "hsl(330, 100%, 86.2745098039%)",
      cScaleInv10: "hsl(0, 100%, 86.2745098039%)",
      cScaleInv11: "hsl(30, 100%, 86.2745098039%)",

      /* 根节点 */
      git0: "hsl(240, 100%, 46.2745098039%)", // 深蓝
      gitBranchLabel0: "#ffffff", // 白色文字
    };

    /*
     * mindmap 文字颜色修正（注入 themeCSS，随 SVG 进入 closed Shadow DOM）：
     *   分支文字默认黑色；紫色分支（section-2）白色；根节点（深蓝底）白色。
     */
    var MM_THEME_EXTRA_MARK = "/*mm-theme-extra*/";

    var mmThemeCss =
      MM_THEME_EXTRA_MARK +
      "\n" +
      ".mindmap-node text:not([class]):last-child{fill:#000000;}" +
      ".mindmap-node.section-2 text:not([class]):last-child{fill:#ffffff;}" +
      ".mindmap-node.section-root text:not([class]):last-child{fill:#ffffff;}";

    // 强制注入主题配置（initialize 与 render 共用）
    function forceTheme(config) {
      config = config || {};
      // theme 用 "base"：mermaid 为自定义设计的基础主题，themeVariables 完全生效
      config.theme = "base";
      config.look = "classic";
      config.themeVariables = Object.assign({}, config.themeVariables, themeVariables);
      // 合并 themeCSS：先剥离上次追加的部分（幂等），再追加文字颜色规则
      var base = (config.themeCSS || "").replace(/\/\*mm-theme-extra\*\/[\s\S]*$/, "");
      config.themeCSS = base + mmThemeCss;
      return config;
    }

    // 包装 mermaid.initialize（Material for MkDocs 会自动调用）
    var originalInit = m.initialize;
    m.initialize = function (config) {
      return originalInit(forceTheme(config));
    };

    // 包装 mermaid.render：每次渲染前强制注入——无论何时调用、配置如何，必定生效
    var originalRender = m.render;
    m.render = function (id, text, container) {
      try {
        var cfg = m.mermaidAPI.getConfig();
        m.mermaidAPI.updateSiteConfig(forceTheme(cfg));
      } catch (e) {
        /* 忽略：若 API 不可用则退回 initialize 包装 */
      }
      return originalRender.call(this, id, text, container);
    };

    // 立即初始化（Material 后续调用时本配置依然生效）
    m.initialize({});
  }

  // mermaid 已就绪：直接注入
  if (typeof mermaid !== "undefined") {
    applyTheme(mermaid);
    return;
  }

  // mermaid 尚未加载（jsDelivr 失败时 Material 会兜底从 unpkg 动态加载）：
  // 拦截 window.mermaid 赋值，在 Material 调用 initialize() 之前同步完成注入
  var _mermaid;
  Object.defineProperty(window, "mermaid", {
    get: function () {
      return _mermaid;
    },
    set: function (v) {
      _mermaid = v;
      applyTheme(v);
    },
    configurable: true,
  });
})();

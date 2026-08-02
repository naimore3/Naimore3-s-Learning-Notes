/*
 * Mermaid 主题配置
 *
 * 使用 mermaid v11 的 look: 'neo' 现代扁平风格 + 精心挑选的配色：
 *   - 亮色模式：柔和蓝绿清新风格
 *   - 暗色模式：Catppuccin Mocha 流行配色
 *
 * Mindmap 分支着色说明：
 *   渲染器 (assignSections) 给每个一级分支分配 section-N 类（按索引），
 *   分支内子节点继承同一 section，故"分支内同色、不同分支不同色"。
 *   颜色由 cScale0-cScale11 控制（section-N 对应 cScale(N+1)，12 色循环）。
 *
 * Material for MkDocs 会自动调用 mermaid.initialize()，
 * 因此拦截 initialize 以确保自定义主题变量始终生效。
 *
 * 参考：
 *   - https://mermaid.js.org/config/theming.html
 *   - https://squidfunk.github.io/mkdocs-material/reference/diagrams/
 */

(function () {
  if (typeof mermaid === "undefined") return;

  // 检测 Material for MkDocs 的颜色模式
  var scheme = document.body.getAttribute("data-md-color-scheme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var isDark = scheme === "slate" || (!scheme && prefersDark);

  /* ---------- 亮色模式：清新蓝绿 ---------- */
  var lightVars = {
    darkMode: false,
    background: "#ffffff",
    fontFamily: "inherit",
    fontSize: "18px", // 字体增大（默认 16px）
    useGradient: false, // 禁用渐变填充覆盖，保留分支色（base 默认 useGradient=true 会覆盖为 mainBkg）
    // 节点背景（递进层次）
    primaryColor: "#e8f1fd", // 柔和蓝
    secondaryColor: "#e6f7ee", // 柔和绿
    tertiaryColor: "#fdf3e3", // 柔和杏黄
    // 文字
    primaryTextColor: "#1f2d3d",
    secondaryTextColor: "#1f2d3d",
    tertiaryTextColor: "#1f2d3d",
    textColor: "#1f2d3d",
    // 边框
    primaryBorderColor: "#4a90d9",
    secondaryBorderColor: "#4caf80",
    tertiaryBorderColor: "#e0a24f",
    // 连线
    lineColor: "#7a8ba0",
    // 主背景
    mainBkg: "#e8f1fd",
    nodeBorder: "#4a90d9",
    nodeBkg: "#e8f1fd",
    clusterBkg: "#f6f9fd",
    clusterBorder: "#c9d6e5",
    titleColor: "#4a90d9",
    edgeLabelBackground: "#ffffff",
    // Mindmap 根节点
    git0: "#4a90d9",
    gitBranchLabel0: "#ffffff",
    cScale0: "#aecbfa", // 蓝
    cScale1: "#a7e3c0", // 绿
    cScale2: "#ffd9a8", // 杏
    cScale3: "#cfc3f7", // 紫
    cScale4: "#f8c8d8", // 粉
    cScale5: "#a8dff0", // 青
    cScale6: "#f7e6a8", // 黄
    cScale7: "#f5bcc8", // 玫红
    cScale8: "#b3e5d5", // 蓝绿
    cScale9: "#c9c9f5", // 薰衣草
    cScale10: "#f2c8bd", // 珊瑚
    cScale11: "#b8c4d4", // 灰蓝
    // 分支文字色（深色，配浅色背景可读）
    // 注意：neo 风格下根节点文字使用 cScaleLabel0，故设为白色
    cScaleLabel0: "#ffffff",
    cScaleLabel1: "#1f2d3d",
    cScaleLabel2: "#1f2d3d",
    cScaleLabel3: "#1f2d3d",
    cScaleLabel4: "#1f2d3d",
    cScaleLabel5: "#1f2d3d",
    cScaleLabel6: "#1f2d3d",
    cScaleLabel7: "#1f2d3d",
    cScaleLabel8: "#1f2d3d",
    cScaleLabel9: "#1f2d3d",
    cScaleLabel10: "#1f2d3d",
    cScaleLabel11: "#1f2d3d",
  };

  /* ---------- 暗色模式：Catppuccin Mocha ---------- */
  var darkVars = {
    darkMode: true,
    background: "#1e1e2e",
    fontFamily: "inherit",
    fontSize: "18px", // 字体增大（默认 16px）
    useGradient: false, // 禁用渐变填充覆盖，保留分支色（base 默认 useGradient=true 会覆盖为 mainBkg）
    // 节点背景（surface 递进层次）
    primaryColor: "#313244", // surface0
    secondaryColor: "#45475a", // surface1
    tertiaryColor: "#585b70", // surface2
    // 文字
    primaryTextColor: "#cdd6f4",
    secondaryTextColor: "#cdd6f4",
    tertiaryTextColor: "#cdd6f4",
    textColor: "#cdd6f4",
    // 边框
    primaryBorderColor: "#89b4fa", // blue
    secondaryBorderColor: "#a6e3a1", // green
    tertiaryBorderColor: "#fab387", // peach
    // 连线
    lineColor: "#6c7086", // overlay0
    // 主背景
    mainBkg: "#313244",
    nodeBorder: "#89b4fa",
    nodeBkg: "#313244",
    clusterBkg: "#181825", // mantle
    clusterBorder: "#45475a",
    titleColor: "#89b4fa",
    edgeLabelBackground: "#1e1e2e",
    // Mindmap 根节点（深蓝背景 + 白字，保证对比度）
    git0: "#5680c1",
    gitBranchLabel0: "#ffffff",
    /* Mindmap 分支色（Catppuccin accent 色系，12 色循环） */
    cScale0: "#89b4fa", // blue
    cScale1: "#a6e3a1", // green
    cScale2: "#fab387", // peach
    cScale3: "#cba6f7", // mauve
    cScale4: "#f5c2e7", // pink
    cScale5: "#94e2d5", // teal
    cScale6: "#f9e2af", // yellow
    cScale7: "#f38ba8", // red
    cScale8: "#89dceb", // sky
    cScale9: "#b4befe", // lavender
    cScale10: "#eba0ac", // maroon
    cScale11: "#74c7ec", // sapphire
    // 分支文字色（深色，配亮色分支背景可读）
    // 注意：neo 风格下根节点文字使用 cScaleLabel0，故设为白色
    cScaleLabel0: "#ffffff",
    cScaleLabel1: "#11111b",
    cScaleLabel2: "#11111b",
    cScaleLabel3: "#11111b",
    cScaleLabel4: "#11111b",
    cScaleLabel5: "#11111b",
    cScaleLabel6: "#11111b",
    cScaleLabel7: "#11111b",
    cScaleLabel8: "#11111b",
    cScaleLabel9: "#11111b",
    cScaleLabel10: "#11111b",
    cScaleLabel11: "#11111b",
  };

  var ourThemeVars = isDark ? darkVars : lightVars;

  // 追加 CSS（在 Shadow DOM 内部生效，故无法用 mermaid.css 外部样式）
  // 阴影：与节点方块同色系的浅色（色板变量定义在 mermaid.css，可穿透 shadow 边界）
  var MM_EXTRA_MARK = "/*mm-shadow-extra*/";
  var mmExtraCss =
    MM_EXTRA_MARK +
    "\n" +
    '[data-look="neo"].mindmap-node{' +
    "filter:drop-shadow(1px 2px 2px color-mix(in srgb,currentColor 55%,white));" +
    "}" +
    '[data-look="neo"].mindmap-node.section-root,' +
    '[data-look="neo"].mindmap-node.section--1{color:var(--mm-shadow-root);}' +
    '[data-look="neo"].mindmap-node.section-0{color:var(--mm-shadow-0);}' +
    '[data-look="neo"].mindmap-node.section-1{color:var(--mm-shadow-1);}' +
    '[data-look="neo"].mindmap-node.section-2{color:var(--mm-shadow-2);}' +
    '[data-look="neo"].mindmap-node.section-3{color:var(--mm-shadow-3);}' +
    '[data-look="neo"].mindmap-node.section-4{color:var(--mm-shadow-4);}' +
    '[data-look="neo"].mindmap-node.section-5{color:var(--mm-shadow-5);}' +
    '[data-look="neo"].mindmap-node.section-6{color:var(--mm-shadow-6);}' +
    '[data-look="neo"].mindmap-node.section-7{color:var(--mm-shadow-7);}' +
    '[data-look="neo"].mindmap-node.section-8{color:var(--mm-shadow-8);}' +
    '[data-look="neo"].mindmap-node.section-9{color:var(--mm-shadow-9);}' +
    '[data-look="neo"].mindmap-node.section-10{color:var(--mm-shadow-10);}';

  // 拦截 mermaid.initialize，防止 Material for MkDocs 覆盖主题
  var originalInit = mermaid.initialize;
  mermaid.initialize = function (config) {
    config = config || {};
    config.theme = "base";
    config.look = "neo"; // 现代扁平风格
    config.themeVariables = ourThemeVars;
    config.fontFamily = "inherit";
    // 合并 themeCSS：先剥离上次追加的部分（幂等），再追加我们的规则
    var base = (config.themeCSS || "").replace(/\/\*mm-shadow-extra\*\/[\s\S]*$/, "");
    config.themeCSS = base + mmExtraCss;
    return originalInit(config);
  };

  // 立即初始化
  mermaid.initialize({});

  console.log("[mermaid.js] v9 主题已配置 (darkMode=" + isDark + ")");
})();

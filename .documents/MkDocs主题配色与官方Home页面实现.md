# MkDocs Material 主题：配色选择与官方 Home 页面实现

> 对象：`mkdocs.yml` 主题配置 + 官方 demo 首页实现方案
> 日期：2026-08-11
> 状态：配色已应用并构建验证通过；Home 页面复刻待实施

---

## 1. 配色方案选择

### 1.1 配色选择网站

| 网站 | 用途 |
|------|------|
| [materialui.co/colors](https://materialui.co/colors) | **已选定**。Material 官方色板（50–900 全部色阶）可视化色卡，方便比较颜色深浅（已验证可访问，HTTP 200） |
| [materialpalette.com](https://www.materialpalette.com/) | 选两个主色，实时预览在网页组件上（导航栏、按钮、链接、卡片） |
| [m1.material.io/style/color.html](https://m1.material.io/style/color.html) | Google 官方 Color Tool，生成完整配色方案并检查对比度（无障碍） |
| [coolors.co](https://coolors.co/) | 通用配色灵感生成器 |

> 💡 最直观的方式：官方 demo 站右上角实时切换配色（https://squidfunk.github.io/mkdocs-material/），能直接看到组合效果。

### 1.2 Material 主题支持的颜色

- **primary（主色）**：`red` `pink` `purple` `deep-purple` `indigo` `blue` `light-blue` `cyan` `teal` `green` `light-green` `lime` `yellow` `amber` `orange` `deep-orange` `brown` `grey` `blue-grey` `black` `white`
- **accent（强调色）**：`red` `pink` `purple` `deep-purple` `indigo` `blue` `light-blue` `cyan` `teal` `green` `light-green` `lime` `yellow` `amber` `orange` `deep-orange`

### 1.3 选定方案：樱花粉（温柔清爽）

喜欢色系：红色、粉色、紫色。

| 模式 | 导航栏 (primary) | 链接 (accent) |
|------|------------------|---------------|
| 🌞 亮色 | 粉色 `pink` | 深紫 `deep-purple` |
| 🌙 暗色 | 黑色 `black` | 粉色 `pink` |

`mkdocs.yml` 中已应用的完整配置（替换原 palette 部分）：

```yaml
theme:
  name: material
  language: zh

  palette:
  # Palette toggle for automatic mode
    - media: "(prefers-color-scheme)"
      accent: deep-purple # 链接等可交互元件的高亮色
      toggle:
        icon: material/brightness-auto
        name: Switch to light mode

    # Palette toggle for light mode
    - media: "(prefers-color-scheme: light)"
      scheme: default
      primary: pink # 上方的（樱花粉）
      accent: deep-purple # 链接等可交互元件的高亮色
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode

    # Palette toggle for dark mode
    - media: "(prefers-color-scheme: dark)"
      scheme: slate
      primary: black # 上方的
      accent: pink # 链接等可交互元件的高亮色（深色背景下粉色链接醒目）
      toggle:
        icon: material/brightness-4
        name: Switch to system preference
```

> ✅ 已用 `mkdocs build` 验证，构建通过（退出码 0）。

**备选方案**（当初供选择的 4 套，留档备用）：

| 方案 | 亮色 primary | 亮色 accent | 风格 |
|------|-------------|-------------|------|
| 樱花粉（已选） | `pink` | `deep-purple` | 温柔清爽 |
| 皇家紫 | `deep-purple` | `pink` | 优雅学术（"MIT 紫"） |
| 玫瑰红 | `red` | `pink` | 热情醒目 |
| 白底紫调 | `white` | `deep-purple` | 耐读经典（最不易审美疲劳） |

---

## 2. 官方 Home 页面实现（复刻方案）

### 2.1 实现原理

官方 demo 首页（squidfunk.github.io/mkdocs-material/）不是用 Markdown 写的，而是**自定义 HTML 模板**，由 3 个文件配合：

| 文件 | 作用 |
|------|------|
| `mkdocs.yml` | `theme.custom_dir: overrides` 声明自定义模板目录 |
| `docs/index.md` | frontmatter 写 `template: home.html`，指定该页用自定义模板 |
| `overrides/home.html` | 继承 `main.html`，在 `tabs` 区块注入 hero，并清空内容区和页脚 |

### 2.2 配置（`mkdocs.yml`）

```yaml
theme:
  name: material
  custom_dir: overrides   # ← 关键：让 MkDocs 优先使用你的自定义模板
```

### 2.3 首页标记（`docs/index.md`）

```markdown
---
template: home.html     # ← 首页改用自定义模板渲染
---

Welcome to Material for MkDocs.
```

### 2.4 核心模板（`overrides/home.html`，官方原版源码）

```jinja
{% extends "main.html" %}
{% block tabs %}
  {{ super() }}
  <style>.md-header{position:initial}.md-main__inner{margin:0}.md-content{display:none}
  @media screen and (min-width:60em){.md-sidebar--secondary{display:none}}
  @media screen and (min-width:76.25em){.md-sidebar--primary{display:none}}</style>
  <section class="mdx-container">
    <div class="md-grid md-typeset">
      <div class="mdx-hero">
        <div class="mdx-hero__image">
          <img src="assets/images/illustration.png" alt="" width="1659" height="1200">
        </div>
        <div class="mdx-hero__content">
          <h1>Technical documentation that just works</h1>
          <p>{{ config.site_description }}</p>
          <a href="{{ page.next_page.url | url }}" class="md-button md-button--primary">Quick start</a>
          <a href="{{ 'insiders/' | url }}" class="md-button">Get Insiders</a>
        </div>
      </div>
    </div>
  </section>
{% endblock %}
{% block content %}{% endblock %}
{% block footer %}{% endblock %}
```

### 2.5 实现要点说明

- **继承与覆盖**：`{% extends "main.html" %}` 继承主题主模板；`block tabs` 注入 hero 部分；`block content` 和 `block footer` 置空。
- **隐藏正文**：内联 CSS `.md-content{display:none}` 隐藏正文内容区，`.md-sidebar--primary/secondary` 在桌面端隐藏两侧边栏，`.md-header{position:initial}` 让顶部导航栏不再置顶吸顶。
- **hero 样式**：`mdx-hero` 等样式类**不在主题包里**（官方 demo 站专属），需要自己写 CSS 定义图片与文字的布局（如 flex 双栏、响应式）。
- **来源**：官方仓库 https://github.com/squidfunk/mkdocs-material 的 `material/overrides/home.html`（master 分支，2026-08 抓取）。

### 2.6 本项目的落地方案（待实施）

1. `mkdocs.yml` 的 `theme` 增加 `custom_dir: overrides`
2. 创建 `overrides/home.html`（照官方模板改，hero 文案换成学习笔记相关）
3. 在 `docs/index.md` frontmatter 加 `template: home.html`
4. 在 `docs/stylesheets/extra.css` 中补充 `mdx-hero` 样式 + 课程卡片区样式

---

## 3. 参考链接汇总

- 官方 demo（试配色）：https://squidfunk.github.io/mkdocs-material/
- 官方仓库：https://github.com/squidfunk/mkdocs-material
- 官方配色文档：https://squidfunk.github.io/mkdocs-material/setup/changing-the-colors/
- 配色网站（选定）：https://materialui.co/colors
- 配色网站（备选）：https://www.materialpalette.com/
- 官方 home.html 源码位置：`material/overrides/home.html`（仓库 master 分支）

## 4. 已排除的选项（留档备忘）

- **MaterialX**（jaywhj/mkdocs-materialx）：GitHub 有仓库（150 stars）但 PyPI 无安装包、README 为空，不可靠，排除。
- **Zensical**（zensical/zensical）：官方新一代 SSG（5430 stars），但 alpha 阶段且与现有 MkDocs 插件生态不兼容，现阶段不换。
- **Dracula**（dracula/mkdocs）：120 stars 深色配色主题，可用但用户已选官方 Material + 樱花粉。
- **第三方主题验证结果**：搜索结果中宣称存在的 mkdocs-dap、mkdocs-shadcn 等经 PyPI 官方源验证**不存在**，均为不可靠信息。

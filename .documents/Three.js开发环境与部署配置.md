# Three.js 微缩场景 · 环境配置与部署指南

> 版本：v1  
> 更新日期：2026-09-20  
> 状态：**环境已落地**（Node/npm 入环境、Python 依赖补齐、three vendor 就位，见 §6「执行记录」）；Three.js 场景本体尚未开始实现。本篇只讲「环境怎么配、资源从哪来、远端要不要改」。  
> 上游设计：[首页设计方案合集.md](首页设计方案合集.md)（v2 雨天便利店街角）  
> 适用对象：本机开发（Local）与 GitHub Pages 部署（Remote）

## 0. 一条硬规则

**所有环境都装进 conda 环境 `naimore3-docs`**：Python、pip 依赖，以及本次新增的 Node.js / npm，都用 `conda install -n naimore3-docs ...` 装进同一个环境；执行命令统一用 `conda run -n naimore3-docs <cmd>`。

不要把「系统 node」当成项目环境的一部分。当前的实测状态是：

```bash
conda run -n naimore3-docs which node   # → .../envs/naimore3-docs/bin/node（环境自带）
conda run -n naimore3-docs node -v      # → v22.23.2
conda run -n naimore3-docs npm -v       # → 10.9.8
```

注意 `/usr/bin/node` 仍然存在（系统 node），它**不属于**本项目环境：直接 `node`、`npm` 或 `npx` 可能落到系统版本上。系统 node 会随机器、shell、PATH 漂移，只有 `naimore3-docs` 里的 node 才能和 [environment.yml](../environment.yml) 一起被复现，所以命令统一写成 `conda run -n naimore3-docs <cmd>`。

仓库根目录的 [environment.yml](../environment.yml) 是唯一环境定义：`python=3.10` + `pip` + `nodejs=22`，Python 依赖（mkdocs、material、jieba、插件、pymdown-extensions）全部内联在它的 `pip:` 段里，并锁定为本地验证过的版本。**原来的 `requirements.txt` 已合并进来并删除**，新电脑只需这一个文件。

## 1. 依赖总览

| 依赖 | 版本 | 用途 | 装在哪 | 是否提交进仓库 |
|---|---|---|---|---|
| Python | 3.10.x（本机 3.10.20） | MkDocs 构建 | conda env（仅 conda-forge） | 否 |
| MkDocs / Material | 1.6.1 / 9.7.7 | 站点构建与主题 | conda env（pip，见 `environment.yml`） | 否 |
| pymdown-extensions | 11.0.2 | Markdown 扩展 | 同上 | 否 |
| mkdocs-minify / redirects / git-revision-date | 0.8.0 / 1.2.3 / 1.6.0 | 已随步骤 2 装好；`mkdocs.yml` 尚未启用 | conda env（pip） | 否 |
| jieba | 0.42.1 | 中文搜索分词（已生效） | conda env（pip） | 否 |
| Node.js | 22.x（conda-forge 当前 22.23.2） | **仅**用于本地拉取 three、跑 npm 脚本 | **conda env** | 否 |
| three | 0.160.0（与设计文档 §8.3 一致） | 3D 场景运行时 | `docs/javascripts/vendor/three/` | **是** |
| 现代浏览器（Chrome / Chromium / Edge） | 任意近期版本 | 本地目视验证 WebGL | 操作系统 | 否 |
| Playwright（可选） | 1.x | 自动截图、视觉回归 | npm 包 + 浏览器缓存（见 §2.8） | 否 |

关键结论：**站点构建与运行都不依赖 Node**。Node 只在本地「取一次库」，取完把 three 的文件提交进仓库；浏览器加载的是本站自己的文件，不请求 CDN，因此远端部署链路不需要 Node，也不需要额外配置。

## 2. 本地环境配置（全部在 conda `naimore3-docs` 内）

### 2.1 新电脑从零安装（推荐路径）

```bash
git clone <repo> && cd Naimore3-s-Learning-Notes
conda env create -f environment.yml     # 按 environment.yml 新建 naimore3-docs
conda activate naimore3-docs
mkdocs serve                            # http://127.0.0.1:8000
```

一条命令装完 Python、Node/npm 与全部 pip 依赖，不需要再手工装任何东西，也不需要联网取 three（three 已 vendor 在仓库里）。

已在 2026-09-20 用 `conda env create -p <临时前缀> -f environment.yml` 实测：全新环境里 `mkdocs build` 成功，`javascripts/vendor/three/build/three.module.js` 正常产出（详见 §6）。

注意两点：

- `environment.yml` 只声明 `conda-forge` 一个 channel：python / pip / nodejs 都在里面，新电脑不必为 Anaconda 的 `defaults` channel 额外接受条款（已实测，29 个 conda 包全部来自 conda-forge）。
- `python=3.10` 是范围约束，不同时间点装到的补丁版本可能不同（本次全新环境装到 3.10.21，本机原环境是 3.10.20）；要完全固定可改成 `python=3.10.20`。
- 如果已按更早的文档建过环境，用增量同步即可：`conda env update -n naimore3-docs -f environment.yml`（不加 `--prune`，不会删掉你另外装的包）。

### 2.2 先自检

```bash
conda run -n naimore3-docs python -V            # 期望 Python 3.10.x
conda run -n naimore3-docs mkdocs --version     # 期望 mkdocs, version 1.6.1
conda run -n naimore3-docs pip list | grep -Ei "mkdocs|pymdown|jieba"
conda run -n naimore3-docs which node           # 期望 .../envs/naimore3-docs/bin/node
```

### 2.3 步骤 1：把 Node.js 装进环境（已完成）

```bash
conda install -n naimore3-docs -c conda-forge nodejs=22
```

实际结果：新装 `nodejs 22.23.2`、`icu 78.3`、`libuv 1.52.1`（约 40 MB），并把 `ca-certificates`、`openssl` 更新到 conda-forge 版本；Python 与已装的 pip 包未被改动。

装完确认 node 真的来自环境而不是系统：

```bash
conda run -n naimore3-docs which node   # → .../envs/naimore3-docs/bin/node
conda run -n naimore3-docs node -v      # → v22.23.2
conda run -n naimore3-docs npm -v       # → 10.9.8
```

若 `which node` 仍指向 `/usr/bin/node`，说明装的是系统 node，需要重新执行本步骤。

### 2.4 步骤 2：补齐 Python 依赖，和 CI 对齐（已完成）

```bash
# 现在只有这一个来源：environment.yml（原 requirements.txt 已合并进来）
conda run -n naimore3-docs pip install \
  mkdocs==1.6.1 mkdocs-material==9.7.7 jieba==0.42.1 \
  mkdocs-minify-plugin==0.8.0 mkdocs-redirects==1.2.3 \
  mkdocs-git-revision-date-localized-plugin==1.6.0 pymdown-extensions==11.0.2
# 或直接同步整个环境（含 conda 段）：
conda env update -n naimore3-docs -f environment.yml
```

补齐前本地只装了 `mkdocs`、`mkdocs-material`、`mkdocs-material-extensions`、`pymdown-extensions`、`mkdocs-get-deps`。实际新装：`jieba 0.42.1`、`mkdocs-minify-plugin 0.8.0`、`mkdocs-redirects 1.2.3`、`mkdocs-git-revision-date-localized-plugin 1.6.0`，以及依赖 `gitpython`、`gitdb`、`smmap`、`csscompressor`、`jsmin`、`htmlmin2`、`properdocs`；`mkdocs`（1.6.1）与 `mkdocs-material`（9.7.7）保持原版本。

行为上唯一的变化是 **jieba 让中文搜索开始分词**：构建日志会出现 `Prefix dict has been built successfully`，搜索「雷达」能命中「雷达图」等中文页面；构建时间从约 7s 增加到约 11s，`site/search/search_index.json` 约 11 MB（该体积来自 4719 条索引与约 266 万字正文的 JSON 转义，不是 jieba 造成的）。minify / redirects / git-revision-date 三个插件仍未写进 `mkdocs.yml` 的 `plugins:`，装上不影响当前构建结果。

### 2.5 步骤 3：把 three 取到 vendor 目录（已完成，不联网运行时）

```bash
# 1) 在临时目录取包，避免在仓库里生成 node_modules
conda run -n naimore3-docs npm install --prefix /tmp/three-fetch three@0.160.0 \
  --silent --no-fund --no-audit

# 2) 建 vendor 目录（结构与 three 的 addons 路径一致）
mkdir -p docs/javascripts/vendor/three/build
mkdir -p docs/javascripts/vendor/three/examples/jsm/controls
mkdir -p docs/javascripts/vendor/three/examples/jsm/objects
mkdir -p docs/javascripts/vendor/three/examples/jsm/utils

# 3) 拷贝运行时、用到的 addons 与许可证
THREE_SRC=/tmp/three-fetch/node_modules/three
cp "$THREE_SRC/build/three.module.js" docs/javascripts/vendor/three/build/
cp "$THREE_SRC/examples/jsm/controls/OrbitControls.js" docs/javascripts/vendor/three/examples/jsm/controls/
cp "$THREE_SRC/examples/jsm/objects/Reflector.js" docs/javascripts/vendor/three/examples/jsm/objects/
cp "$THREE_SRC/examples/jsm/utils/BufferGeometryUtils.js" docs/javascripts/vendor/three/examples/jsm/utils/
cp "$THREE_SRC/LICENSE" docs/javascripts/vendor/three/LICENSE

# 4) 记下版本，便于以后升级
printf 'three@0.160.0\n' > docs/javascripts/vendor/three/VERSION
```

三个必须记住的点：

1. **three 0.160.0 的 `build/three.module.js` 是自包含单文件**（已实测，不 import 其它 build 文件）；但 **0.17x / 0.18x 起 `build/` 会多出 `three.core.js`**（0.186.0 已确认还有 `three.webgpu.js` 等），升级时要把整个 `build/` 目录一起拷，否则运行时会 404。
2. addons 只拷用得上的文件，并保持 `examples/jsm/...` 的目录结构，import map 直接指向本目录。
3. three 是 MIT 许可，`LICENSE` 必须随 vendor 一起提交。

取完之后 vendor 目录应当长这样（`VERSION` 用来记录版本，便于以后升级）：

```text
docs/javascripts/vendor/three/
├── VERSION                                   # three@0.160.0（373 B）
├── LICENSE                                   # MIT，必须提交（1.1 KB）
├── build/
│   └── three.module.js                       # 0.160.0 为自包含单文件（1.27 MB）
└── examples/jsm/
    ├── controls/OrbitControls.js             # 拖拽 / 旋转 / 缩放（30 KB）
    ├── objects/Reflector.js                  # 地面积水反射（7 KB）
    └── utils/BufferGeometryUtils.js           # 几何合并（32 KB）
```

已执行结果：上述 6 个文件均已就位（`three@0.160.0`），`mkdocs build` 会把它们原样复制到 `site/javascripts/vendor/three/`，本地 HTTP 实测 `three.module.js` 返回 200、1,272,950 字节，全程无 CDN 请求。

### 2.6 步骤 4：在 MkDocs 里注册（实现阶段要做的，先记下来）

- `mkdocs.yml` 的 `extra_javascript` 增加场景入口模块（例如 `javascripts/convenience-scene.mjs`，文件规划见设计文档 §8.2）。
- 首页用 import map 指向本仓库内的 three，**用相对路径，不要写 `/javascripts/...`**（GitHub Pages 项目站点部署在 `/<repo>/` 子路径下）：

```html
<script type="importmap">
{
  "imports": {
    "three": "javascripts/vendor/three/build/three.module.js",
    "three/addons/": "javascripts/vendor/three/examples/jsm/"
  }
}
</script>
```

- 场景模块必须沿用设计文档 §19 的接口约定：复用 `#convenience-scene`、`data-scene` 章节、`--nmd-scroll` 进度，并在 `navigation.instant` 换页时销毁 renderer / controls / rAF。

### 2.7 步骤 5：本地验证

```bash
conda run -n naimore3-docs mkdocs build
conda run -n naimore3-docs mkdocs serve -a 127.0.0.1:8000
```

验收点：

- DevTools → Network 里 `three.module.js` 等资源来自本站（状态 200，**不出现任何 CDN 域名**）；
- Console 没有模块解析失败、WebGL 上下文或着色器报错；
- `prefers-reduced-motion: reduce` 下雨滴、门开合、镜头推进降级；
- 移动端帧率与滚动流畅度符合设计文档 §11 的性能预算。

### 2.8 可选：Playwright 视觉回归

```bash
mkdir -p tools/qa
conda run -n naimore3-docs bash -c 'cd tools/qa && npm init -y && npm install playwright && npx playwright install chromium'
```

注意：Playwright 的 npm 包在环境内，但**浏览器二进制无法装进 conda**，默认下载到 `~/.cache/ms-playwright`。如果希望「项目内自包含」，加环境变量把它指到仓库内目录，并确保被 git 忽略：

```bash
export PLAYWRIGHT_BROWSERS_PATH="$(pwd)/tools/qa/browsers"   # 加入 .gitignore
```

## 3. 推送到远端（GitHub Pages）之后怎么配

### 3.1 现状

仓库现有工作流 `.github/workflows/gh-pages.yml`（依赖已改为从 `environment.yml` 读取，见 3.2）：

```text
checkout → setup-python 3.10
        → 解析 environment.yml 的 pip 段 → pip install 这些包
        → mkdocs build → peaceiris/actions-gh-pages@v4 发布 ./site 到 gh-pages 分支
```

### 3.2 结论：走 vendor 方案时，远端**不需要** Node，也只需要一个依赖文件

只要满足三件事：

1. vendor 文件已提交：

   ```bash
   git ls-files docs/javascripts/vendor | head
   ```

2. vendor 目录没有被规则忽略（应无输出）：

   ```bash
   git check-ignore -v docs/javascripts/vendor/three/build/three.module.js
   ```

3. `environment.yml` 能在 CI 里装出与本地一致的 MkDocs。CI 的做法是：`pip install pyyaml` 之后用一段 Python 把 `environment.yml` 的 `pip:` 段打印成 requirements 列表，再 `pip install -r`，因此**不会出现第二个依赖文件**：

   ```yaml
       - name: Install dependencies (from environment.yml)
         run: |
           python -m pip install --upgrade pip pyyaml
           python - <<'PY' > "$RUNNER_TEMP/pip-requirements.txt"
           import yaml

           with open("environment.yml", encoding="utf-8") as f:
               data = yaml.safe_load(f)

           for dep in data.get("dependencies", []):
               if isinstance(dep, dict):
                   for pkg in dep.get("pip", []):
                       print(pkg)
           PY
           python -m pip install -r "$RUNNER_TEMP/pip-requirements.txt"
   ```

   为什么不在 CI 里直接用 conda：Build 只要 Python 那半套依赖，conda 初始化会多几十秒并顺带装 Node；现在这样既保持单文件又保持构建速度。这段解析片段已在本地按同样写法实测，输出与 `environment.yml` 的 `pip:` 段逐行一致。

推送 main 分支后 Actions 自动构建并发布，GitHub 侧无需任何环境配置。

> 变更记录：原依赖文件 `requirements.txt` 已在 2026-09-20 合并进 `environment.yml` 并删除；若你本地有旧脚本仍引用它，改成读取 `environment.yml` 或直接 `conda env update -n naimore3-docs -f environment.yml`。

### 3.3 GitHub 仓库侧需要确认的三处设置

| 位置 | 设置 | 为什么 |
|---|---|---|
| Settings → Pages → Build and deployment | Source = **Deploy from a branch**，分支 `gh-pages`，目录 `/ (root)` | 工作流是把构建产物推到 `gh-pages` 分支，而不是让 Pages 自己构建 |
| Settings → Actions → General → Workflow permissions | **Read and write permissions** | 否则 `GITHUB_TOKEN` 没有权限推送 `gh-pages` |
| Settings → Actions → General | Actions 未被禁用 | 首次推送后确认 workflow 是绿色 |

### 3.4 可选：让远端也完全复刻 conda 环境

**方案 A（推荐，最小改动）**：保持 `setup-python`，只加两道校验，防止 vendor 漏提交导致线上 3D 白屏：

```yaml
    - name: Verify vendored three.js
      run: |
        test -f docs/javascripts/vendor/three/build/three.module.js
        test -f docs/javascripts/vendor/three/examples/jsm/controls/OrbitControls.js

    - name: Build the MkDocs site
      run: mkdocs build

    - name: Verify built output
      run: test -f site/javascripts/vendor/three/build/three.module.js
```

**方案 B（完全对齐 conda）**：用仓库根目录的 `environment.yml` 在 CI 里复刻同一个环境：

```yaml
    - name: Set up Miniconda
      uses: conda-incubator/setup-miniconda@v3
      with:
        miniconda-version: latest
        activate-environment: naimore3-docs
        environment-file: environment.yml
        auto-activate-base: false

    - name: Build the MkDocs site
      shell: bash -el {0}
      run: mkdocs build
```

方案 B 的意义只是「本地与远端同一份环境定义」；代价是 conda 初始化比 `setup-python` 慢一些（多几十秒），并且会连带安装 Node。**如果不需要在 CI 里重新拉取前端库，用方案 A 就够了。**

### 3.5 其他远端注意点

- 若以后在 `mkdocs.yml` 的 `plugins:` 里启用 `git-revision-date-localized`，`actions/checkout` 必须加 `with: fetch-depth: 0`，否则插件拿不到 git 历史会在 CI 报错（当前未启用，属于预留提醒）。
- GitHub Pages 项目站点部署在 `/<repo>/` 子路径，所有资源引用（包括 vendor 与 import map）都用相对路径。
- 不要在 CI 里缓存 `site/`；如要加缓存，缓存 `~/.cache/pip` 与 conda 的 `pkgs` 即可。

## 4. 环境自检清单

- [ ] 新电脑：`conda env create -f environment.yml` 一次装完，不需要再手工补包
- [ ] `conda run -n naimore3-docs python -V` → Python 3.10.x
- [ ] `conda run -n naimore3-docs which node` → 指向 `envs/naimore3-docs/bin/node`
- [ ] `conda run -n naimore3-docs node -v` → v22.x
- [ ] `conda run -n naimore3-docs mkdocs build` 成功，无路径 / 语法报错
- [ ] `git ls-files docs/javascripts/vendor` 能看到 three 的运行时与 LICENSE
- [ ] 首页 Network 面板无外部 CDN 请求（three、字体、样式全部来自本站）
- [ ] 推送后 Actions 绿色，Pages 站点打开首页 3D 正常、控制台无报错

## 5. 与其它文档的关系

- 场景怎么搭、镜头怎么走：`首页设计方案合集.md` 第 4–17 节。
- 接入 Three.js 时必须沿用的容器、章节锚点、滚动进度与销毁口径：同文件第 19 节。
- 项目级环境与目录规范：`.codex/PROJECT.md` 第 2 节、根目录 `AGENTS.md` 第 2 节。

## 6. 执行记录

### 2026-09-21 阶段 7 发布验收（无头浏览器复核）

本地的无头验证环境（不进仓库、不影响 conda 环境）：

- 浏览器用仓库缓存里的 Playwright Chromium：`~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`，用 `--remote-debugging-port` + CDP 驱动（Node 22 自带 WebSocket，无需装 Playwright 包）。
- 该二进制缺 5 个系统库（`libnspr4` / `libnss3` / `libnssutil3` / `libsmime3` / `libasound2`），用一次性 conda 环境 `conda create -p /tmp/pw-deps -c conda-forge nspr nss alsa-lib` 提供，运行时 `LD_LIBRARY_PATH=/tmp/pw-deps/lib`。
- 容器里没有任何中文字体（`fc-list :lang=zh` 为 0），所以中文会渲染成缺字方框；截图验证时用一份临时 fontconfig 指向 WSL 的 Windows 字体：`FONTCONFIG_FILE=/tmp/nmd-fonts.conf`（内含 `/mnt/c/Windows/Fonts`）。
- **注意**：脚本每次 `PUT /json/new` 都会新开标签页，跑完要关掉；否则十几个 WebGL 页面同时渲染会把机器拖慢，测出来的帧率不可信。

复核结果（细节见 `.documents/首页设计方案合集.md` 第 15 节的验收记录表）：第 15 节 11 项全部通过；像素比上限、不可见暂停、移动端关反射与降雨滴、减弱动效冻结均实测；`mkdocs build` 产物里 8 个场景模块与 vendor 齐全，场景资源 0 个来自外部域名（页面唯一的 CDN 是 MkDocs 配置里的 MathJax，与 3D 无关）。

### 2026-09-20 首次落地（本地）

| 步骤 | 命令 | 结果 |
|---|---|---|
| 1 | `conda install -n naimore3-docs -c conda-forge nodejs=22 -y` | 新增 `nodejs 22.23.2` / `icu 78.3` / `libuv 1.52.1`；`which node` → `.../envs/naimore3-docs/bin/node`，`node -v` → v22.23.2，`npm -v` → 10.9.8 |
| 2 | `conda run -n naimore3-docs pip install -r requirements.txt`（该文件已于同日合并进 `environment.yml` 并删除） | 新增 `jieba`、`mkdocs-minify-plugin`、`mkdocs-redirects`、`mkdocs-git-revision-date-localized-plugin` 及其依赖；`mkdocs 1.6.1`、`mkdocs-material 9.7.7` 未变 |
| 3 | `conda run -n naimore3-docs npm install --prefix <tmp> three@0.160.0` + 拷贝 | `docs/javascripts/vendor/three/` 6 个文件就位（运行时、3 个 addons、LICENSE、VERSION） |

验证结果：

- `conda run -n naimore3-docs mkdocs build` 成功（约 11 s，比装 jieba 前多约 4 s），`site/javascripts/vendor/three/**` 全部产出；
- 本地 HTTP 实测首页 `javascripts/vendor/three/build/three.module.js` → 200（1,272,950 字节），`examples/jsm/controls/OrbitControls.js` → 200，全程无外部 CDN 请求；
- 首页结构未受影响：5 个章节、场景层在、页面内 0 个链接、无横向滚动、控制台无报错；
- 中文搜索生效：搜索「雷达」返回 4 条结果（含「雷达图」页面）。

### 2026-09-20 依赖合并进 environment.yml + 新电脑路径实测

动机：让「换一台电脑」只需要一个文件。

| 项目 | 内容 |
|---|---|
| 合并 | `requirements.txt` 的 7 个依赖（含版本锁定）内联到 `environment.yml` 的 `pip:` 段，`requirements.txt` 删除；`environment.yml` 成为唯一依赖来源 |
| 本地旧环境同步 | `conda install` / `pip install` 已于上一条记录完成，本机环境无需再动；其它机器或旧环境用 `conda env update -n naimore3-docs -f environment.yml` |
| 远端 | `.github/workflows/gh-pages.yml` 的安装步骤改为：装 `pyyaml` → 解析 `environment.yml` 的 `pip:` 段 → `pip install -r`，CI 仍然只用 `setup-python`，不引入 conda |
| channel 收紧 | `channels:` 只保留 `conda-forge`（去掉 `defaults`），避免新电脑被 Anaconda 条款提示挡在安装前；并重跑了一遍新建环境验证 |
| 真实复现测试 | `conda env create -p <临时前缀> -f environment.yml` 全新建环境成功（仅 conda-forge）：Python 3.10.21、node v22.23.2、npm 10.9.8、mkdocs 1.6.1、mkdocs-material 9.7.7、jieba 0.42.1、三个插件与 pymdown-extensions 11.0.2 全部就位，29 个 conda 包均来自 conda-forge；在该环境里 `mkdocs build` 成功，`javascripts/vendor/three/build/three.module.js` 正常产出 |
| 清理 | 测试用的临时环境已用 `conda env remove -p <前缀> -y` 删除，本机只保留 `naimore3-docs` |

阶段 7（2026-09-21）已补上 **CI 的 vendor 校验步骤（可选方案 A）**：`.github/workflows/gh-pages.yml` 在 `mkdocs build` 前先断言 `three.module.js`、`OrbitControls.js`、`Reflector.js`、`LICENSE` 四个文件存在，漏提交 vendor 时直接失败而不是发布一个运行时 404 的站点。

尚未执行、留待需要时再做：CI 改用 conda 直接复刻环境（可选方案 B）、Playwright 安装（可选）。阶段 7 的性能与降级复核没装 Playwright，用的是 CDP 驱动仓库缓存里的 Chromium（见第 6 节执行记录）。

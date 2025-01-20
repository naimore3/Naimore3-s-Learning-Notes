#MkDocs&Github WorkFlow开发简介
##MkDocs
$\qquad$MkDocs是一个快速、简单且非常华丽的静态网站生成器，该生成器旨在构建项目文档。文档源文件是用Markdown编写的，并使用单个YAML进行配置。
##Github Actions
$\qquad$GitHub Actions是GitHub的持续集成服务，于2018年10月推出。持续集成由很多操作组成，比如抓取代码、运行测试、登录远程服务器，发布到第三方服务等等。GitHub 把这些操作就称为 actions。

$\qquad$很多操作在不同项目里面是类似的，完全可以共享。GitHub 注意到了这一点，想出了一个很妙的点子，允许开发者把每个操作写成独立的脚本文件，存放到代码仓库，使得其他开发者可以引用。

$\qquad$如果你需要某个action，不必自己写复杂的脚本，直接引用他人写好的action即可，整个持续集成过程，就变成了一个actions的组合。这就是GitHub Actions最特别的地方。

$\qquad$GitHub做了一个官方市场，可以搜索到他人提交的 actions。另外，还有一个awesome actions的仓库，也可以找到不少action。

$\qquad$上面说了，每个 action 就是一个独立脚本，因此可以做成代码仓库，使用`userName/repoName`的语法引用action。比如，`actions/setup-node`就表示`github.com/actions/setup-node`这个仓库，它代表一个action，作用是安装 Node.js。事实上，GitHub官方的 actions都放在[github.com/actions](https://github.com/actions)里面。

$\qquad$既然actions是代码仓库，当然就有版本的概念，用户可以引用某个具体版本的action。下面都是合法的action引用，用的就是Git的指针概念，详见[官方文档](https://docs.github.com/en/actions/sharing-automations/creating-actions/about-custom-actions#versioning-your-action)。

```
actions/setup-node@74bc508 # 指向一个 commit
actions/setup-node@v1.0    # 指向一个标签
actions/setup-node@master  # 指向一个分支
```

GitHub Actions有一些自己的术语。

1. workflow(工作流程)：持续集成一次运行的过程，就是一个 workflow。

2. job(任务)：一个workflow由一个或多个jobs构成，含义是一次持续集成的运行，可以完成多个任务。

3. step(步骤)：每个job由多个step构成，一步步完成。

4. action(动作)：每个step可以依次执行一个或多个命令（action）。
##Workflow文件
$\qquad$由于此处本人并未学习，而是照搬，因此不做描述。
!!! note ""
    该部分搬运了博客[GitHub Actions入门教程](https://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)，如有侵权请联系删除。
##通过GitHub Actions部署MkDocs站点
$\qquad$基于GitHub Actions，创作者可以快速部署MkDocs站点。首先，在GitHub上创建一个仓库，然后通过MkDocs撰写网站，添加.github文件，创建workflow工作流，并通过Git工具把MkDocs项目文件上传到仓库。

$\qquad$具体步骤如下：
###使用mkdocs命令创建新的文件夹
```
mkdocs new mkdocs-site
INFO     -  Creating project directory: mkdocs-site
INFO     -  Writing config file: mkdocs-site/mkdocs.yml
INFO     -  Writing initial docs: mkdocs-site/docs/index.md
cd mkdocs-site
tree -a
.
├── docs
│   └── index.md
└── mkdocs.yml
```
###添加Github Workflow文件
```
mkdir .github
cd .github
mkdir workflows
cd workflows
vim PublishMySite.yml
```
PublishMySite.yml文件内容如下：
```yaml
name: Deploy MkDocs to GitHub Pages
on:
  push:
    branches:
      - main  # 监听 main 分支的推送事件
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v2  # 检出代码
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.8'  # 设置 Python 版本
    - name: Install dependencies
      run: |
        pip install mkdocs  # 安装 mkdocs
        pip install mkdocs-material  # 安装 mkdocs-material 主题
    - name: Build the MkDocs site
      run: mkdocs build  # 构建 MkDocs 网站
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./site  # mkdocs 构建输出目录为 site
```
!!! note ""
    该YAML文件参考了博客[使用 GitHub Workflow 快速构建和部署 MkDocs 项目文档](https://blog.csdn.net/li_yatao/article/details/141035509)，如有侵权请联系删除。
###构建项目并上传
$\qquad$进入到项目文件夹下，运行以下命令：
```
git init
git add .
git commit -m "init" #""里的内容为上传时提交的信息
```
###新建GitHub仓库
 - GitHub > New Repository
 - GitHub > Repository > Settings > Actions > General >
    - Actions permissions: Allow all actions and reusable workflows
    - Workflow permissions: Read and write permissions
    - Click Save
###项目绑定GitHub仓库
$\qquad$在项目文件夹下，运行以下命令：
```
git remote add origin https://github.com/naimore3/Naimore3-s-Learning-Notes# change to your github repo
git branch -M main
git push -u origin main
```
$\qquad$此时工作流会自动运行，生成gh-pagesfensh分支，并部署到GitHub Pages。

$\qquad$生成完毕后，操作以下内容：

$\qquad$GitHub > Repository > Settings > Pages > Branch > gh-pages > Click Save

$\qquad$到此为止整个项目已经部署完成，可通过生成的链接进行访问。
###更新项目
 - 如果是首次更新项目，则需要将Github上的项目克隆下来。运行以下命令：
 ```
 git clone https://github.com/naimore3/Naimore3-s-Learning-Notes# change to your github repo
 ```
 - 如果不是首次更新项目，则需要先将项目里的内容拉到clone好的文件夹内(如果更新的内容是Github仓库中项目文件内容的子集，则不需要执行此步骤)，执行以下代码
 ```
 git pull
 ```
 - 更新项目代码(建议直接把clone下来的文件夹删掉，再将已经更新好的内容复制到clone下来的文件夹内)
 - 运行以下命令：
 ```
 git add .
 git commit -m "Update" #""里的内容为上传时提交的信息
 git push
 ```
!!! note ""
    push的时候一定要关闭所有的加速器，取消网络代理功能。
    链接可能会弹出链接错误的信息，多次刷新Github网页，当能够在不开加速器时正常链接时，大概率可以push成功。
!!! note ""
    该部分参考了[Publish a Website with Material for MkDocs and GitHub Pages](https://yang-xijie.github.io/BLOG/Markdown/mkdocs-site/)，如有侵权请联系删除。
# GIT INIT GUIDE — Jazim Lau Portfolio

> 本机使用 **GitKraken Desktop** 完成 Git 操作（推荐，GitKraken 自带 Git 引擎，
> 无需单独安装 Git）。命令行方式作为备选（见文末）。

## 方式 A：GitKraken Desktop（推荐）

1. **打开项目**
   - 安装并打开 GitKraken Desktop
   - 左侧仓库列表 → **Open a Repository** → **Open**（或 Browse）
   - 选择目录：`D:\Desktop\jazim-portfolio\jazim-portfolio`
   - 若提示非 Git 仓库，选择 **Initialize Repository / Init**（在此目录初始化）

2. **核对 Uncommitted Changes（关键）**
   - 左侧/下方 **Uncommitted Changes** 面板中**不得出现**：
     `node_modules` / `dist` / `deploy-output` / `portfolio-review-export` / `shots` /
     `public/assets/videos`
   - **必须出现**：`src/`、`package.json`、`package-lock.json`、`.github/`、`.gitignore`、
     `.env.production`、`.env.tencent`、`.env.github`、`README.md`、`pdf/`、`scripts/`、
     `deploy-cos-media.ps1`、`COS_MEDIA_UPLOAD_MANIFEST.csv`、`portfolio-output/` 等
   - 若看到 `public/assets/videos` 出现（不应出现），先检查 `.gitignore` 再继续

3. **暂存 + 首次提交**
   - 点击 Uncommitted 面板顶部的 **Stage all changes**（全选暂存）
   - 顶部输入提交信息：`chore: initialize portfolio repository`
   - 点击 **Commit**

4. **分支命名为 main**
   - 默认分支通常是 `master`；顶部工具栏显示当前分支名
   - 点击分支名 → **Rename** → 改为 `main`（或右键分支节点 → Rename）

5. **连接 GitHub + Push**
   - 若未连接 GitHub：**Preferences（首选项）→ Integrations → GitHub → Connect to GitHub**
     （浏览器授权；只在你本机操作，Token 不会交给 AI）
   - 若仓库已在 github.com 创建好：
     - 顶部右侧 **Remote** → **Add Remote** → 粘贴 GitHub 仓库 URL → 名称填 `origin` → Add
     - 点击顶部 **Push** → 选择 `origin` / `main` → 完成首次 Push
   - 若仓库尚未在 GitHub 创建：
     - **Remote** → **Add Remote** → **Create Remote**（GitKraken 可在 GitHub 直接创建）
     - 选择 **Public / Private**，创建后会自动关联并可直接 Push

6. **Push 后（一次性）**
   - 浏览器打开 GitHub 仓库 → **Settings → Pages → Source：GitHub Actions**
   - 首次 Push 会自动触发 Actions 构建部署

## 方式 B：命令行（备选）

> 需先安装 Git：`winget install --id Git.Git -e --source winget`，然后重开终端。

```powershell
cd D:\Desktop\jazim-portfolio\jazim-portfolio
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
git init
git branch -M main
git add .
git status        # 核对：无 videos / node_modules / dist / deploy-output
git commit -m "chore: initialize portfolio repository"
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

## 创建 GitHub Repository（两种方式共用）

浏览器 https://github.com/new
- Repository name：建议 `jazim-portfolio`（可自定）
- Visibility：**Public 或 Private 由你决定**（若需 GitHub Pages 且选 Private，
  需确认你的 GitHub 套餐支持 Private Pages，否则请选 Public）
- 不要勾选「Add a README / .gitignore / license」（项目内已有）

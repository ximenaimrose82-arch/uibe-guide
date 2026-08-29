# 贸大新生指南 · UIBE Guide 2026 🎓

给对外经济贸易大学 2026 级新生的入学指南网页，**手机点开即用**，无框架、无构建步骤，纯静态文件，托管在 GitHub Pages。

## ✨ 功能

| 模块 | 说明 |
| --- | --- |
| 🏠 首页 | 报到倒计时 + 各功能入口 + 数据统计 |
| ✅ 报到清单 | 四大类 23 项逐条打勾，进度条 + 本地保存，勾选不丢 |
| 🗺️ 校园地图 | 官网 2026 版地图，点击放大（双指缩放），附地标说明 |
| 📞 院系联系 | 18 个院系/部门官方电话、邮箱、地点，可搜索、一键拨打/发信 |
| 📚 攻略库 | 40+ 篇攻略，分类筛选 + 关键词搜索（带高亮） |
| 🤖 AI 百事通 | 三层应答：本地 FAQ 精准匹配 → 攻略库模糊兜底 → DeepSeek AI（国内/国外双通道自动切换） |
| 🛡️ 防骗手册 | 开学季 5 大骗局拆解 + 紧急电话 |
| 📴 离线可用 | Service Worker 缓存，断网也能看攻略 |

## 📁 目录结构

```
uibe-guide/
├── index.html            # 整个网站（页面 + 样式 + 逻辑）
├── data-guides.js        # 攻略数据（GUIDES）
├── data-faq.js           # 问答数据（FAQ）
├── data-contacts.js      # 院系联系方式数据（CONTACTS，官网核实）
├── worker.js             # Cloudflare Worker：AI 代理（备用通道）
├── scf_function.py       # 腾讯云函数：AI 代理（国内主通道）
├── wrangler.toml         # Cloudflare Worker 配置
├── manifest.webmanifest  # PWA 清单
├── sw.js                 # 离线 Service Worker
├── share.png             # 分享卡片（1200×630）
├── assets/               # App 图标 + 校园地图
├── scripts/serve.mjs     # 本地预览服务器（零依赖）
├── tools/gen-icons.ps1   # 重新生成图片资源（Windows）
└── .github/workflows/    # 推送 main 自动部署 GitHub Pages
```

## 🚀 快速开始

```bash
# 1. 本地预览（Node 18+）
npm run preview          # 打开 http://127.0.0.1:4173

# 2. 语法自检
npm run check
```

## 📦 部署

### 网站本体 → GitHub Pages（自动）

1. 推送到 `main` 分支；
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**；
3. 以后每次 push 都会自动发布到 `https://<你的用户名>.github.io/uibe-guide/`。

> 也可手动部署：直接推送 `index.html` 等文件到 Pages 分支/目录。

### AI 代理 → Cloudflare Worker（备用通道）

```bash
npm install
npx wrangler deploy        # 使用 wrangler.toml
```

首次部署后到 Cloudflare 控制台为 Worker 添加环境变量 `DEEPSEEK_API_KEY`（必填，DeepSeek 官方 API Key），可选 `MODEL`（默认 `deepseek-chat`）。

部署完成后，把 Worker 的域名更新到 `index.html` 里 `AI_PROXY_URLS` 数组。

### AI 代理 → 腾讯云函数（国内主通道）

1. 在腾讯云 SCF 创建「事件函数」，运行环境 Python 3；
2. 上传/粘贴 `scf_function.py`，执行方法填 `index.main_handler`；
3. 配置环境变量 `DEEPSEEK_API_KEY`；
4. 创建「函数 URL」并开启匿名访问；
5. 把函数 URL 更新到 `index.html` 里 `AI_PROXY_URLS` 数组（放在第一位，国内直连最快）。

## ✏️ 改内容

- **攻略**：编辑 `data-guides.js`，按现有格式加一条 `{ cat, icon, title, body }`；
- **问答**：编辑 `data-faq.js`，加 `{ q, kws, a }`，`kws` 是触发关键词；
- **院系联系方式**：编辑 `data-contacts.js`，加 `{ name, phone, email, location, site, source }`；电话/邮箱必须是官网页面实际标注，查不到标「待补充」，并给出 `source`（来源页面 URL）；
- **改版发布**：把 `index.html` 里的 `APP_VERSION` 和三个数据文件 `?v=` 号 +1，同时把 `sw.js` 顶部的缓存名 `uibe-guide-v11` 也 +1，避免老用户拿到旧缓存。

## 🖼️ 重新生成图片

需要修改分享卡片/图标时，Windows 下直接运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/gen-icons.ps1
```

会重新生成 `share.png`（1200×630）和 `assets/icon-*.png`。

## ⚠️ 免责声明

信息来源：《2026级新生入学指南》（官方）+ 贸大官网 + 学长学姐经验整理。**关键信息以学校正式通知为准。**

# 贸大新生指南 — 项目进度交接文档

> 最后更新:2026-08-29 | 当前线上版本:v11

## 项目是什么

给对外经济贸易大学新生用的指南网站(纯静态,无后端)
- 线上:https://ximenaimrose82-arch.github.io/uibe-guide/
- 源码:`D:\WYH\贸大新生指南`(git push 即上线,Pages 自动部署)
- 技术栈:单页 index.html + 数据文件(FAQ/攻略/联系方式)+ PWA(sw.js)+ 双通道 AI 代理

## 已完成里程碑

| 版本 | 内容 | 状态 |
|---|---|---|
| v9 | 基础版:FAQ 101条 + 攻略75篇 + 双通道AI(腾讯云SCF国内+Cloudflare Worker国外) | ✅ |
| v10 | 全面优化:修4个bug(攻略截断/匹配失效/高度抖动/记录丢失)+ 无障碍 + SEO/JSON-LD + PWA离线 + 后端加固 | ✅ 已上线 |
| **v11** | **新增:校园地图页(#/map,lightbox+地标)+ 院系联系方式页(#/contacts,18院系,搜索/tel/mailto)** | ✅ 刚上线(5bd5903) |

## 当前架构要点

- AI 双通道:SCF(国内首选,函数URL 见 Hermes 记忆)+ Worker uibe-ai-proxy(国外备用);密钥在云环境变量,前端无 key
- 本地知识库先拦截:FAQ 101条(data-faq.js)+ 攻略75篇(data-guides.js)+ 联系方式18条(data-contacts.js)
- 限流:每IP 5次/分、30次/天;日熔断500次
- PWA:manifest + sw.js 离线缓存(缓存名 uibe-guide-v11,改版需同步)
- 版本号三处同步:APP_VERSION / 数据文件 ?v=N / sw.js 缓存名

## 待办/下一步(可选)

- [ ] 联系方式数据 7 处"待补充"(3电话/4邮箱/2地点)可后续补齐(官网持续核验)
- [ ] 外语学院页面是2015年旧数据,开学后可核实更新
- [ ] 开学后:报到倒计时自动变"大学生活已开启"(写死9月3日,无需改)
- [ ] 内容可继续扩充(校历、选课攻略等)

## 重要提示(给接手者)

- 网站改版后必须同步三处版本号,否则 PWA 缓存旧版
- 腾讯云 SCF 控制台改代码:上传 scf_function.py 内容即可
- Cloudflare Worker 部署:npx wrangler deploy(已登录)
- dsh 工作区 junction 保留:`D:\WYH\dsh-workspace\uibe-guide` → 网站真源码

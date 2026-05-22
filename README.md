# Language for Life · 英语考研宝（前后端合并版）

## 导入

微信开发者工具打开：**`miniprogram-1/miniprogram-1`**

## 演示流程

1. 登录页 → **快速体验（走后端登录）** 或 用户名密码登录  
2. 选择考研方向 → 15 所院校 → 确认院校  
3. 首页：番茄专注、AI 答疑、统计、备考计划入口等  

## 目录

| 目录 | 说明 |
|------|------|
| `miniprogram/` | 前端 UI + 后端 `utils/` |
| `cloudfunctions/` | `backendApi`、`cozeChat` |
| `docs/` | `BACKEND_ALPHA.md`、`前后端合并说明.md` |

本地无云：`app.js` 中 `env` 留空。Coze 配置见 `utils/coze.config.local.js`。

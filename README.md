# Language for Life · 英语考研宝（前后端合并版）

## 导入

微信开发者工具打开本仓库根目录（含 `miniprogram/`、`cloudfunctions/` 的那一层）。

> 前端包与云后端已合并，勿单独打开旧 mock 工程联调。

## 当前状态

| 项 | 状态 |
|----|------|
| 云函数 | `backendApi`、`cozeChat` |
| 内容数据 | 院校 25 / FAQ 35 / 范文 16 |
| 前端 | 已合并 english-kaoyanbao4 UI |

## 演示流程

1. 登录页 → **微信登录 / 快速体验**  
2. 选择考研方向 → 院校列表 → 确认院校  
3. 首页：番茄专注、AI 答疑、统计、备考计划、FAQ、范文等  

## 目录

| 目录 | 说明 |
|------|------|
| `miniprogram/` | 前端 UI + `utils/` |
| `cloudfunctions/` | `backendApi`、`cozeChat` |
| `data/source/` | 种子数据 JSON |
| `scripts/` | 校验、构建、云导出 |
| `docs/` | **仅一份**技术说明（见下） |

## 技术说明（仓库唯一文档）

请阅读：**[docs/项目技术说明-当前版.md](docs/项目技术说明-当前版.md)**

本地若还有其它说明稿（部署细则、iCAN 材料等），仅作团队内部使用，不纳入本仓库。

## 种子数据

| 数据 | 数量 | 编辑文件 |
|------|------|----------|
| 院校库 | 25 所 | `data/source/universities.json` |
| FAQ | 35 条 | `data/source/faqs.json` |
| 作文范文 | 16 篇 | `data/source/essay-samples.json` |

```bash
npm run validate && npm run build && npm run export:cloud
```

无 Node 时：`build-data.bat` 或 `scripts\build.ps1` + `scripts\export-cloud.ps1`。

云导入使用 **JSON Lines**（`data/export/cloud-import/`）。

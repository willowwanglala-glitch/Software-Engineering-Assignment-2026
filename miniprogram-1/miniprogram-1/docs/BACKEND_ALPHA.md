# Language for Life — Alpha 后端说明（对齐设计文档）

## 架构

| 层次 | 实现 | 说明 |
|------|------|------|
| 表现层 | 小程序页面 | login / onboarding / home / focus / stats / test-ai |
| 业务层 | `backendApi` 云函数 + `utils/api.js` | 统一 `action` 路由 |
| 数据层 | 云数据库 MongoDB / 本地 `wx.storage` | `env` 为空时自动降级本地 |

与《数据库设计说明书》《系统设计说明书》对应关系：

| 设计集合 | Alpha 实现 |
|----------|------------|
| `users` | `users`（含 directionId、universityId、direction、targetSchool） |
| `universities` | 静态目录 `utils/catalog.js`（15 校）+ 可选云库 `seedUniversities` |
| `focusRecords` | `focus_sessions`（含 studyMode、startTime/endTime） |
| `aiChatLogs` | `qa_logs`（含 cozeConversationId） |
| `studyPlans` | `study_plans`（预留 `getStudyPlan`，待 Coze 生成后写入） |

## 数据库集合（云开发控制台创建）

| 集合名 | 权限建议 |
|--------|----------|
| `users` | 仅创建者可读写 |
| `universities` | 所有用户可读，仅管理员写（或开发阶段可读） |
| `focus_sessions` | 仅创建者可读写 |
| `qa_logs` | 仅创建者可读写 |
| `study_plans` | 仅创建者可读写 |

首次部署云函数后，可在云开发控制台调用一次 `seedUniversities`（见下方 API）导入 15 所院校到 `universities` 集合，便于答辩展示「数据库已录入」。

## 云函数部署

1. 开通云开发，将环境 ID 填入 `miniprogram/app.js` 的 `env`
2. 右键 `cloudfunctions/backendApi` → **上传并部署：云端安装依赖**
3. （可选）在控制台测试 `backendApi`，参数：`{ "action": "seedUniversities" }`

## API（action）

### 用户模块

| action | 说明 | 主要参数 |
|--------|------|----------|
| `getOrCreateUser` | 登录/注册 | `nickName`, `avatarUrl` |
| `getUserProfile` | 获取用户 + 院校详情 | — |
| `updateProfile` | 更新画像 | `directionId`, `universityId` 或 `direction`, `targetSchool` |

### 院校模块（对齐设计 6 方向 + 15 院校）

| action | 说明 | 主要参数 |
|--------|------|----------|
| `listDirections` | 考研方向列表 | — |
| `listUniversities` | 院校列表 | `directionId`（可选筛选） |
| `getUniversityDetail` | 院校详情 | `universityId` |
| `seedUniversities` | 导入 15 校到云库（一次性） | — |

### 专注模块

| action | 说明 | 主要参数 |
|--------|------|----------|
| `addFocusSession` | 保存专注 | `durationMinutes`, `studyMode`(1-4), `subject` |
| `listFocusSessions` | 记录列表 | `limit` |
| `getWeeklyStats` | 近 N 天统计 | `days`；返回 `byDate`, `byMode` |

### AI 答疑模块（记录层，调用仍走 Coze）

| action | 说明 | 主要参数 |
|--------|------|----------|
| `addQaLog` | 保存问答 | `question`, `answer`, `conversationId` |
| `listQaLogs` | 历史列表 | `limit` |

### 备考计划（预留，待 Coze 工作流）

| action | 说明 |
|--------|------|
| `getStudyPlan` | 读取当前用户计划，无则返回 null |

## 页面对应

| 需求 | 页面 |
|------|------|
| 用户登录 | `pages/login` |
| 方向 + 院校选择（三步） | `pages/onboarding` |
| 番茄计时 | `pages/focus` |
| 可视化复盘 | `pages/stats` |
| AI 答疑 | `pages/test-ai` + `utils/coze.js` |
| 首页 | `pages/home` |

## 本地演示（无云）

1. 保持 `app.js` 中 `env: ''`
2. 登录页 → **本地体验（无云开发）**
3. 院校数据来自 `miniprogram/utils/catalog.js`，无需部署云函数

## Alpha 答辩可强调的后端工作

- 统一云函数网关 `backendApi`，前后端通过 `utils/api.js` 单一入口
- 用户画像字段与 ER 图一致（directionId / universityId）
- 15 所院校基础数据 + 6 大方向，支持列表/详情/筛选
- 专注记录扩展 studyMode，统计接口支持按日、按模式聚合
- 本地存储降级方案，无云环境可完整演示主流程
- AI 答疑记录入库接口已就绪，Coze 侧仅需继续调 `addQaLog` 落库

## 你不要随意改的文件（联调约定）

- `utils/coze.js`（Coze Token 配置）
- 云函数 `cozeChat`（若使用云端代理）

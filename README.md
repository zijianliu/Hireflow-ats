# HireFlow ATS - 招聘管理系统

一个完整的招聘 ATS（Applicant Tracking System）候选人流程管理系统，包含职位管理、候选人管理、面试安排、面试评价、Offer管理和统计看板等功能。

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT 认证

### 前端
- React 18 + TypeScript
- Vite
- Ant Design
- ECharts
- React Router
- Zustand 状态管理

## 项目结构

```
HireflowAts/
├── server/                 # 后端服务
│   ├── prisma/
│   │   └── schema.prisma   # 数据库模型
│   ├── src/
│   │   ├── index.ts        # 服务入口
│   │   ├── seed.ts         # 种子数据
│   │   ├── lib/            # 工具库
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务逻辑
│   │   ├── routes/         # 路由
│   │   └── tests/          # 测试
│   └── package.json
├── client/                 # 前端应用
│   ├── src/
│   │   ├── pages/          # 页面
│   │   ├── layouts/        # 布局
│   │   ├── components/     # 组件
│   │   ├── api/            # API 封装
│   │   ├── store/          # 状态管理
│   │   └── types/          # 类型定义
│   └── package.json
└── docker-compose.yml      # Docker 配置
```

## 快速开始

### 1. 启动 PostgreSQL 数据库

使用 Docker Compose 启动 PostgreSQL：

```bash
docker-compose up -d
```

或者使用本地 PostgreSQL，创建数据库：

```sql
CREATE DATABASE hireflow_ats;
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 3. 运行数据库迁移

```bash
cd server
npx prisma migrate dev --name init
```

### 4. 生成种子数据

```bash
npm run prisma:seed
```

### 5. 启动后端服务

```bash
cd server
npm run dev
```

后端服务运行在 http://localhost:3001

### 6. 启动前端应用

```bash
cd client
npm run dev
```

前端应用运行在 http://localhost:5173

## 测试账号

| 角色   | 用户名  | 密码   |
|--------|---------|--------|
| 管理员 | admin   | 123456 |
| HR    | hr001   | 123456 |
| HR    | hr002   | 123456 |
| 面试官 | tech001 | 123456 |
| 面试官 | tech002 | 123456 |

## 功能特性

### 1. 职位管理
- 创建、编辑、关闭、重新开放职位
- 职位状态：招聘中、已暂停、已关闭
- 招聘人数必须大于 0
- 已关闭职位不能新增候选人
- 支持搜索筛选和分页
- 管理员查看全部，HR 只能查看自己负责的职位

### 2. 候选人管理
- 新增、编辑、查看候选人
- 候选人来源：官网投递、内推、猎头、招聘平台、线下活动、其他
- 候选人阶段：简历初筛、HR面试、技术面试、终面、Offer、已入职、已淘汰
- 同一职位下手机号和邮箱不能重复
- 支持搜索筛选和分页

### 3. 阶段流转
- 严格的阶段流转规则
- 完整的时间线记录
- 非法流转返回明确错误

### 4. 面试安排
- HR 可以安排面试
- 面试轮次：HR面试、技术面试、终面
- 面试方式：线上、线下、电话
- 面试状态：待开始、已完成、已取消
- 时间冲突检测（面试官和候选人）

### 5. 面试评价
- 面试官只能查看和评价自己的面试
- 评分 1-5 分
- 是否通过必填
- 重复提交检测

### 6. Offer 与入职
- 只有 Offer 阶段候选人才能创建 Offer
- 同一候选人同一职位只能有一个有效 Offer
- Offer 状态：待确认、已接受、已拒绝、已撤回

### 7. 权限控制
- HR：管理自己负责职位下的所有内容
- 面试官：查看和评价自己的面试
- 管理员：查看全部数据

### 8. 统计看板
- 招聘中职位数、新增候选人数、待面试数量等指标
- 各阶段候选人数量分布
- 不同来源候选人的通过率
- 支持按职位、部门、时间范围筛选

## API 接口

### 认证
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `GET /api/auth/users` - 获取用户列表

### 职位
- `POST /api/jobs` - 创建职位
- `PUT /api/jobs/:id` - 更新职位
- `PATCH /api/jobs/:id/close` - 关闭职位
- `PATCH /api/jobs/:id/reopen` - 重新开放职位
- `PATCH /api/jobs/:id/pause` - 暂停职位
- `GET /api/jobs/:id` - 获取职位详情
- `GET /api/jobs` - 获取职位列表

### 候选人
- `POST /api/candidates` - 创建候选人
- `PUT /api/candidates/:id` - 更新候选人
- `GET /api/candidates/:id` - 获取候选人详情
- `GET /api/candidates` - 获取候选人列表
- `POST /api/candidates/:id/change-stage` - 变更候选人阶段

### 面试
- `POST /api/interviews` - 创建面试
- `PUT /api/interviews/:id` - 更新面试
- `PATCH /api/interviews/:id/cancel` - 取消面试
- `GET /api/interviews/:id` - 获取面试详情
- `GET /api/interviews` - 获取面试列表

### 评价
- `POST /api/evaluations` - 提交评价
- `GET /api/evaluations/interview/:interviewId` - 获取面试评价
- `GET /api/evaluations/candidate/:candidateId` - 获取候选人评价

### Offer
- `POST /api/offers` - 创建 Offer
- `PATCH /api/offers/:id/status` - 更新 Offer 状态
- `GET /api/offers/:id` - 获取 Offer 详情
- `GET /api/offers` - 获取 Offer 列表

### 统计看板
- `GET /api/dashboard` - 获取统计数据

## 数据库模型

### User
- id, username, email, password, name, role, phone, avatar, createdAt, updatedAt

### Job
- id, title, department, location, headcount, status, description, ownerId, createdAt, updatedAt

### Candidate
- id, name, phone, email, resumeUrl, source, jobId, stage, ownerId, remark, createdAt, updatedAt

### TimelineEvent
- id, candidateId, actionType, fromStage, toStage, operatorId, description, createdAt

### Interview
- id, candidateId, jobId, round, interviewerId, startTime, endTime, method, location, status, createdAt, updatedAt

### InterviewEvaluation
- id, interviewId, candidateId, score, strengths, concerns, passed, remark, createdAt

### Offer
- id, candidateId, jobId, salaryRange, onboardDate, status, remark, createdById, createdAt, updatedAt

## 开发

### 后端开发

```bash
cd server
npm run dev
```

### 前端开发

```bash
cd client
npm run dev
```

### 运行测试

```bash
cd server
npm test
```

### 构建

```bash
# 构建后端
cd server
npm run build

# 构建前端
cd client
npm run build

# 同时构建前后端
npm run build
```

## License

MIT

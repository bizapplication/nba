# @nba/erp

外层团队仓库中的 ERP 后端承接包。

## 当前状态

`Phase 6 / ERP 集成迁移` 第一轮已开始：

- 迁移源：`nba_new/packages/backend/apps/erp`
- 迁移目标：`packages/server/apps/erp`
- 当前已迁入：`Phase 1 / P0` 到 `Phase 5` 的正式后端源码
- 当前仍保留：`memory / db` 双模式、Express + TypeORM + PostgreSQL、按业务域拆分的 finance / procurement / CRM / HR 实现

## 当前目录

```text
packages/server/apps/erp/
├── .env.example
├── data-source.ts
├── package.json
├── tsconfig.json
└── src/
    ├── application/
    ├── domain/
    ├── infrastructure/
    ├── interfaces/
    ├── shared/
    ├── tests/
    ├── index.ts
    └── server.ts
```

## 运行脚本

```bash
pnpm --filter @nba/erp dev
pnpm --filter @nba/erp dev:db
pnpm --filter @nba/erp test
pnpm --filter @nba/erp typecheck
```

## 说明

- 本包当前是外层仓库承接 ERP 五阶段后端能力的主落点。
- `packages/server/platform` 本轮不改，ERP 先以自包含方式迁入。
- 后续迁移轮次会继续处理：依赖安装、build/typecheck 验证、与外层平台/前端的进一步集成。

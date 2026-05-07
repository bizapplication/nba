# Database Scaffold

这里放本地 PostgreSQL 启动骨架。

当前默认约束：

- 数据库：PostgreSQL
- schema：`erp`
- 表/列：`snake_case`
- 主键：字符串业务 id

本地启动方式：

```bash
docker compose -f database/docker-compose.yml up -d
```

启动后默认连接参数：

- host：`127.0.0.1`
- port：`5432`
- username：`postgres`
- password：`postgres`
- database：`nba`
- schema：`erp`

说明：

- `database/init/001-create-schema.sql` 会在容器首次初始化时创建 `erp` schema。
- ERP 后端在 `ERP_DATA_MODE=db` 下还会自动检查数据库与 schema 是否存在。
- 当前阶段依赖 `TypeORM synchronize` 自动建表，因此本地联调建议保留 `ERP_DB_SYNCHRONIZE=true`。

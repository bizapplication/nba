# ERP Source Layout

目录分工：

- `application/fin`：应用服务与用例编排
- `domain/fin`：领域对象、规则、仓储接口
- `infrastructure/persistence/memory`：内存版仓储
- `infrastructure/persistence/typeorm`：数据库版仓储
- `interfaces/http/controllers`：HTTP 控制器
- `interfaces/http/routes`：路由装配
- `shared`：container、配置、通用基础设施
- `tests`：最小测试

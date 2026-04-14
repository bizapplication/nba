"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = require("../../../shared/config/env");
const CustomerORM_1 = require("./entities/CustomerORM");
const OrderORM_1 = require("./entities/OrderORM");
const OpportunityORM_1 = require("./entities/OpportunityORM");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: env_1.env.db.host,
    port: env_1.env.db.port,
    username: env_1.env.db.user,
    password: env_1.env.db.password,
    database: env_1.env.db.database,
    ssl: env_1.env.db.ssl ? { rejectUnauthorized: false } : false,
    synchronize: env_1.env.db.synchronize,
    logging: env_1.env.db.logging,
    entities: [CustomerORM_1.CustomerORM, OrderORM_1.OrderORM, OpportunityORM_1.OpportunityORM],
    migrations: ['src/infrastructure/persistence/typeorm/migrations/*.ts'],
});

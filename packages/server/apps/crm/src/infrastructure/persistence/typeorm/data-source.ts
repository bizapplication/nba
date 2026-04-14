import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../../../shared/config/env';
import { CustomerORM } from './entities/CustomerORM';
import { OrderORM } from './entities/OrderORM';
import { OpportunityORM } from './entities/OpportunityORM';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.db.host,
  port: env.db.port,
  username: env.db.user,
  password: env.db.password,
  database: env.db.database,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  synchronize: env.db.synchronize,
  logging: env.db.logging,
  entities: [CustomerORM, OrderORM, OpportunityORM],
  migrations: ['src/infrastructure/persistence/typeorm/migrations/*.ts'],
});

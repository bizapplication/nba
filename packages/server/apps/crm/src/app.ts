import cors from 'cors';
import express, { type Express } from 'express';
import type { DataSource } from 'typeorm';
import { CustomerService } from './application/customers/CustomerService';
import { OpportunityService } from './application/opportunities/OpportunityService';
import { OrderService } from './application/orders/OrderService';
import { CustomerORM } from './infrastructure/persistence/typeorm/entities/CustomerORM';
import { OpportunityORM } from './infrastructure/persistence/typeorm/entities/OpportunityORM';
import { OrderORM } from './infrastructure/persistence/typeorm/entities/OrderORM';
import { TypeORMCustomerRepository } from './infrastructure/persistence/typeorm/repositories/TypeORMCustomerRepository';
import { TypeORMOpportunityRepository } from './infrastructure/persistence/typeorm/repositories/TypeORMOpportunityRepository';
import { TypeORMOrderRepository } from './infrastructure/persistence/typeorm/repositories/TypeORMOrderRepository';
import { CustomerController } from './interfaces/http/controllers/CustomerController';
import { OpportunityController } from './interfaces/http/controllers/OpportunityController';
import { OrderController } from './interfaces/http/controllers/OrderController';
import { errorHandler } from './interfaces/http/middleware/errorHandler';
import { createApiRouter } from './interfaces/http/routes';

export function createApp(dataSource: DataSource): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'crm' });
  });

  const customerRepository = new TypeORMCustomerRepository(dataSource.getRepository(CustomerORM));
  const orderRepository = new TypeORMOrderRepository(dataSource.getRepository(OrderORM));
  const opportunityRepository = new TypeORMOpportunityRepository(dataSource.getRepository(OpportunityORM));

  const customerService = new CustomerService(customerRepository);
  const orderService = new OrderService(orderRepository);
  const opportunityService = new OpportunityService(opportunityRepository);

  const customerController = new CustomerController(customerService);
  const orderController = new OrderController(orderService);
  const opportunityController = new OpportunityController(opportunityService);

  app.use(
    '/api',
    createApiRouter({
      customerController,
      orderController,
      opportunityController,
    }),
  );

  app.use(errorHandler);

  return app;
}

import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { OrderController } from '../controllers/OrderController';
import { OpportunityController } from '../controllers/OpportunityController';
import { createCustomerRoutes } from './CustomerRoutes';
import { createOpportunityRoutes } from './OpportunityRoutes';
import { createOrderRoutes } from './OrderRoutes';

interface RouteControllers {
  customerController: CustomerController;
  orderController: OrderController;
  opportunityController: OpportunityController;
}

export function createApiRouter(controllers: RouteControllers): Router {
  const router = Router();

  router.use('/customers', createCustomerRoutes(controllers.customerController));
  router.use('/orders', createOrderRoutes(controllers.orderController));
  router.use('/opportunities', createOpportunityRoutes(controllers.opportunityController));

  return router;
}

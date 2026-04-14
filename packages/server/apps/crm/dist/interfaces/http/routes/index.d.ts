import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { OrderController } from '../controllers/OrderController';
import { OpportunityController } from '../controllers/OpportunityController';
interface RouteControllers {
    customerController: CustomerController;
    orderController: OrderController;
    opportunityController: OpportunityController;
}
export declare function createApiRouter(controllers: RouteControllers): Router;
export {};

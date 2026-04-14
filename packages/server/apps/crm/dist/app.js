"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const CustomerService_1 = require("./application/customers/CustomerService");
const OpportunityService_1 = require("./application/opportunities/OpportunityService");
const OrderService_1 = require("./application/orders/OrderService");
const CustomerORM_1 = require("./infrastructure/persistence/typeorm/entities/CustomerORM");
const OpportunityORM_1 = require("./infrastructure/persistence/typeorm/entities/OpportunityORM");
const OrderORM_1 = require("./infrastructure/persistence/typeorm/entities/OrderORM");
const TypeORMCustomerRepository_1 = require("./infrastructure/persistence/typeorm/repositories/TypeORMCustomerRepository");
const TypeORMOpportunityRepository_1 = require("./infrastructure/persistence/typeorm/repositories/TypeORMOpportunityRepository");
const TypeORMOrderRepository_1 = require("./infrastructure/persistence/typeorm/repositories/TypeORMOrderRepository");
const CustomerController_1 = require("./interfaces/http/controllers/CustomerController");
const OpportunityController_1 = require("./interfaces/http/controllers/OpportunityController");
const OrderController_1 = require("./interfaces/http/controllers/OrderController");
const errorHandler_1 = require("./interfaces/http/middleware/errorHandler");
const routes_1 = require("./interfaces/http/routes");
function createApp(dataSource) {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.get('/health', (_req, res) => {
        res.status(200).json({ ok: true, service: 'crm' });
    });
    const customerRepository = new TypeORMCustomerRepository_1.TypeORMCustomerRepository(dataSource.getRepository(CustomerORM_1.CustomerORM));
    const orderRepository = new TypeORMOrderRepository_1.TypeORMOrderRepository(dataSource.getRepository(OrderORM_1.OrderORM));
    const opportunityRepository = new TypeORMOpportunityRepository_1.TypeORMOpportunityRepository(dataSource.getRepository(OpportunityORM_1.OpportunityORM));
    const customerService = new CustomerService_1.CustomerService(customerRepository);
    const orderService = new OrderService_1.OrderService(orderRepository);
    const opportunityService = new OpportunityService_1.OpportunityService(opportunityRepository);
    const customerController = new CustomerController_1.CustomerController(customerService);
    const orderController = new OrderController_1.OrderController(orderService);
    const opportunityController = new OpportunityController_1.OpportunityController(opportunityService);
    app.use('/api', (0, routes_1.createApiRouter)({
        customerController,
        orderController,
        opportunityController,
    }));
    app.use(errorHandler_1.errorHandler);
    return app;
}

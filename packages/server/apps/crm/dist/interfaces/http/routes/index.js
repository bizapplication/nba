"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRouter = createApiRouter;
const express_1 = require("express");
const CustomerRoutes_1 = require("./CustomerRoutes");
const OpportunityRoutes_1 = require("./OpportunityRoutes");
const OrderRoutes_1 = require("./OrderRoutes");
function createApiRouter(controllers) {
    const router = (0, express_1.Router)();
    router.use('/customers', (0, CustomerRoutes_1.createCustomerRoutes)(controllers.customerController));
    router.use('/orders', (0, OrderRoutes_1.createOrderRoutes)(controllers.orderController));
    router.use('/opportunities', (0, OpportunityRoutes_1.createOpportunityRoutes)(controllers.opportunityController));
    return router;
}

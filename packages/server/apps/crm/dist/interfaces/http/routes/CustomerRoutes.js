"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomerRoutes = createCustomerRoutes;
const express_1 = require("express");
function createCustomerRoutes(controller) {
    const router = (0, express_1.Router)();
    router.get('/', (req, res) => controller.getAll(req, res));
    router.post('/', controller.create);
    router.delete('/batch', controller.softDeleteByCondition);
    router.patch('/:id', controller.updateById);
    router.delete('/:id', controller.softDeleteById);
    return router;
}

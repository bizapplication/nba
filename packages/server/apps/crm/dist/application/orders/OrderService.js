"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
class OrderService {
    orderRepository;
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async getAllOrders(condition, options) {
        return this.orderRepository.findAll(condition, options);
    }
    async createOrder(dto) {
        return this.orderRepository.create(dto);
    }
    async updateOrder(id, dto) {
        return this.orderRepository.updateById(id, dto);
    }
    async softDeleteOrder(id) {
        return this.orderRepository.softDeleteById(id);
    }
    async softDeleteOrdersByCondition(condition) {
        return this.orderRepository.softDeleteByIds(condition.ids);
    }
}
exports.OrderService = OrderService;

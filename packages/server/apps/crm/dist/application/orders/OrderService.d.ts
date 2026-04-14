import type { OrderCondition } from '../../domain/orders/OrderCondition';
import type { OrderQueryOptions, OrderRepository } from '../../domain/orders/OrderRepository';
import type { CreateOrderDTO } from './dto/CreateOrderDTO';
import type { UpdateOrderDTO } from './dto/UpdateOrderDTO';
export declare class OrderService {
    private readonly orderRepository;
    constructor(orderRepository: OrderRepository);
    getAllOrders(condition: OrderCondition, options: OrderQueryOptions): Promise<{
        data: import("../../domain/orders/Order").OrderProps[];
        total: number;
    }>;
    createOrder(dto: CreateOrderDTO): Promise<import("../../domain/orders/Order").OrderProps>;
    updateOrder(id: string, dto: UpdateOrderDTO): Promise<import("../../domain/orders/Order").OrderProps | null>;
    softDeleteOrder(id: string): Promise<number>;
    softDeleteOrdersByCondition(condition: {
        ids: string[];
    }): Promise<number>;
}

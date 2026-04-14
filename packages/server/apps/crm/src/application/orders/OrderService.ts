import type { OrderCondition } from '../../domain/orders/OrderCondition';
import type { OrderQueryOptions, OrderRepository } from '../../domain/orders/OrderRepository';
import type { CreateOrderDTO } from './dto/CreateOrderDTO';
import type { UpdateOrderDTO } from './dto/UpdateOrderDTO';

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async getAllOrders(condition: OrderCondition, options: OrderQueryOptions) {
    return this.orderRepository.findAll(condition, options);
  }

  async createOrder(dto: CreateOrderDTO) {
    return this.orderRepository.create(dto);
  }

  async updateOrder(id: string, dto: UpdateOrderDTO) {
    return this.orderRepository.updateById(id, dto);
  }

  async softDeleteOrder(id: string) {
    return this.orderRepository.softDeleteById(id);
  }

  async softDeleteOrdersByCondition(condition: { ids: string[] }) {
    return this.orderRepository.softDeleteByIds(condition.ids);
  }
}

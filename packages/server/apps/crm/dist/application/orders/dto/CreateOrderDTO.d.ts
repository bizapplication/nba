import type { OrderStatus } from '../../../domain/orders/Order';
export interface CreateOrderDTO {
    orderNo: string;
    customerId: string;
    name: string;
    description: string;
    amount: number;
    status: OrderStatus;
}

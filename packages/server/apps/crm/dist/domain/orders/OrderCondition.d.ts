import type { OrderProps, OrderStatus } from './Order';
export type OrderCondition = Partial<Pick<OrderProps, 'id' | 'orderNo' | 'customerId' | 'name' | 'isdelete'>> & {
    ids?: string[];
    keyword?: string;
    status?: OrderStatus;
};

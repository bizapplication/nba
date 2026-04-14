import type { OrderCondition } from './OrderCondition';
import type { OrderProps } from './Order';

export interface OrderQueryOptions {
  skip: number;
  take: number;
  order?: Record<string, 'asc' | 'desc' | 'ASC' | 'DESC'>;
}

export interface OrderRepository {
  findAll(
    condition: OrderCondition,
    options: OrderQueryOptions,
  ): Promise<{ data: OrderProps[]; total: number }>;
  findById(id: string): Promise<OrderProps | null>;
  create(input: Omit<OrderProps, 'id' | 'createdAt' | 'updatedAt' | 'isdelete'>): Promise<OrderProps>;
  updateById(
    id: string,
    input: Partial<Pick<OrderProps, 'orderNo' | 'customerId' | 'name' | 'description' | 'amount' | 'status'>>,
  ): Promise<OrderProps | null>;
  softDeleteById(id: string): Promise<number>;
  softDeleteByIds(ids: string[]): Promise<number>;
}

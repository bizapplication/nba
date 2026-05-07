import { Repository } from 'typeorm';
import type { OrderCondition } from '../../../../domain/orders/OrderCondition';
import type { OrderProps } from '../../../../domain/orders/Order';
import type { OrderQueryOptions, OrderRepository } from '../../../../domain/orders/OrderRepository';
import { OrderORM } from '../entities/OrderORM';
export declare class TypeORMOrderRepository implements OrderRepository {
    private readonly repository;
    constructor(repository: Repository<OrderORM>);
    findAll(condition: OrderCondition, options: OrderQueryOptions): Promise<{
        data: OrderProps[];
        total: number;
    }>;
    findById(id: string): Promise<OrderProps | null>;
    create(input: Omit<OrderProps, 'id' | 'createdAt' | 'updatedAt' | 'isdelete'>): Promise<OrderProps>;
    updateById(id: string, input: Partial<Pick<OrderProps, 'orderNo' | 'customerId' | 'name' | 'description' | 'amount' | 'status'>>): Promise<OrderProps | null>;
    softDeleteById(id: string): Promise<number>;
    softDeleteByIds(ids: string[]): Promise<number>;
}

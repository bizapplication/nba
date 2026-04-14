import { Repository } from 'typeorm';
import type { CustomerCondition } from '../../../../domain/customers/CustomerCondition';
import type { CustomerProps } from '../../../../domain/customers/Customer';
import type { CustomerQueryOptions, CustomerRepository } from '../../../../domain/customers/CustomerRepository';
import { CustomerORM } from '../entities/CustomerORM';
export declare class TypeORMCustomerRepository implements CustomerRepository {
    private readonly repository;
    constructor(repository: Repository<CustomerORM>);
    findAll(condition: CustomerCondition, options: CustomerQueryOptions): Promise<{
        data: CustomerProps[];
        total: number;
    }>;
    findById(id: string): Promise<CustomerProps | null>;
    create(input: Omit<CustomerProps, 'id' | 'createdAt' | 'updatedAt' | 'isdelete'>): Promise<CustomerProps>;
    updateById(id: string, input: Partial<Pick<CustomerProps, 'name' | 'email' | 'phone' | 'company'>>): Promise<CustomerProps | null>;
    softDeleteById(id: string): Promise<number>;
    softDeleteByIds(ids: string[]): Promise<number>;
}

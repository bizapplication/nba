import type { CustomerCondition } from './CustomerCondition';
import type { CustomerProps } from './Customer';

export interface CustomerQueryOptions {
  skip: number;
  take: number;
  order?: Record<string, 'asc' | 'desc' | 'ASC' | 'DESC'>;
}

export interface CustomerRepository {
  findAll(
    condition: CustomerCondition,
    options: CustomerQueryOptions,
  ): Promise<{ data: CustomerProps[]; total: number }>;
  findById(id: string): Promise<CustomerProps | null>;
  create(input: Omit<CustomerProps, 'id' | 'createdAt' | 'updatedAt' | 'isdelete'>): Promise<CustomerProps>;
  updateById(
    id: string,
    input: Partial<Pick<CustomerProps, 'name' | 'email' | 'phone' | 'company'>>,
  ): Promise<CustomerProps | null>;
  softDeleteById(id: string): Promise<number>;
  softDeleteByIds(ids: string[]): Promise<number>;
}

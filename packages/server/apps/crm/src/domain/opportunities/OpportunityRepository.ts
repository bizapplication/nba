import type { OpportunityCondition } from './OpportunityCondition';
import type { OpportunityProps } from './Opportunity';

export interface OpportunityQueryOptions {
  skip: number;
  take: number;
  order?: Record<string, 'asc' | 'desc' | 'ASC' | 'DESC'>;
}

export interface OpportunityRepository {
  findAll(
    condition: OpportunityCondition,
    options: OpportunityQueryOptions,
  ): Promise<{ data: OpportunityProps[]; total: number }>;
  findById(id: string): Promise<OpportunityProps | null>;
  create(input: Omit<OpportunityProps, 'id' | 'createdAt' | 'updatedAt' | 'isdelete'>): Promise<OpportunityProps>;
  updateById(
    id: string,
    input: Partial<
      Pick<OpportunityProps, 'customerId' | 'title' | 'description' | 'amount' | 'stage' | 'expectedCloseDate'>
    >,
  ): Promise<OpportunityProps | null>;
  softDeleteById(id: string): Promise<number>;
  softDeleteByIds(ids: string[]): Promise<number>;
}

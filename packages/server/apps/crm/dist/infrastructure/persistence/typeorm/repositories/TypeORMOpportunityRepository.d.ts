import { Repository } from 'typeorm';
import type { OpportunityCondition } from '../../../../domain/opportunities/OpportunityCondition';
import type { OpportunityProps } from '../../../../domain/opportunities/Opportunity';
import type { OpportunityQueryOptions, OpportunityRepository } from '../../../../domain/opportunities/OpportunityRepository';
import { OpportunityORM } from '../entities/OpportunityORM';
export declare class TypeORMOpportunityRepository implements OpportunityRepository {
    private readonly repository;
    constructor(repository: Repository<OpportunityORM>);
    findAll(condition: OpportunityCondition, options: OpportunityQueryOptions): Promise<{
        data: OpportunityProps[];
        total: number;
    }>;
    findById(id: string): Promise<OpportunityProps | null>;
    create(input: Omit<OpportunityProps, 'id' | 'createdAt' | 'updatedAt' | 'isdelete'>): Promise<OpportunityProps>;
    updateById(id: string, input: Partial<Pick<OpportunityProps, 'customerId' | 'title' | 'description' | 'amount' | 'stage' | 'expectedCloseDate'>>): Promise<OpportunityProps | null>;
    softDeleteById(id: string): Promise<number>;
    softDeleteByIds(ids: string[]): Promise<number>;
}

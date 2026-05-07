import type { OpportunityCondition } from '../../domain/opportunities/OpportunityCondition';
import type { OpportunityQueryOptions, OpportunityRepository } from '../../domain/opportunities/OpportunityRepository';
import type { CreateOpportunityDTO } from './dto/CreateOpportunityDTO';
import type { UpdateOpportunityDTO } from './dto/UpdateOpportunityDTO';
export declare class OpportunityService {
    private readonly opportunityRepository;
    constructor(opportunityRepository: OpportunityRepository);
    getAllOpportunities(condition: OpportunityCondition, options: OpportunityQueryOptions): Promise<{
        data: import("../../domain/opportunities/Opportunity").OpportunityProps[];
        total: number;
    }>;
    createOpportunity(dto: CreateOpportunityDTO): Promise<import("../../domain/opportunities/Opportunity").OpportunityProps>;
    updateOpportunity(id: string, dto: UpdateOpportunityDTO): Promise<import("../../domain/opportunities/Opportunity").OpportunityProps | null>;
    softDeleteOpportunity(id: string): Promise<number>;
    softDeleteOpportunitiesByCondition(condition: {
        ids: string[];
    }): Promise<number>;
}

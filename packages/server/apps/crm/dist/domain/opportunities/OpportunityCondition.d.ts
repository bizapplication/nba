import type { OpportunityProps, OpportunityStage } from './Opportunity';
export type OpportunityCondition = Partial<Pick<OpportunityProps, 'id' | 'customerId' | 'title' | 'isdelete'>> & {
    ids?: string[];
    keyword?: string;
    stage?: OpportunityStage;
};

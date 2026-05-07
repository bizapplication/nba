import type { OpportunityStage } from '../../../domain/opportunities/Opportunity';
export interface CreateOpportunityDTO {
    customerId: string;
    title: string;
    description: string;
    amount: number;
    stage: OpportunityStage;
    expectedCloseDate: Date | null;
}

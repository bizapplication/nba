export type OpportunityStage = 'new' | 'qualified' | 'proposal' | 'won' | 'lost';
export interface OpportunityProps {
    id: string;
    customerId: string;
    title: string;
    description: string;
    amount: number;
    stage: OpportunityStage;
    expectedCloseDate: Date | null;
    isdelete: boolean;
    createdAt: Date;
    updatedAt: Date;
}

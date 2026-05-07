export declare class OpportunityORM {
    id: string;
    customerId: string;
    title: string;
    description: string;
    amount: number;
    stage: 'new' | 'qualified' | 'proposal' | 'won' | 'lost';
    expectedCloseDate: Date | null;
    isdelete: boolean;
    createdAt: Date;
    updatedAt: Date;
}

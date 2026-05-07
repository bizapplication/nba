export declare class OrderORM {
    id: string;
    orderNo: string;
    customerId: string;
    name: string;
    description: string;
    amount: number;
    status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
    isdelete: boolean;
    createdAt: Date;
    updatedAt: Date;
}

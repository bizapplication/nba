export type OrderStatus = 'draft' | 'confirmed' | 'completed' | 'cancelled';

export interface OrderProps {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string | null;
  name: string;
  description: string;
  amount: number;
  status: OrderStatus;
  isdelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

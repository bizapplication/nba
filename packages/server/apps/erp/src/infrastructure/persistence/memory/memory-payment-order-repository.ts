import type { PaymentOrderRepository } from '../../../domain/procurement/repositories.ts';
import type { PaymentOrder } from '../../../domain/procurement/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryPaymentOrderRepository implements PaymentOrderRepository {
  items: Map<string, PaymentOrder>;

  constructor(initialItems: PaymentOrder[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<PaymentOrder[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<PaymentOrder | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByOrderNo(paymentOrderNo: string): Promise<PaymentOrder | null> {
    for (const item of this.items.values()) {
      if (item.paymentOrderNo.toUpperCase() === paymentOrderNo.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(paymentOrder: PaymentOrder): Promise<PaymentOrder> {
    this.items.set(paymentOrder.id, clone(paymentOrder));
    return clone(paymentOrder);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

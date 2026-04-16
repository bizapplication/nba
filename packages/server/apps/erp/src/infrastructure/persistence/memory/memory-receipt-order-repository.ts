import type { ReceiptOrderRepository } from '../../../domain/crm/repositories.ts';
import type { ReceiptOrder } from '../../../domain/crm/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryReceiptOrderRepository implements ReceiptOrderRepository {
  items: Map<string, ReceiptOrder>;

  constructor(initialItems: ReceiptOrder[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<ReceiptOrder[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<ReceiptOrder | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByOrderNo(receiptOrderNo: string): Promise<ReceiptOrder | null> {
    for (const item of this.items.values()) {
      if (item.receiptOrderNo.toUpperCase() === receiptOrderNo.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(receiptOrder: ReceiptOrder): Promise<ReceiptOrder> {
    this.items.set(receiptOrder.id, clone(receiptOrder));
    return clone(receiptOrder);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

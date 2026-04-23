import type { PurchaseOrderRepository } from '../../../domain/procurement/repositories.ts';
import type { PurchaseOrder } from '../../../domain/procurement/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  items: Map<string, PurchaseOrder>;

  constructor(initialItems: PurchaseOrder[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<PurchaseOrder[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByOrderNo(purchaseOrderNo: string): Promise<PurchaseOrder | null> {
    for (const item of this.items.values()) {
      if (item.purchaseOrderNo.toUpperCase() === purchaseOrderNo.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder> {
    this.items.set(purchaseOrder.id, clone(purchaseOrder));
    return clone(purchaseOrder);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

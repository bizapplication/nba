import type { GoodsReceiptRepository } from '../../../domain/procurement/repositories.ts';
import type { GoodsReceipt } from '../../../domain/procurement/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryGoodsReceiptRepository implements GoodsReceiptRepository {
  items: Map<string, GoodsReceipt>;

  constructor(initialItems: GoodsReceipt[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<GoodsReceipt[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<GoodsReceipt | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByReceiptNo(goodsReceiptNo: string): Promise<GoodsReceipt | null> {
    for (const item of this.items.values()) {
      if (item.goodsReceiptNo.toUpperCase() === goodsReceiptNo.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(goodsReceipt: GoodsReceipt): Promise<GoodsReceipt> {
    this.items.set(goodsReceipt.id, clone(goodsReceipt));
    return clone(goodsReceipt);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

import type { TransactionRepository } from '../../../domain/fin/repositories.ts';
import type { TransactionRecord } from '../../../domain/fin/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryTransactionRepository implements TransactionRepository {
  items: Map<string, TransactionRecord>;

  constructor(initialItems: TransactionRecord[] = []) {
    this.items = new Map(initialItems.map((item) => [item.header.id, clone(item)]));
  }

  async listAll(): Promise<TransactionRecord[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<TransactionRecord | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(code: string): Promise<TransactionRecord | null> {
    for (const item of this.items.values()) {
      if (item.header.code.toUpperCase() === code.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(transaction: TransactionRecord): Promise<TransactionRecord> {
    this.items.set(transaction.header.id, clone(transaction));
    return clone(transaction);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

import type { LedgerRepository } from '../../../domain/fin/repositories.ts';
import type { LedgerBook } from '../../../domain/fin/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryLedgerRepository implements LedgerRepository {
  items: Map<string, LedgerBook>;

  constructor(initialItems: LedgerBook[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<LedgerBook[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<LedgerBook | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(code: string): Promise<LedgerBook | null> {
    for (const item of this.items.values()) {
      if (item.code.toUpperCase() === code.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(ledger: LedgerBook): Promise<LedgerBook> {
    this.items.set(ledger.id, clone(ledger));
    return clone(ledger);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

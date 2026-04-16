import type { AccountRepository } from '../../../domain/fin/repositories.ts';
import type { FinancialAccount } from '../../../domain/fin/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryAccountRepository implements AccountRepository {
  items: Map<string, FinancialAccount>;

  constructor(initialItems: FinancialAccount[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<FinancialAccount[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<FinancialAccount | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(code: string): Promise<FinancialAccount | null> {
    for (const item of this.items.values()) {
      if (item.accountCode.toUpperCase() === code.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(account: FinancialAccount): Promise<FinancialAccount> {
    this.items.set(account.id, clone(account));
    return clone(account);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

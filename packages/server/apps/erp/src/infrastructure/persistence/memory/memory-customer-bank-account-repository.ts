import type { CustomerBankAccountRepository } from '../../../domain/crm/repositories.ts';
import type { CustomerBankAccount } from '../../../domain/crm/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryCustomerBankAccountRepository
implements CustomerBankAccountRepository {
  items: Map<string, CustomerBankAccount>;

  constructor(initialItems: CustomerBankAccount[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<CustomerBankAccount[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<CustomerBankAccount | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async save(bankAccount: CustomerBankAccount): Promise<CustomerBankAccount> {
    this.items.set(bankAccount.id, clone(bankAccount));
    return clone(bankAccount);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

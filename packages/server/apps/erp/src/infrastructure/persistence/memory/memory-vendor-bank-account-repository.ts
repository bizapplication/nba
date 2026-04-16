import type { VendorBankAccountRepository } from '../../../domain/procurement/repositories.ts';
import type { VendorBankAccount } from '../../../domain/procurement/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryVendorBankAccountRepository
implements VendorBankAccountRepository {
  items: Map<string, VendorBankAccount>;

  constructor(initialItems: VendorBankAccount[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<VendorBankAccount[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<VendorBankAccount | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async save(bankAccount: VendorBankAccount): Promise<VendorBankAccount> {
    this.items.set(bankAccount.id, clone(bankAccount));
    return clone(bankAccount);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

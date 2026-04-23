import type {
  BankRepository,
} from '../../../domain/fin/repositories.ts';
import type { FinancialInstitution } from '../../../domain/fin/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryBankRepository implements BankRepository {
  items: Map<string, FinancialInstitution>;

  constructor(initialItems: FinancialInstitution[] = []) {
    this.items = new Map(
      initialItems.map((item) => [item.id, clone(item)]),
    );
  }

  async listAll(): Promise<FinancialInstitution[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<FinancialInstitution | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByExternalBankCode(bankCode: string): Promise<FinancialInstitution | null> {
    for (const item of this.items.values()) {
      if (item.externalBankCode.toUpperCase() === bankCode.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(bank: FinancialInstitution): Promise<FinancialInstitution> {
    this.items.set(bank.id, clone(bank));
    return clone(bank);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

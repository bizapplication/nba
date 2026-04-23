import type { ExpenseClaimRepository } from '../../../domain/hr/repositories.ts';
import type { ExpenseClaim } from '../../../domain/hr/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryExpenseClaimRepository implements ExpenseClaimRepository {
  items: Map<string, ExpenseClaim>;

  constructor(initialItems: ExpenseClaim[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<ExpenseClaim[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<ExpenseClaim | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByClaimNo(expenseClaimNo: string): Promise<ExpenseClaim | null> {
    for (const item of this.items.values()) {
      if (item.expenseClaimNo.toUpperCase() === expenseClaimNo.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(expenseClaim: ExpenseClaim): Promise<ExpenseClaim> {
    this.items.set(expenseClaim.id, clone(expenseClaim));
    return clone(expenseClaim);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

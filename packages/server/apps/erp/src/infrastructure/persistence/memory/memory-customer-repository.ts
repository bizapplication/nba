import type { CustomerRepository } from '../../../domain/crm/repositories.ts';
import type { Customer } from '../../../domain/crm/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryCustomerRepository implements CustomerRepository {
  items: Map<string, Customer>;

  constructor(initialItems: Customer[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<Customer[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<Customer | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(customerCode: string): Promise<Customer | null> {
    for (const item of this.items.values()) {
      if (item.customerCode.toUpperCase() === customerCode.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(customer: Customer): Promise<Customer> {
    this.items.set(customer.id, clone(customer));
    return clone(customer);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

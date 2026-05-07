import type { VendorRepository } from '../../../domain/procurement/repositories.ts';
import type { Vendor } from '../../../domain/procurement/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryVendorRepository implements VendorRepository {
  items: Map<string, Vendor>;

  constructor(initialItems: Vendor[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<Vendor[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<Vendor | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(vendorCode: string): Promise<Vendor | null> {
    for (const item of this.items.values()) {
      if (item.vendorCode.toUpperCase() === vendorCode.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(vendor: Vendor): Promise<Vendor> {
    this.items.set(vendor.id, clone(vendor));
    return clone(vendor);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

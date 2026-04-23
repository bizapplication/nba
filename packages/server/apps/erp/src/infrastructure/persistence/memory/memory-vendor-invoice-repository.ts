import type { VendorInvoiceRepository } from '../../../domain/procurement/repositories.ts';
import type { VendorInvoice } from '../../../domain/procurement/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryVendorInvoiceRepository implements VendorInvoiceRepository {
  items: Map<string, VendorInvoice>;

  constructor(initialItems: VendorInvoice[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<VendorInvoice[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<VendorInvoice | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByInvoiceNo(vendorInvoiceNo: string): Promise<VendorInvoice | null> {
    for (const item of this.items.values()) {
      if (item.vendorInvoiceNo.toUpperCase() === vendorInvoiceNo.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(vendorInvoice: VendorInvoice): Promise<VendorInvoice> {
    this.items.set(vendorInvoice.id, clone(vendorInvoice));
    return clone(vendorInvoice);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

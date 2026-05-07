import type { ProductRepository } from '../../../domain/procurement/repositories.ts';
import type { Product } from '../../../domain/procurement/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryProductRepository implements ProductRepository {
  items: Map<string, Product>;

  constructor(initialItems: Product[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<Product[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<Product | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(productCode: string): Promise<Product | null> {
    for (const item of this.items.values()) {
      if (item.productCode.toUpperCase() === productCode.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(product: Product): Promise<Product> {
    this.items.set(product.id, clone(product));
    return clone(product);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

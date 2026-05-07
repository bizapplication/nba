import type { EmploymentRepository } from '../../../domain/hr/repositories.ts';
import type { Employment } from '../../../domain/hr/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryEmploymentRepository implements EmploymentRepository {
  items: Map<string, Employment>;

  constructor(initialItems: Employment[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<Employment[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<Employment | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async save(employment: Employment): Promise<Employment> {
    this.items.set(employment.id, clone(employment));
    return clone(employment);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

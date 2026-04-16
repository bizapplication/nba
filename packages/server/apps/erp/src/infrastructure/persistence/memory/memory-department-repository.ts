import type { DepartmentRepository } from '../../../domain/hr/repositories.ts';
import type { Department } from '../../../domain/hr/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryDepartmentRepository implements DepartmentRepository {
  items: Map<string, Department>;

  constructor(initialItems: Department[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<Department[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<Department | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(departmentCode: string): Promise<Department | null> {
    for (const item of this.items.values()) {
      if (item.departmentCode.toUpperCase() === departmentCode.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(department: Department): Promise<Department> {
    this.items.set(department.id, clone(department));
    return clone(department);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

import type { EmployeeRepository } from '../../../domain/hr/repositories.ts';
import type { Employee } from '../../../domain/hr/types.ts';
import { clone } from '../../../shared/clone.ts';

export class MemoryEmployeeRepository implements EmployeeRepository {
  items: Map<string, Employee>;

  constructor(initialItems: Employee[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, clone(item)]));
  }

  async listAll(): Promise<Employee[]> {
    return clone([...this.items.values()]);
  }

  async findById(id: string): Promise<Employee | null> {
    const item = this.items.get(id);
    return item ? clone(item) : null;
  }

  async findByCode(employeeCode: string): Promise<Employee | null> {
    for (const item of this.items.values()) {
      if (item.employeeCode.toUpperCase() === employeeCode.toUpperCase()) {
        return clone(item);
      }
    }

    return null;
  }

  async save(employee: Employee): Promise<Employee> {
    this.items.set(employee.id, clone(employee));
    return clone(employee);
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}

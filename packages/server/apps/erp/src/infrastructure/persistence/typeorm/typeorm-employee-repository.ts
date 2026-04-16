import { DataSource } from 'typeorm';

import type { EmployeeRepository } from '../../../domain/hr/repositories.ts';
import type { Employee } from '../../../domain/hr/types.ts';
import { employeeEntity } from './entities.ts';

export class TypeOrmEmployeeRepository implements EmployeeRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<Employee[]> {
    return this.dataSource.getRepository(employeeEntity).find();
  }

  async findById(id: string): Promise<Employee | null> {
    return this.dataSource.getRepository(employeeEntity).findOneBy({ id });
  }

  async findByCode(employeeCode: string): Promise<Employee | null> {
    return this.dataSource
      .getRepository(employeeEntity)
      .createQueryBuilder('employee')
      .where('UPPER(employee.employeeCode) = UPPER(:employeeCode)', {
        employeeCode,
      })
      .getOne();
  }

  async save(employee: Employee): Promise<Employee> {
    return this.dataSource.getRepository(employeeEntity).save(employee);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(employeeEntity).delete({ id });
  }
}

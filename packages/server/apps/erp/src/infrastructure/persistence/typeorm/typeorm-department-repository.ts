import { DataSource } from 'typeorm';

import type { DepartmentRepository } from '../../../domain/hr/repositories.ts';
import type { Department } from '../../../domain/hr/types.ts';
import { departmentEntity } from './entities.ts';

export class TypeOrmDepartmentRepository implements DepartmentRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<Department[]> {
    return this.dataSource.getRepository(departmentEntity).find();
  }

  async findById(id: string): Promise<Department | null> {
    return this.dataSource.getRepository(departmentEntity).findOneBy({ id });
  }

  async findByCode(departmentCode: string): Promise<Department | null> {
    return this.dataSource
      .getRepository(departmentEntity)
      .createQueryBuilder('department')
      .where('UPPER(department.departmentCode) = UPPER(:departmentCode)', {
        departmentCode,
      })
      .getOne();
  }

  async save(department: Department): Promise<Department> {
    return this.dataSource.getRepository(departmentEntity).save(department);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(departmentEntity).delete({ id });
  }
}

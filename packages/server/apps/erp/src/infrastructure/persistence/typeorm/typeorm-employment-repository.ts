import { DataSource } from 'typeorm';

import type { EmploymentRepository } from '../../../domain/hr/repositories.ts';
import type { Employment } from '../../../domain/hr/types.ts';
import { employmentEntity } from './entities.ts';

export class TypeOrmEmploymentRepository implements EmploymentRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<Employment[]> {
    return this.dataSource.getRepository(employmentEntity).find();
  }

  async findById(id: string): Promise<Employment | null> {
    return this.dataSource.getRepository(employmentEntity).findOneBy({ id });
  }

  async save(employment: Employment): Promise<Employment> {
    return this.dataSource.getRepository(employmentEntity).save(employment);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(employmentEntity).delete({ id });
  }
}

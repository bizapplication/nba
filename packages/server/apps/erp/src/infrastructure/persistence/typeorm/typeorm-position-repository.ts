import { DataSource } from 'typeorm';

import type { PositionRepository } from '../../../domain/hr/repositories.ts';
import type { Position } from '../../../domain/hr/types.ts';
import { positionEntity } from './entities.ts';

export class TypeOrmPositionRepository implements PositionRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<Position[]> {
    return this.dataSource.getRepository(positionEntity).find();
  }

  async findById(id: string): Promise<Position | null> {
    return this.dataSource.getRepository(positionEntity).findOneBy({ id });
  }

  async findByCode(positionCode: string): Promise<Position | null> {
    return this.dataSource
      .getRepository(positionEntity)
      .createQueryBuilder('position')
      .where('UPPER(position.positionCode) = UPPER(:positionCode)', {
        positionCode,
      })
      .getOne();
  }

  async save(position: Position): Promise<Position> {
    return this.dataSource.getRepository(positionEntity).save(position);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(positionEntity).delete({ id });
  }
}

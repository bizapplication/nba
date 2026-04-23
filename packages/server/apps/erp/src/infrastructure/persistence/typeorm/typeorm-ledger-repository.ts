import { DataSource } from 'typeorm';

import type { LedgerRepository } from '../../../domain/fin/repositories.ts';
import type { LedgerBook } from '../../../domain/fin/types.ts';
import { ledgerBookEntity } from './entities.ts';

export class TypeOrmLedgerRepository implements LedgerRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<LedgerBook[]> {
    return this.dataSource.getRepository(ledgerBookEntity).find();
  }

  async findById(id: string): Promise<LedgerBook | null> {
    return this.dataSource.getRepository(ledgerBookEntity).findOneBy({ id });
  }

  async findByCode(code: string): Promise<LedgerBook | null> {
    return this.dataSource
      .getRepository(ledgerBookEntity)
      .createQueryBuilder('ledger')
      .where('UPPER(ledger.code) = UPPER(:code)', { code })
      .getOne();
  }

  async save(ledger: LedgerBook): Promise<LedgerBook> {
    return this.dataSource.getRepository(ledgerBookEntity).save(ledger);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(ledgerBookEntity).delete({ id });
  }
}

import { DataSource } from 'typeorm';

import type { AccountRepository } from '../../../domain/fin/repositories.ts';
import type { FinancialAccount } from '../../../domain/fin/types.ts';
import { financialAccountEntity } from './entities.ts';

export class TypeOrmAccountRepository implements AccountRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<FinancialAccount[]> {
    return this.dataSource.getRepository(financialAccountEntity).find();
  }

  async findById(id: string): Promise<FinancialAccount | null> {
    return this.dataSource.getRepository(financialAccountEntity).findOneBy({ id });
  }

  async findByCode(code: string): Promise<FinancialAccount | null> {
    return this.dataSource
      .getRepository(financialAccountEntity)
      .createQueryBuilder('account')
      .where('UPPER(account.accountCode) = UPPER(:code)', { code })
      .getOne();
  }

  async save(account: FinancialAccount): Promise<FinancialAccount> {
    return this.dataSource.getRepository(financialAccountEntity).save(account);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(financialAccountEntity).delete({ id });
  }
}

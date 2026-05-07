import { DataSource } from 'typeorm';

import type {
  BankRepository,
} from '../../../domain/fin/repositories.ts';
import type { FinancialInstitution } from '../../../domain/fin/types.ts';
import { financialInstitutionEntity } from './entities.ts';

export class TypeOrmBankRepository implements BankRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<FinancialInstitution[]> {
    return this.dataSource.getRepository(financialInstitutionEntity).find();
  }

  async findById(id: string): Promise<FinancialInstitution | null> {
    return this.dataSource.getRepository(financialInstitutionEntity).findOneBy({ id });
  }

  async findByExternalBankCode(
    bankCode: string,
  ): Promise<FinancialInstitution | null> {
    return this.dataSource
      .getRepository(financialInstitutionEntity)
      .createQueryBuilder('bank')
      .where('UPPER(bank.externalBankCode) = UPPER(:bankCode)', { bankCode })
      .getOne();
  }

  async save(bank: FinancialInstitution): Promise<FinancialInstitution> {
    return this.dataSource.getRepository(financialInstitutionEntity).save(bank);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(financialInstitutionEntity).delete({ id });
  }
}

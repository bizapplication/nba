import { DataSource } from 'typeorm';

import type { CustomerBankAccountRepository } from '../../../domain/crm/repositories.ts';
import type { CustomerBankAccount } from '../../../domain/crm/types.ts';
import { customerBankAccountEntity } from './entities.ts';

export class TypeOrmCustomerBankAccountRepository
implements CustomerBankAccountRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<CustomerBankAccount[]> {
    return this.dataSource.getRepository(customerBankAccountEntity).find();
  }

  async findById(id: string): Promise<CustomerBankAccount | null> {
    return this.dataSource.getRepository(customerBankAccountEntity).findOneBy({ id });
  }

  async save(bankAccount: CustomerBankAccount): Promise<CustomerBankAccount> {
    return this.dataSource.getRepository(customerBankAccountEntity).save(bankAccount);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(customerBankAccountEntity).delete({ id });
  }
}

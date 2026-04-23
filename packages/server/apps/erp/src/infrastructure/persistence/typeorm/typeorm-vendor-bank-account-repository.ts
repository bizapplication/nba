import { DataSource } from 'typeorm';

import type { VendorBankAccountRepository } from '../../../domain/procurement/repositories.ts';
import type { VendorBankAccount } from '../../../domain/procurement/types.ts';
import { vendorBankAccountEntity } from './entities.ts';

export class TypeOrmVendorBankAccountRepository
implements VendorBankAccountRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<VendorBankAccount[]> {
    return this.dataSource.getRepository(vendorBankAccountEntity).find();
  }

  async findById(id: string): Promise<VendorBankAccount | null> {
    return this.dataSource.getRepository(vendorBankAccountEntity).findOneBy({ id });
  }

  async save(bankAccount: VendorBankAccount): Promise<VendorBankAccount> {
    return this.dataSource.getRepository(vendorBankAccountEntity).save(bankAccount);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(vendorBankAccountEntity).delete({ id });
  }
}

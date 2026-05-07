import { DataSource } from 'typeorm';

import type { VendorRepository } from '../../../domain/procurement/repositories.ts';
import type { Vendor } from '../../../domain/procurement/types.ts';
import { vendorEntity } from './entities.ts';

export class TypeOrmVendorRepository implements VendorRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<Vendor[]> {
    return this.dataSource.getRepository(vendorEntity).find();
  }

  async findById(id: string): Promise<Vendor | null> {
    return this.dataSource.getRepository(vendorEntity).findOneBy({ id });
  }

  async findByCode(vendorCode: string): Promise<Vendor | null> {
    return this.dataSource
      .getRepository(vendorEntity)
      .createQueryBuilder('vendor')
      .where('UPPER(vendor.vendorCode) = UPPER(:vendorCode)', { vendorCode })
      .getOne();
  }

  async save(vendor: Vendor): Promise<Vendor> {
    return this.dataSource.getRepository(vendorEntity).save(vendor);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(vendorEntity).delete({ id });
  }
}

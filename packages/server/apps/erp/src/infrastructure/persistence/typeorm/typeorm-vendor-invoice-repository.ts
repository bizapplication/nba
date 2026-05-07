import { DataSource } from 'typeorm';

import type { VendorInvoiceRepository } from '../../../domain/procurement/repositories.ts';
import type { VendorInvoice } from '../../../domain/procurement/types.ts';
import { vendorInvoiceEntity } from './entities.ts';

export class TypeOrmVendorInvoiceRepository implements VendorInvoiceRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<VendorInvoice[]> {
    return this.dataSource.getRepository(vendorInvoiceEntity).find();
  }

  async findById(id: string): Promise<VendorInvoice | null> {
    return this.dataSource.getRepository(vendorInvoiceEntity).findOneBy({ id });
  }

  async findByInvoiceNo(vendorInvoiceNo: string): Promise<VendorInvoice | null> {
    return this.dataSource
      .getRepository(vendorInvoiceEntity)
      .createQueryBuilder('vendorInvoice')
      .where('UPPER(vendorInvoice.vendorInvoiceNo) = UPPER(:vendorInvoiceNo)', {
        vendorInvoiceNo,
      })
      .getOne();
  }

  async save(vendorInvoice: VendorInvoice): Promise<VendorInvoice> {
    return this.dataSource.getRepository(vendorInvoiceEntity).save(vendorInvoice);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(vendorInvoiceEntity).delete({ id });
  }
}

import { DataSource } from 'typeorm';

import type { PurchaseOrderRepository } from '../../../domain/procurement/repositories.ts';
import type { PurchaseOrder } from '../../../domain/procurement/types.ts';
import { purchaseOrderEntity } from './entities.ts';

export class TypeOrmPurchaseOrderRepository implements PurchaseOrderRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<PurchaseOrder[]> {
    return this.dataSource.getRepository(purchaseOrderEntity).find();
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.dataSource.getRepository(purchaseOrderEntity).findOneBy({ id });
  }

  async findByOrderNo(purchaseOrderNo: string): Promise<PurchaseOrder | null> {
    return this.dataSource
      .getRepository(purchaseOrderEntity)
      .createQueryBuilder('purchaseOrder')
      .where('UPPER(purchaseOrder.purchaseOrderNo) = UPPER(:purchaseOrderNo)', {
        purchaseOrderNo,
      })
      .getOne();
  }

  async save(purchaseOrder: PurchaseOrder): Promise<PurchaseOrder> {
    return this.dataSource.getRepository(purchaseOrderEntity).save(purchaseOrder);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(purchaseOrderEntity).delete({ id });
  }
}

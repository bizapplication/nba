import { DataSource } from 'typeorm';

import type { ReceiptOrderRepository } from '../../../domain/crm/repositories.ts';
import type { ReceiptOrder } from '../../../domain/crm/types.ts';
import { receiptOrderEntity } from './entities.ts';

export class TypeOrmReceiptOrderRepository implements ReceiptOrderRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<ReceiptOrder[]> {
    return this.dataSource.getRepository(receiptOrderEntity).find();
  }

  async findById(id: string): Promise<ReceiptOrder | null> {
    return this.dataSource.getRepository(receiptOrderEntity).findOneBy({ id });
  }

  async findByOrderNo(receiptOrderNo: string): Promise<ReceiptOrder | null> {
    return this.dataSource
      .getRepository(receiptOrderEntity)
      .createQueryBuilder('receipt')
      .where('UPPER(receipt.receiptOrderNo) = UPPER(:receiptOrderNo)', {
        receiptOrderNo,
      })
      .getOne();
  }

  async save(receiptOrder: ReceiptOrder): Promise<ReceiptOrder> {
    return this.dataSource.getRepository(receiptOrderEntity).save(receiptOrder);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(receiptOrderEntity).delete({ id });
  }
}

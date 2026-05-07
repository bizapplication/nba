import { DataSource } from 'typeorm';

import type { GoodsReceiptRepository } from '../../../domain/procurement/repositories.ts';
import type { GoodsReceipt } from '../../../domain/procurement/types.ts';
import { goodsReceiptEntity } from './entities.ts';

export class TypeOrmGoodsReceiptRepository implements GoodsReceiptRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<GoodsReceipt[]> {
    return this.dataSource.getRepository(goodsReceiptEntity).find();
  }

  async findById(id: string): Promise<GoodsReceipt | null> {
    return this.dataSource.getRepository(goodsReceiptEntity).findOneBy({ id });
  }

  async findByReceiptNo(goodsReceiptNo: string): Promise<GoodsReceipt | null> {
    return this.dataSource
      .getRepository(goodsReceiptEntity)
      .createQueryBuilder('goodsReceipt')
      .where('UPPER(goodsReceipt.goodsReceiptNo) = UPPER(:goodsReceiptNo)', {
        goodsReceiptNo,
      })
      .getOne();
  }

  async save(goodsReceipt: GoodsReceipt): Promise<GoodsReceipt> {
    return this.dataSource.getRepository(goodsReceiptEntity).save(goodsReceipt);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(goodsReceiptEntity).delete({ id });
  }
}

import { DataSource } from 'typeorm';

import type { PaymentOrderRepository } from '../../../domain/procurement/repositories.ts';
import type { PaymentOrder } from '../../../domain/procurement/types.ts';
import { paymentOrderEntity } from './entities.ts';

export class TypeOrmPaymentOrderRepository implements PaymentOrderRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<PaymentOrder[]> {
    return this.dataSource.getRepository(paymentOrderEntity).find();
  }

  async findById(id: string): Promise<PaymentOrder | null> {
    return this.dataSource.getRepository(paymentOrderEntity).findOneBy({ id });
  }

  async findByOrderNo(paymentOrderNo: string): Promise<PaymentOrder | null> {
    return this.dataSource
      .getRepository(paymentOrderEntity)
      .createQueryBuilder('payment')
      .where('UPPER(payment.paymentOrderNo) = UPPER(:paymentOrderNo)', {
        paymentOrderNo,
      })
      .getOne();
  }

  async save(paymentOrder: PaymentOrder): Promise<PaymentOrder> {
    return this.dataSource.getRepository(paymentOrderEntity).save(paymentOrder);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(paymentOrderEntity).delete({ id });
  }
}

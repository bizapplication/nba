import { DataSource } from 'typeorm';

import type { CustomerRepository } from '../../../domain/crm/repositories.ts';
import type { Customer } from '../../../domain/crm/types.ts';
import { customerEntity } from './entities.ts';

export class TypeOrmCustomerRepository implements CustomerRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<Customer[]> {
    return this.dataSource.getRepository(customerEntity).find();
  }

  async findById(id: string): Promise<Customer | null> {
    return this.dataSource.getRepository(customerEntity).findOneBy({ id });
  }

  async findByCode(customerCode: string): Promise<Customer | null> {
    return this.dataSource
      .getRepository(customerEntity)
      .createQueryBuilder('customer')
      .where('UPPER(customer.customerCode) = UPPER(:customerCode)', {
        customerCode,
      })
      .getOne();
  }

  async save(customer: Customer): Promise<Customer> {
    return this.dataSource.getRepository(customerEntity).save(customer);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(customerEntity).delete({ id });
  }
}

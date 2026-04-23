import { DataSource } from 'typeorm';

import type { ProductRepository } from '../../../domain/procurement/repositories.ts';
import type { Product } from '../../../domain/procurement/types.ts';
import { productEntity } from './entities.ts';

export class TypeOrmProductRepository implements ProductRepository {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async listAll(): Promise<Product[]> {
    return this.dataSource.getRepository(productEntity).find();
  }

  async findById(id: string): Promise<Product | null> {
    return this.dataSource.getRepository(productEntity).findOneBy({ id });
  }

  async findByCode(productCode: string): Promise<Product | null> {
    return this.dataSource
      .getRepository(productEntity)
      .createQueryBuilder('product')
      .where('UPPER(product.productCode) = UPPER(:productCode)', { productCode })
      .getOne();
  }

  async save(product: Product): Promise<Product> {
    return this.dataSource.getRepository(productEntity).save(product);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.getRepository(productEntity).delete({ id });
  }
}

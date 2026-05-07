import { Repository } from 'typeorm';
import type { OrderCondition } from '../../../../domain/orders/OrderCondition';
import type { OrderProps } from '../../../../domain/orders/Order';
import type { OrderQueryOptions, OrderRepository } from '../../../../domain/orders/OrderRepository';
import { OrderORM } from '../entities/OrderORM';

function toDomain(entity: OrderORM): OrderProps {
  return {
    id: entity.id,
    orderNo: entity.orderNo,
    customerId: entity.customerId,
    customerName: entity.customer?.name ?? null,
    name: entity.name,
    description: entity.description,
    amount: Number(entity.amount),
    status: entity.status,
    isdelete: entity.isdelete,
    createdAt: new Date(entity.createdAt),
    updatedAt: new Date(entity.updatedAt),
  };
}

function normalizeOrder(direction: string): 'ASC' | 'DESC' {
  return direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

export class TypeORMOrderRepository implements OrderRepository {
  constructor(private readonly repository: Repository<OrderORM>) {}

  async findAll(
    condition: OrderCondition,
    options: OrderQueryOptions,
  ): Promise<{ data: OrderProps[]; total: number }> {
    const qb = this.repository.createQueryBuilder('order');

    qb.leftJoinAndSelect('order.customer', 'customer', 'customer.isdelete = false');
    qb.where('order.isdelete = :isdelete', { isdelete: condition.isdelete ?? false });

    if (condition.id) qb.andWhere('order.id = :id', { id: condition.id });
    if (condition.ids?.length) qb.andWhere('order.id IN (:...ids)', { ids: condition.ids });
    if (condition.orderNo) qb.andWhere('order.orderNo ILIKE :orderNo', { orderNo: `%${condition.orderNo}%` });
    if (condition.customerId) qb.andWhere('order.customerId = :customerId', { customerId: condition.customerId });
    if (condition.name) qb.andWhere('order.name ILIKE :namePattern', { namePattern: `%${condition.name}%` });
    if (condition.status) qb.andWhere('order.status = :status', { status: condition.status });

    if (condition.keyword) {
      qb.andWhere(
        '(order.orderNo ILIKE :kw OR order.name ILIKE :kw OR order.description ILIKE :kw)',
        { kw: `%${condition.keyword}%` },
      );
    }

    const total = await qb.getCount();

    if (options.order) {
      for (const [field, direction] of Object.entries(options.order)) {
        qb.addOrderBy(`order.${field}`, normalizeOrder(direction));
      }
    }

    qb.skip(options.skip).take(options.take);

    const rows = await qb.getMany();
    return {
      data: rows.map(toDomain),
      total,
    };
  }

  async findById(id: string): Promise<OrderProps | null> {
    const row = await this.repository.findOne({ where: { id }, relations: { customer: true } });
    return row ? toDomain(row) : null;
  }

  async create(input: Omit<OrderProps, 'id' | 'createdAt' | 'updatedAt' | 'isdelete' | 'customerName'>): Promise<OrderProps> {
    const entity = this.repository.create({
      orderNo: input.orderNo,
      customerId: input.customerId,
      name: input.name,
      description: input.description,
      amount: input.amount,
      status: input.status,
      isdelete: false,
    });

    const saved = await this.repository.save(entity);
    const created = await this.repository.findOneOrFail({ where: { id: saved.id }, relations: { customer: true } });
    return toDomain(created);
  }

  async updateById(
    id: string,
    input: Partial<Pick<OrderProps, 'orderNo' | 'customerId' | 'name' | 'description' | 'amount' | 'status'>>,
  ): Promise<OrderProps | null> {
    await this.repository
      .createQueryBuilder()
      .update(OrderORM)
      .set({ ...input })
      .where('id = :id', { id })
      .andWhere('isdelete = :isdelete', { isdelete: false })
      .execute();

    const updated = await this.repository.findOne({ where: { id, isdelete: false }, relations: { customer: true } });
    return updated ? toDomain(updated) : null;
  }

  async softDeleteById(id: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(OrderORM)
      .set({ isdelete: true })
      .where('id = :id', { id })
      .andWhere('isdelete = :isdelete', { isdelete: false })
      .execute();

    return result.affected ?? 0;
  }

  async softDeleteByIds(ids: string[]): Promise<number> {
    if (!ids.length) return 0;

    const result = await this.repository
      .createQueryBuilder()
      .update(OrderORM)
      .set({ isdelete: true })
      .where('id IN (:...ids)', { ids })
      .andWhere('isdelete = :isdelete', { isdelete: false })
      .execute();

    return result.affected ?? 0;
  }
}

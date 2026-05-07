import { Repository } from 'typeorm';
import type { OpportunityCondition } from '../../../../domain/opportunities/OpportunityCondition';
import type { OpportunityProps } from '../../../../domain/opportunities/Opportunity';
import type {
  OpportunityQueryOptions,
  OpportunityRepository,
} from '../../../../domain/opportunities/OpportunityRepository';
import { OpportunityORM } from '../entities/OpportunityORM';

function toDomain(entity: OpportunityORM): OpportunityProps {
  return {
    id: entity.id,
    customerId: entity.customerId,
    customerName: entity.customer?.name ?? null,
    title: entity.title,
    description: entity.description,
    amount: Number(entity.amount),
    stage: entity.stage,
    expectedCloseDate: entity.expectedCloseDate ? new Date(entity.expectedCloseDate) : null,
    isdelete: entity.isdelete,
    createdAt: new Date(entity.createdAt),
    updatedAt: new Date(entity.updatedAt),
  };
}

function normalizeOrder(direction: string): 'ASC' | 'DESC' {
  return direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}

export class TypeORMOpportunityRepository implements OpportunityRepository {
  constructor(private readonly repository: Repository<OpportunityORM>) {}

  async findAll(
    condition: OpportunityCondition,
    options: OpportunityQueryOptions,
  ): Promise<{ data: OpportunityProps[]; total: number }> {
    const qb = this.repository.createQueryBuilder('opportunity');

    qb.leftJoinAndSelect('opportunity.customer', 'customer', 'customer.isdelete = false');
    qb.where('opportunity.isdelete = :isdelete', { isdelete: condition.isdelete ?? false });

    if (condition.id) qb.andWhere('opportunity.id = :id', { id: condition.id });
    if (condition.ids?.length) qb.andWhere('opportunity.id IN (:...ids)', { ids: condition.ids });
    if (condition.customerId) qb.andWhere('opportunity.customerId = :customerId', { customerId: condition.customerId });
    if (condition.title) qb.andWhere('opportunity.title ILIKE :titlePattern', { titlePattern: `%${condition.title}%` });
    if (condition.stage) qb.andWhere('opportunity.stage = :stage', { stage: condition.stage });

    if (condition.keyword) {
      qb.andWhere(
        '(opportunity.title ILIKE :kw OR opportunity.description ILIKE :kw)',
        { kw: `%${condition.keyword}%` },
      );
    }

    const total = await qb.getCount();

    if (options.order) {
      for (const [field, direction] of Object.entries(options.order)) {
        qb.addOrderBy(`opportunity.${field}`, normalizeOrder(direction));
      }
    }

    qb.skip(options.skip).take(options.take);

    const rows = await qb.getMany();
    return {
      data: rows.map(toDomain),
      total,
    };
  }

  async findById(id: string): Promise<OpportunityProps | null> {
    const row = await this.repository.findOne({ where: { id }, relations: { customer: true } });
    return row ? toDomain(row) : null;
  }

  async create(
    input: Omit<OpportunityProps, 'id' | 'createdAt' | 'updatedAt' | 'isdelete' | 'customerName'>,
  ): Promise<OpportunityProps> {
    const entity = this.repository.create({
      customerId: input.customerId,
      title: input.title,
      description: input.description,
      amount: input.amount,
      stage: input.stage,
      expectedCloseDate: input.expectedCloseDate,
      isdelete: false,
    });

    const saved = await this.repository.save(entity);
    const created = await this.repository.findOneOrFail({ where: { id: saved.id }, relations: { customer: true } });
    return toDomain(created);
  }

  async updateById(
    id: string,
    input: Partial<
      Pick<OpportunityProps, 'customerId' | 'title' | 'description' | 'amount' | 'stage' | 'expectedCloseDate'>
    >,
  ): Promise<OpportunityProps | null> {
    await this.repository
      .createQueryBuilder()
      .update(OpportunityORM)
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
      .update(OpportunityORM)
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
      .update(OpportunityORM)
      .set({ isdelete: true })
      .where('id IN (:...ids)', { ids })
      .andWhere('isdelete = :isdelete', { isdelete: false })
      .execute();

    return result.affected ?? 0;
  }
}

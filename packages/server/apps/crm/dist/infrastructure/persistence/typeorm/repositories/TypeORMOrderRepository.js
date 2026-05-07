"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeORMOrderRepository = void 0;
const OrderORM_1 = require("../entities/OrderORM");
function toDomain(entity) {
    return {
        id: entity.id,
        orderNo: entity.orderNo,
        customerId: entity.customerId,
        name: entity.name,
        description: entity.description,
        amount: Number(entity.amount),
        status: entity.status,
        isdelete: entity.isdelete,
        createdAt: new Date(entity.createdAt),
        updatedAt: new Date(entity.updatedAt),
    };
}
function normalizeOrder(direction) {
    return direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}
class TypeORMOrderRepository {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async findAll(condition, options) {
        const qb = this.repository.createQueryBuilder('order');
        qb.where('order.isdelete = :isdelete', { isdelete: condition.isdelete ?? false });
        if (condition.id)
            qb.andWhere('order.id = :id', { id: condition.id });
        if (condition.ids?.length)
            qb.andWhere('order.id IN (:...ids)', { ids: condition.ids });
        if (condition.orderNo)
            qb.andWhere('order.orderNo ILIKE :orderNo', { orderNo: `%${condition.orderNo}%` });
        if (condition.customerId)
            qb.andWhere('order.customerId = :customerId', { customerId: condition.customerId });
        if (condition.name)
            qb.andWhere('order.name ILIKE :namePattern', { namePattern: `%${condition.name}%` });
        if (condition.status)
            qb.andWhere('order.status = :status', { status: condition.status });
        if (condition.keyword) {
            qb.andWhere('(order.orderNo ILIKE :kw OR order.name ILIKE :kw OR order.description ILIKE :kw)', { kw: `%${condition.keyword}%` });
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
    async findById(id) {
        const row = await this.repository.findOne({ where: { id } });
        return row ? toDomain(row) : null;
    }
    async create(input) {
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
        return toDomain(saved);
    }
    async updateById(id, input) {
        await this.repository
            .createQueryBuilder()
            .update(OrderORM_1.OrderORM)
            .set({ ...input })
            .where('id = :id', { id })
            .andWhere('isdelete = :isdelete', { isdelete: false })
            .execute();
        const updated = await this.repository.findOne({ where: { id, isdelete: false } });
        return updated ? toDomain(updated) : null;
    }
    async softDeleteById(id) {
        const result = await this.repository
            .createQueryBuilder()
            .update(OrderORM_1.OrderORM)
            .set({ isdelete: true })
            .where('id = :id', { id })
            .andWhere('isdelete = :isdelete', { isdelete: false })
            .execute();
        return result.affected ?? 0;
    }
    async softDeleteByIds(ids) {
        if (!ids.length)
            return 0;
        const result = await this.repository
            .createQueryBuilder()
            .update(OrderORM_1.OrderORM)
            .set({ isdelete: true })
            .where('id IN (:...ids)', { ids })
            .andWhere('isdelete = :isdelete', { isdelete: false })
            .execute();
        return result.affected ?? 0;
    }
}
exports.TypeORMOrderRepository = TypeORMOrderRepository;

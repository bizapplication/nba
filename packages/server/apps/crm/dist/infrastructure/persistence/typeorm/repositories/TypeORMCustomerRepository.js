"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeORMCustomerRepository = void 0;
const CustomerORM_1 = require("../entities/CustomerORM");
function toDomain(entity) {
    return {
        id: entity.id,
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        company: entity.company,
        isdelete: entity.isdelete,
        createdAt: new Date(entity.createdAt),
        updatedAt: new Date(entity.updatedAt),
    };
}
function normalizeOrder(direction) {
    return direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
}
class TypeORMCustomerRepository {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async findAll(condition, options) {
        const qb = this.repository.createQueryBuilder('customer');
        qb.where('customer.isdelete = :isdelete', { isdelete: condition.isdelete ?? false });
        if (condition.id)
            qb.andWhere('customer.id = :id', { id: condition.id });
        if (condition.ids?.length)
            qb.andWhere('customer.id IN (:...ids)', { ids: condition.ids });
        if (condition.email) {
            qb.andWhere('customer.email ILIKE :emailPattern', {
                emailPattern: `%${condition.email}%`,
            });
        }
        if (condition.name) {
            qb.andWhere('customer.name ILIKE :namePattern', {
                namePattern: `%${condition.name}%`,
            });
        }
        if (condition.phone) {
            qb.andWhere('customer.phone ILIKE :phonePattern', {
                phonePattern: `%${condition.phone}%`,
            });
        }
        if (condition.company) {
            qb.andWhere('customer.company ILIKE :companyPattern', {
                companyPattern: `%${condition.company}%`,
            });
        }
        if (condition.keyword) {
            qb.andWhere('(customer.name ILIKE :kw OR customer.email ILIKE :kw OR customer.phone ILIKE :kw OR customer.company ILIKE :kw)', { kw: `%${condition.keyword}%` });
        }
        const total = await qb.getCount();
        if (options.order) {
            for (const [field, direction] of Object.entries(options.order)) {
                qb.addOrderBy(`customer.${field}`, normalizeOrder(direction));
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
            name: input.name,
            email: input.email,
            phone: input.phone,
            company: input.company,
            isdelete: false,
        });
        const saved = await this.repository.save(entity);
        return toDomain(saved);
    }
    async updateById(id, input) {
        await this.repository
            .createQueryBuilder()
            .update(CustomerORM_1.CustomerORM)
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
            .update(CustomerORM_1.CustomerORM)
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
            .update(CustomerORM_1.CustomerORM)
            .set({ isdelete: true })
            .where('id IN (:...ids)', { ids })
            .andWhere('isdelete = :isdelete', { isdelete: false })
            .execute();
        return result.affected ?? 0;
    }
}
exports.TypeORMCustomerRepository = TypeORMCustomerRepository;

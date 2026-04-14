"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../../shared/http/pagination");
const CreateCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(1),
    company: zod_1.z.string().min(1),
});
const UpdateCustomerSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(1).optional(),
    company: zod_1.z.string().min(1).optional(),
})
    .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required',
});
const BatchDeleteSchema = zod_1.z.object({
    condition: zod_1.z.object({
        ids: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    }),
});
function toQueryString(value) {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
        const trimmed = value[0].trim();
        return trimmed.length ? trimmed : undefined;
    }
    return undefined;
}
class CustomerController {
    customerService;
    constructor(customerService) {
        this.customerService = customerService;
    }
    async getAll(req, res) {
        try {
            const condition = this.parseCustomerCondition(req.query);
            const pageOpt = pagination_1.Pagination.parse(req.query, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                allowedSortBy: ['createdAt', 'updatedAt', 'name', 'email'],
                defaultSortBy: 'createdAt',
                defaultSortOrder: 'desc',
            });
            const order = pageOpt.sortBy ? { [pageOpt.sortBy]: pageOpt.sortOrder } : undefined;
            const result = await this.customerService.getAllCustomers(condition, {
                skip: pageOpt.skip,
                take: pageOpt.take,
                order,
            });
            const meta = pagination_1.Pagination.meta(result.total, pageOpt.page, pageOpt.pageSize);
            return res.status(200).json({
                data: result.data,
                meta,
                sort: pageOpt.sortBy ? { sortBy: pageOpt.sortBy, sortOrder: pageOpt.sortOrder } : undefined,
            });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    create = async (req, res) => {
        try {
            const dto = CreateCustomerSchema.parse(req.body);
            const created = await this.customerService.createCustomer(dto);
            return res.status(201).json(created);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    updateById = async (req, res) => {
        try {
            const dto = UpdateCustomerSchema.parse(req.body);
            const updated = await this.customerService.updateCustomer(req.params.id, dto);
            if (!updated) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            return res.status(200).json(updated);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    softDeleteById = async (req, res) => {
        try {
            const affected = await this.customerService.softDeleteCustomer(req.params.id);
            if (!affected)
                return res.status(404).json({ message: 'Customer not found' });
            return res.status(200).json({ affected });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    softDeleteByCondition = async (req, res) => {
        try {
            const body = BatchDeleteSchema.parse(req.body);
            const affected = await this.customerService.softDeleteCustomersByCondition(body.condition);
            return res.status(200).json({ affected });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    parseCustomerCondition(query) {
        const email = toQueryString(query.email);
        const name = toQueryString(query.name);
        const phone = toQueryString(query.phone);
        const company = toQueryString(query.company);
        const keyword = toQueryString(query.keyword);
        return {
            email,
            name,
            phone,
            company,
            keyword,
            isdelete: false,
        };
    }
}
exports.CustomerController = CustomerController;

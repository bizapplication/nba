"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../../shared/http/pagination");
const CreateOrderSchema = zod_1.z.object({
    orderNo: zod_1.z.string().min(1),
    customerId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    amount: zod_1.z.number().nonnegative(),
    status: zod_1.z.enum(['draft', 'confirmed', 'completed', 'cancelled']).default('draft'),
});
const UpdateOrderSchema = zod_1.z
    .object({
    orderNo: zod_1.z.string().min(1).optional(),
    customerId: zod_1.z.string().min(1).optional(),
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    amount: zod_1.z.number().nonnegative().optional(),
    status: zod_1.z.enum(['draft', 'confirmed', 'completed', 'cancelled']).optional(),
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
class OrderController {
    orderService;
    constructor(orderService) {
        this.orderService = orderService;
    }
    async getAll(req, res) {
        try {
            const condition = this.parseOrderCondition(req.query);
            const pageOpt = pagination_1.Pagination.parse(req.query, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                allowedSortBy: ['createdAt', 'updatedAt', 'orderNo', 'name', 'amount', 'status'],
                defaultSortBy: 'createdAt',
                defaultSortOrder: 'desc',
            });
            const order = pageOpt.sortBy ? { [pageOpt.sortBy]: pageOpt.sortOrder } : undefined;
            const result = await this.orderService.getAllOrders(condition, {
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
            const parsed = CreateOrderSchema.safeParse({
                ...req.body,
                amount: req.body?.amount === undefined ? undefined : Number(req.body.amount),
            });
            if (!parsed.success)
                return res.status(400).json({ message: parsed.error.message });
            const created = await this.orderService.createOrder(parsed.data);
            return res.status(201).json(created);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    updateById = async (req, res) => {
        try {
            const parsed = UpdateOrderSchema.safeParse({
                ...req.body,
                amount: req.body?.amount === undefined ? undefined : Number(req.body.amount),
            });
            if (!parsed.success)
                return res.status(400).json({ message: parsed.error.message });
            const updated = await this.orderService.updateOrder(req.params.id, parsed.data);
            if (!updated)
                return res.status(404).json({ message: 'Order not found' });
            return res.status(200).json(updated);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    softDeleteById = async (req, res) => {
        try {
            const affected = await this.orderService.softDeleteOrder(req.params.id);
            if (!affected)
                return res.status(404).json({ message: 'Order not found' });
            return res.status(200).json({ affected });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    softDeleteByCondition = async (req, res) => {
        try {
            const body = BatchDeleteSchema.parse(req.body);
            const affected = await this.orderService.softDeleteOrdersByCondition(body.condition);
            return res.status(200).json({ affected });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    parseOrderCondition(query) {
        const keyword = toQueryString(query.keyword);
        const statusRaw = toQueryString(query.status);
        const status = ['draft', 'confirmed', 'completed', 'cancelled'].includes(statusRaw || '')
            ? statusRaw
            : undefined;
        return {
            keyword,
            status,
            isdelete: false,
        };
    }
}
exports.OrderController = OrderController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityController = void 0;
const zod_1 = require("zod");
const pagination_1 = require("../../../shared/http/pagination");
const CreateOpportunitySchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    amount: zod_1.z.number().nonnegative(),
    stage: zod_1.z.enum(['new', 'qualified', 'proposal', 'won', 'lost']).default('new'),
    expectedCloseDate: zod_1.z.string().min(1).nullable().optional(),
});
const UpdateOpportunitySchema = zod_1.z
    .object({
    customerId: zod_1.z.string().min(1).optional(),
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).optional(),
    amount: zod_1.z.number().nonnegative().optional(),
    stage: zod_1.z.enum(['new', 'qualified', 'proposal', 'won', 'lost']).optional(),
    expectedCloseDate: zod_1.z.string().min(1).nullable().optional(),
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
function parseDateOrNull(value) {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    if (value.trim() === '')
        return null;
    return new Date(value);
}
class OpportunityController {
    opportunityService;
    constructor(opportunityService) {
        this.opportunityService = opportunityService;
    }
    async getAll(req, res) {
        try {
            const condition = this.parseOpportunityCondition(req.query);
            const pageOpt = pagination_1.Pagination.parse(req.query, {
                defaultPage: 1,
                defaultPageSize: 10,
                maxPageSize: 100,
                allowedSortBy: ['createdAt', 'updatedAt', 'title', 'amount', 'stage', 'expectedCloseDate'],
                defaultSortBy: 'createdAt',
                defaultSortOrder: 'desc',
            });
            const order = pageOpt.sortBy ? { [pageOpt.sortBy]: pageOpt.sortOrder } : undefined;
            const result = await this.opportunityService.getAllOpportunities(condition, {
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
            const parsed = CreateOpportunitySchema.safeParse({
                ...req.body,
                amount: req.body?.amount === undefined ? undefined : Number(req.body.amount),
            });
            if (!parsed.success)
                return res.status(400).json({ message: parsed.error.message });
            const created = await this.opportunityService.createOpportunity({
                ...parsed.data,
                expectedCloseDate: parseDateOrNull(parsed.data.expectedCloseDate ?? undefined) ?? null,
            });
            return res.status(201).json(created);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    updateById = async (req, res) => {
        try {
            const parsed = UpdateOpportunitySchema.safeParse({
                ...req.body,
                amount: req.body?.amount === undefined ? undefined : Number(req.body.amount),
            });
            if (!parsed.success)
                return res.status(400).json({ message: parsed.error.message });
            const payload = {
                ...parsed.data,
                expectedCloseDate: parseDateOrNull(parsed.data.expectedCloseDate),
            };
            const updated = await this.opportunityService.updateOpportunity(req.params.id, payload);
            if (!updated)
                return res.status(404).json({ message: 'Opportunity not found' });
            return res.status(200).json(updated);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    softDeleteById = async (req, res) => {
        try {
            const affected = await this.opportunityService.softDeleteOpportunity(req.params.id);
            if (!affected)
                return res.status(404).json({ message: 'Opportunity not found' });
            return res.status(200).json({ affected });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    softDeleteByCondition = async (req, res) => {
        try {
            const body = BatchDeleteSchema.parse(req.body);
            const affected = await this.opportunityService.softDeleteOpportunitiesByCondition(body.condition);
            return res.status(200).json({ affected });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    };
    parseOpportunityCondition(query) {
        const keyword = toQueryString(query.keyword);
        const stageRaw = toQueryString(query.stage);
        const stage = ['new', 'qualified', 'proposal', 'won', 'lost'].includes(stageRaw || '')
            ? stageRaw
            : undefined;
        return {
            keyword,
            stage,
            isdelete: false,
        };
    }
}
exports.OpportunityController = OpportunityController;

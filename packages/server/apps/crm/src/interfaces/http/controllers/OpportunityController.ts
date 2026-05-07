import type { Request, Response } from 'express';
import { z } from 'zod';
import { OpportunityService } from '../../../application/opportunities/OpportunityService';
import type { OpportunityCondition } from '../../../domain/opportunities/OpportunityCondition';
import { Pagination } from '../../../shared/http/pagination';

const CreateOpportunitySchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  stage: z.enum(['new', 'qualified', 'proposal', 'won', 'lost']).default('new'),
  expectedCloseDate: z.string().min(1).nullable().optional(),
});

const UpdateOpportunitySchema = z
  .object({
    customerId: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    amount: z.number().nonnegative().optional(),
    stage: z.enum(['new', 'qualified', 'proposal', 'won', 'lost']).optional(),
    expectedCloseDate: z.string().min(1).nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  });

const BatchDeleteSchema = z.object({
  condition: z.object({
    ids: z.array(z.string().min(1)).min(1),
  }),
});

function toQueryString(value: unknown): string | undefined {
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

function parseDateOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value.trim() === '') return null;
  return new Date(value);
}

export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const condition = this.parseOpportunityCondition(req.query as Record<string, unknown>);

      const pageOpt = Pagination.parse(req.query as Record<string, unknown>, {
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

      const meta = Pagination.meta(result.total, pageOpt.page, pageOpt.pageSize);

      return res.status(200).json({
        data: result.data,
        meta,
        sort: pageOpt.sortBy ? { sortBy: pageOpt.sortBy, sortOrder: pageOpt.sortOrder } : undefined,
      });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const parsed = CreateOpportunitySchema.safeParse({
        ...req.body,
        amount: req.body?.amount === undefined ? undefined : Number(req.body.amount),
      });

      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const created = await this.opportunityService.createOpportunity({
        ...parsed.data,
        expectedCloseDate: parseDateOrNull(parsed.data.expectedCloseDate ?? undefined) ?? null,
      });

      return res.status(201).json(created);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  updateById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const parsed = UpdateOpportunitySchema.safeParse({
        ...req.body,
        amount: req.body?.amount === undefined ? undefined : Number(req.body.amount),
      });

      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const payload = {
        ...parsed.data,
        expectedCloseDate: parseDateOrNull(parsed.data.expectedCloseDate),
      };

      const updated = await this.opportunityService.updateOpportunity(req.params.id, payload);
      if (!updated) return res.status(404).json({ message: 'Opportunity not found' });
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  softDeleteById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const affected = await this.opportunityService.softDeleteOpportunity(req.params.id);
      if (!affected) return res.status(404).json({ message: 'Opportunity not found' });
      return res.status(200).json({ affected });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  softDeleteByCondition = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = BatchDeleteSchema.parse(req.body);
      const affected = await this.opportunityService.softDeleteOpportunitiesByCondition(body.condition);
      return res.status(200).json({ affected });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  private parseOpportunityCondition(query: Record<string, unknown>): OpportunityCondition {
    const keyword = toQueryString(query.keyword);
    const stageRaw = toQueryString(query.stage);
    const stage = ['new', 'qualified', 'proposal', 'won', 'lost'].includes(stageRaw || '')
      ? (stageRaw as 'new' | 'qualified' | 'proposal' | 'won' | 'lost')
      : undefined;

    return {
      keyword,
      stage,
      isdelete: false,
    };
  }
}

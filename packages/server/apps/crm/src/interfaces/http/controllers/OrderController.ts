import type { Request, Response } from 'express';
import { z } from 'zod';
import { OrderService } from '../../../application/orders/OrderService';
import type { OrderCondition } from '../../../domain/orders/OrderCondition';
import { Pagination } from '../../../shared/http/pagination';

const CreateOrderSchema = z.object({
  orderNo: z.string().min(1),
  customerId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  status: z.enum(['draft', 'confirmed', 'completed', 'cancelled']).default('draft'),
});

const UpdateOrderSchema = z
  .object({
    orderNo: z.string().min(1).optional(),
    customerId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    amount: z.number().nonnegative().optional(),
    status: z.enum(['draft', 'confirmed', 'completed', 'cancelled']).optional(),
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

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const condition = this.parseOrderCondition(req.query as Record<string, unknown>);

      const pageOpt = Pagination.parse(req.query as Record<string, unknown>, {
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
      const parsed = CreateOrderSchema.safeParse({
        ...req.body,
        amount: req.body?.amount === undefined ? undefined : Number(req.body.amount),
      });

      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const created = await this.orderService.createOrder(parsed.data);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  updateById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const parsed = UpdateOrderSchema.safeParse({
        ...req.body,
        amount: req.body?.amount === undefined ? undefined : Number(req.body.amount),
      });

      if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

      const updated = await this.orderService.updateOrder(req.params.id, parsed.data);
      if (!updated) return res.status(404).json({ message: 'Order not found' });
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  softDeleteById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const affected = await this.orderService.softDeleteOrder(req.params.id);
      if (!affected) return res.status(404).json({ message: 'Order not found' });
      return res.status(200).json({ affected });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  softDeleteByCondition = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = BatchDeleteSchema.parse(req.body);
      const affected = await this.orderService.softDeleteOrdersByCondition(body.condition);
      return res.status(200).json({ affected });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  private parseOrderCondition(query: Record<string, unknown>): OrderCondition {
    const keyword = toQueryString(query.keyword);
    const statusRaw = toQueryString(query.status);
    const status = ['draft', 'confirmed', 'completed', 'cancelled'].includes(statusRaw || '')
      ? (statusRaw as 'draft' | 'confirmed' | 'completed' | 'cancelled')
      : undefined;

    return {
      keyword,
      status,
      isdelete: false,
    };
  }
}

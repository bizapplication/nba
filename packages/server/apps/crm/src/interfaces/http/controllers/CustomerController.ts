import type { Request, Response } from 'express';
import { z } from 'zod';
import { CustomerService } from '../../../application/customers/CustomerService';
import type { CustomerCondition } from '../../../domain/customers/CustomerCondition';
import { Pagination } from '../../../shared/http/pagination';

const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  company: z.string().min(1),
});

const UpdateCustomerSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
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

export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const condition = this.parseCustomerCondition(req.query as Record<string, unknown>);

      const pageOpt = Pagination.parse(req.query as Record<string, unknown>, {
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
      const dto = CreateCustomerSchema.parse(req.body);
      const created = await this.customerService.createCustomer(dto);
      return res.status(201).json(created);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  updateById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto = UpdateCustomerSchema.parse(req.body);
      const updated = await this.customerService.updateCustomer(req.params.id, dto);

      if (!updated) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      return res.status(200).json(updated);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  softDeleteById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const affected = await this.customerService.softDeleteCustomer(req.params.id);
      if (!affected) return res.status(404).json({ message: 'Customer not found' });
      return res.status(200).json({ affected });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  softDeleteByCondition = async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = BatchDeleteSchema.parse(req.body);
      const affected = await this.customerService.softDeleteCustomersByCondition(body.condition);
      return res.status(200).json({ affected });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  };

  private parseCustomerCondition(query: Record<string, unknown>): CustomerCondition {
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

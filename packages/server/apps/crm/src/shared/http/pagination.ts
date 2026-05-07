export type SortOrder = 'asc' | 'desc';

export interface PageOptions {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: SortOrder;
}

export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ParseOptions {
  defaultPage: number;
  defaultPageSize: number;
  maxPageSize: number;
  allowedSortBy?: string[];
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
}

function toPositiveInt(value: unknown, fallback: number): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return fallback;
  return num;
}

function toSortOrder(value: unknown, fallback: SortOrder): SortOrder {
  if (typeof value !== 'string') return fallback;
  const lowered = value.toLowerCase();
  return lowered === 'asc' ? 'asc' : lowered === 'desc' ? 'desc' : fallback;
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export class Pagination {
  static parse(query: Record<string, unknown>, options: ParseOptions): PageOptions {
    const page = toPositiveInt(query.page, options.defaultPage);
    const requestedPageSize = toPositiveInt(query.pageSize, options.defaultPageSize);
    const pageSize = Math.min(requestedPageSize, options.maxPageSize);

    const requestedSortBy = toStringOrUndefined(query.sortBy);
    const sortBy = requestedSortBy ?? options.defaultSortBy;

    if (sortBy && options.allowedSortBy && !options.allowedSortBy.includes(sortBy)) {
      throw new Error(`Invalid sortBy: ${sortBy}`);
    }

    const sortOrder = toSortOrder(query.sortOrder, options.defaultSortOrder ?? 'desc');

    return {
      page,
      pageSize,
      skip: (page - 1) * pageSize,
      take: pageSize,
      sortBy,
      sortOrder,
    };
  }

  static meta(total: number, page: number, pageSize: number): PageMeta {
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    return {
      total,
      page,
      pageSize,
      pageCount,
      hasNext: page < pageCount,
      hasPrev: page > 1,
    };
  }
}

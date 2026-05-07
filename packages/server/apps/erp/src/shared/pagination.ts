export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export function parsePagination(page?: number | null, limit?: number | null): {
  page: number;
  limit: number;
} {
  const safePage =
    typeof page === 'number' && Number.isFinite(page) && page > 0
      ? Math.floor(page)
      : DEFAULT_PAGE;

  const safeLimit =
    typeof limit === 'number' && Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page: safePage,
    limit: safeLimit,
  };
}

export function paginate<T>(
  items: T[],
  page?: number | null,
  limit?: number | null,
): PaginatedResult<T> {
  const pagination = parsePagination(page, limit);
  const startIndex = (pagination.page - 1) * pagination.limit;

  return {
    data: items.slice(startIndex, startIndex + pagination.limit),
    total: items.length,
    page: pagination.page,
    limit: pagination.limit,
  };
}

export function includesSearch(
  haystacks: Array<string | null | undefined>,
  search?: string | null,
): boolean {
  if (!search) {
    return true;
  }

  const keyword = search.toLowerCase();
  return haystacks.some((candidate) =>
    (candidate ?? '').toLowerCase().includes(keyword),
  );
}

export function sortByNewest<T extends object>(items: T[], field: keyof T): T[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(String(left[field] ?? '')).getTime();
    const rightTime = new Date(String(right[field] ?? '')).getTime();
    return rightTime - leftTime;
  });
}

export function isWithinDateRange(
  value: string,
  dateFrom?: string | null,
  dateTo?: string | null,
): boolean {
  const valueTime = new Date(value).getTime();
  if (Number.isNaN(valueTime)) {
    return false;
  }

  if (dateFrom) {
    const minTime = new Date(`${dateFrom}T00:00:00.000Z`).getTime();
    if (!Number.isNaN(minTime) && valueTime < minTime) {
      return false;
    }
  }

  if (dateTo) {
    const maxTime = new Date(`${dateTo}T23:59:59.999Z`).getTime();
    if (!Number.isNaN(maxTime) && valueTime > maxTime) {
      return false;
    }
  }

  return true;
}

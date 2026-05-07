export interface PagedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  sort?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
}

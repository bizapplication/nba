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
export declare class Pagination {
    static parse(query: Record<string, unknown>, options: ParseOptions): PageOptions;
    static meta(total: number, page: number, pageSize: number): PageMeta;
}
export {};

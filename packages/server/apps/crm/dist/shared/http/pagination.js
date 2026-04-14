"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = void 0;
function toPositiveInt(value, fallback) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0)
        return fallback;
    return num;
}
function toSortOrder(value, fallback) {
    if (typeof value !== 'string')
        return fallback;
    const lowered = value.toLowerCase();
    return lowered === 'asc' ? 'asc' : lowered === 'desc' ? 'desc' : fallback;
}
function toStringOrUndefined(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
}
class Pagination {
    static parse(query, options) {
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
    static meta(total, page, pageSize) {
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
exports.Pagination = Pagination;

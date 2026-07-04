const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type PaginationParams = {
  limit: number;
  offset: number;
  page: number;
};

export function createPaginationParams(
  page?: number,
  limit?: number,
): PaginationParams {
  const safePage = page && page > 0 ? page : DEFAULT_PAGE;
  const requestedLimit = limit && limit > 0 ? limit : DEFAULT_LIMIT;
  const safeLimit = Math.min(requestedLimit, MAX_LIMIT);

  return {
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
    page: safePage,
  };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
) {
  return {
    limit,
    page,
    total,
    total_pages: limit > 0 && total > 0 ? Math.ceil(total / limit) : 0,
  };
}

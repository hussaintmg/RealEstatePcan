import { Model } from 'mongoose';

export interface PaginateOptions {
  page?: number;
  limit?: number;
  filter?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
  populate?: any;
  select?: string | string[] | Record<string, number | boolean>;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export async function paginateQuery<T>(
  model: Model<any>,
  options: PaginateOptions = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const filter = options.filter || {};
  const sort = options.sort || { createdAt: -1 };

  const skip = (page - 1) * limit;

  let query = model
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  if (options.select) {
    query = query.select(options.select as any);
  }

  const [items, totalItems] = await Promise.all([
    query.populate(options.populate as any).lean(),
    model.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    items: items as T[],
    totalItems,
    totalPages,
    currentPage: page,
    limit,
  };
}

import { resolvePath } from './conditionsEngine';

export interface RepeaterConfig {
  source: string; // e.g. "property.features" or "property.gallery"
  limit?: number;
  offset?: number;
  emptyPolicy?: 'hide' | 'show_fallback' | 'show_empty_message';
  emptyMessage?: string;
}

export interface RepeaterItemContext<T = any> {
  item: T;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  totalCount: number;
}

/**
 * Resolves an array from the data context, applies safe bounds (limit/offset),
 * and prepares structured item contexts for child templates.
 */
export function processRepeaterSource<T = any>(
  config: RepeaterConfig,
  context: Record<string, any> = {}
): {
  items: RepeaterItemContext<T>[];
  isEmpty: boolean;
  shouldHide: boolean;
  emptyMessage: string;
} {
  const rawArray = resolvePath(context, config.source);
  const emptyPolicy = config.emptyPolicy || 'hide';
  const emptyMessage = config.emptyMessage || 'No records available in this collection.';

  if (!Array.isArray(rawArray) || rawArray.length === 0) {
    return {
      items: [],
      isEmpty: true,
      shouldHide: emptyPolicy === 'hide',
      emptyMessage,
    };
  }

  // Safe pagination/limits: default maximum 50 items per repeater loop to prevent unbounded DOM blowup
  const maxLimit = Math.min(Math.max(1, config.limit || 20), 50);
  const offset = Math.max(0, config.offset || 0);
  const sliced = rawArray.slice(offset, offset + maxLimit);

  const totalCount = sliced.length;
  const items: RepeaterItemContext<T>[] = sliced.map((item, index) => ({
    item,
    index,
    isFirst: index === 0,
    isLast: index === totalCount - 1,
    totalCount,
  }));

  return {
    items,
    isEmpty: items.length === 0,
    shouldHide: items.length === 0 && emptyPolicy === 'hide',
    emptyMessage,
  };
}

export interface BulkProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentAction: string;
}

export type BulkProgressCallback = (progress: BulkProgress) => void;

export async function runConcurrentBatch<T, R>(
  items: T[],
  concurrency: number = 5,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: BulkProgressCallback
): Promise<{ results: R[]; errors: { item: T; error: any }[] }> {
  const results: R[] = [];
  const errors: { item: T; error: any }[] = [];
  const total = items.length;
  let completedCount = 0;

  // Process in concurrent chunks
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (item, chunkIdx) => {
      const globalIdx = i + chunkIdx;
      try {
        const res = await worker(item, globalIdx);
        results.push(res);
      } catch (err) {
        errors.push({ item, error: err });
      } finally {
        completedCount++;
        if (onProgress) {
          onProgress({
            total,
            completed: completedCount,
            failed: errors.length,
            percentage: Math.round((completedCount / total) * 100),
            currentAction: `Processed ${completedCount} of ${total}`,
          });
        }
      }
    });

    await Promise.all(chunkPromises);
  }

  return { results, errors };
}

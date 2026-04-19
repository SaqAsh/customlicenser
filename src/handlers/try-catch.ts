import {type Result} from '../types';

/**
 * Wraps a promise (or Thenable) into a Result tuple, avoiding throw-based
 * control flow. Returns `[value, null]` on success and `[null, Error]` on
 * failure. Non-Error throws are coerced to Error so the return type is
 * honest. The `null` in the tuple acts as the discriminator between the
 * success and failure variants.
 */
export async function tryCatch<T>(
  promise: PromiseLike<T>,
): Promise<Result<T, Error>> {
  try {
    return [await promise, null];
  } catch (err) {
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}

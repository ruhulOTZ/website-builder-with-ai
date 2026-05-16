import { AIError, AIQuotaExhaustedError, AIRateLimitError, AIValidationError } from './errors';

export interface RetryOptions {
  /** Max retries on top of the initial attempt. Default: 3 (= up to 4 calls). */
  retries?: number;
  /** Base backoff in ms. Default: 1000. */
  baseMs?: number;
  /** Multiplicative factor per retry. Default: 2. */
  factor?: number;
  /** Random jitter 0..1 added/subtracted to the computed delay. Default: 0.3. */
  jitter?: number;
  /** Cancellation signal. Aborts the wait between retries. */
  signal?: AbortSignal;
  /**
   * Map provider-native errors to AIError subtypes before retry classification.
   * Non-AIError throws are treated as transient (network / 5xx assumed).
   */
  classifyError?: (err: unknown) => Error;
}

/**
 * Run `fn`, retrying on transient errors with exponential backoff + jitter.
 *
 * Transient (retried): AIRateLimitError, anything that isn't an AIError
 *   subclass after classification (network blips, 5xx).
 * Fatal (not retried): AIValidationError, AIQuotaExhaustedError, AIError
 *   itself (a generic wrap means we already decided to give up).
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const baseMs = options.baseMs ?? 1000;
  const factor = options.factor ?? 2;
  const jitter = options.jitter ?? 0.3;
  const classify =
    options.classifyError ?? ((e: unknown) => (e instanceof Error ? e : new AIError(String(e))));

  let attempt = 0;

  while (true) {
    options.signal?.throwIfAborted();
    try {
      return await fn();
    } catch (raw) {
      const err = classify(raw);
      const retryable = isRetryable(err);
      if (!retryable || attempt >= retries) {
        throw err;
      }
      const baseDelay = baseMs * Math.pow(factor, attempt);
      const jitterFactor = 1 + (Math.random() * 2 - 1) * jitter;
      let delay = Math.max(0, baseDelay * jitterFactor);
      if (err instanceof AIRateLimitError && typeof err.retryAfterMs === 'number') {
        delay = Math.max(delay, err.retryAfterMs);
      }
      await sleep(delay, options.signal);
      attempt += 1;
    }
  }
}

function isRetryable(err: Error): boolean {
  if (err instanceof AIValidationError) return false;
  if (err instanceof AIQuotaExhaustedError) return false;
  if (err instanceof AIRateLimitError) return true;
  // Concrete AIError (not a subclass) means caller already decided it's fatal.
  if (err.constructor === AIError) return false;
  // Any other Error class — transient (network, 5xx, SDK quirks).
  return true;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError(signal));
      return;
    }
    const t = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      cleanup();
      reject(abortError(signal));
    };
    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function abortError(signal?: AbortSignal): Error {
  const reason: unknown = signal?.reason;
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === 'string' ? reason : 'Aborted');
}

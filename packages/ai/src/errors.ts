/**
 * Base class for every error this package surfaces to callers. Subclasses
 * encode the *category* of failure (rate-limit, validation, quota, ...) so
 * callers can branch without parsing message strings.
 */
export class AIError extends Error {
  public override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AIError';
    if (cause !== undefined) this.cause = cause;
  }
}

/** Transient. Retried automatically by `withRetry`. */
export class AIRateLimitError extends AIError {
  public readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number, cause?: unknown) {
    super(message, cause);
    this.name = 'AIRateLimitError';
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
  }
}

/** Not transient — model emitted output we can't parse, retrying won't help. */
export class AIValidationError extends AIError {
  public readonly rawOutput: string;
  public readonly zodIssues: unknown;

  constructor(message: string, rawOutput: string, zodIssues: unknown, cause?: unknown) {
    super(message, cause);
    this.name = 'AIValidationError';
    this.rawOutput = rawOutput;
    this.zodIssues = zodIssues;
  }
}

/** Not transient — billing/quota wall, swap provider or wait. */
export class AIQuotaExhaustedError extends AIError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'AIQuotaExhaustedError';
  }
}

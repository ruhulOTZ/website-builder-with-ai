/**
 * Minimal in-process token bucket. Refills `capacity` tokens every
 * `refillIntervalMs`. `acquire()` resolves once a token is available; if
 * the bucket is empty, awaiters queue and resolve in FIFO order as tokens
 * become available. No external dependency.
 *
 * Default config matches the Gemini Flash free tier: 15 requests per
 * 60 seconds.
 *
 * Scope: single Node process. For multi-instance deployment we'd swap this
 * for a Redis-backed limiter — not needed at this step.
 */
export interface TokenBucketConfig {
  capacity: number;
  refillIntervalMs: number;
}

export class TokenBucket {
  private readonly capacity: number;
  private readonly refillIntervalMs: number;
  private tokens: number;
  private readonly waiters: (() => void)[] = [];
  private refillTimer: NodeJS.Timeout | null = null;

  constructor(config: TokenBucketConfig) {
    if (config.capacity <= 0) {
      throw new Error('TokenBucket.capacity must be > 0');
    }
    if (config.refillIntervalMs <= 0) {
      throw new Error('TokenBucket.refillIntervalMs must be > 0');
    }
    this.capacity = config.capacity;
    this.refillIntervalMs = config.refillIntervalMs;
    this.tokens = config.capacity;
  }

  /**
   * Resolves when a token has been consumed. If the bucket is empty,
   * queues until the next refill.
   */
  async acquire(): Promise<void> {
    if (this.tokens > 0) {
      this.tokens -= 1;
      this.scheduleRefillIfNeeded();
      return;
    }
    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
      this.scheduleRefillIfNeeded();
    });
  }

  /** Current available tokens. Visible for tests / introspection. */
  available(): number {
    return this.tokens;
  }

  /** Number of queued acquire() calls. */
  queued(): number {
    return this.waiters.length;
  }

  private scheduleRefillIfNeeded(): void {
    if (this.refillTimer !== null) return;
    this.refillTimer = setTimeout(() => {
      this.refillTimer = null;
      this.refill();
    }, this.refillIntervalMs);
    // Don't keep the Node process alive solely because of this timer.
    if (typeof this.refillTimer.unref === 'function') {
      this.refillTimer.unref();
    }
  }

  private refill(): void {
    this.tokens = this.capacity;
    // Drain waiters up to current capacity.
    while (this.tokens > 0 && this.waiters.length > 0) {
      const wake = this.waiters.shift();
      if (wake === undefined) break;
      this.tokens -= 1;
      wake();
    }
    if (this.waiters.length > 0) {
      // Still have queued requests — keep refilling.
      this.scheduleRefillIfNeeded();
    }
  }
}

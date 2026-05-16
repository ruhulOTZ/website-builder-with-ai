'use client';

import { type FormEvent } from 'react';

import { cn } from '../utils/cn';

export interface NewsletterFormProps {
  headline: string;
  placeholder: string;
  cta: string;
  className?: string;
  align?: 'start' | 'center';
}

export function NewsletterForm({
  headline,
  placeholder,
  cta,
  className,
  align = 'start',
}: NewsletterFormProps) {
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // No submission logic — markup only. apps wire their own handler later.
  };

  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      <p className="font-heading text-foreground mb-3 text-base font-semibold">{headline}</p>
      <form
        onSubmit={onSubmit}
        className={cn('flex w-full max-w-sm gap-2', align === 'center' && 'mx-auto')}
      >
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder={placeholder}
          className="bg-background text-foreground border-border placeholder:text-muted-foreground focus-visible:ring-primary font-body min-w-0 flex-1 rounded-[var(--radius)] border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
        />
        <button
          type="submit"
          className="bg-primary text-background font-body focus-visible:ring-primary inline-flex shrink-0 items-center justify-center rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
        >
          {cta}
        </button>
      </form>
    </div>
  );
}

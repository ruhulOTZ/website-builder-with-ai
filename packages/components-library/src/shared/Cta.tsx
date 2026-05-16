import { type CtaSchema } from '@repo/shared-types';
import { type z } from 'zod';

import { cn } from '../utils/cn';

type CtaData = z.infer<typeof CtaSchema>;

const STYLE_CLASSES: Record<CtaData['style'], string> = {
  primary: 'bg-primary text-background hover:opacity-90 focus-visible:ring-primary',
  secondary:
    'bg-surface text-foreground border border-border hover:bg-background focus-visible:ring-foreground',
  ghost: 'text-foreground hover:bg-surface focus-visible:ring-foreground',
  link: 'text-primary underline underline-offset-4 hover:opacity-80 focus-visible:ring-primary',
};

const SIZE_CLASSES: Record<NonNullable<CtaProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export interface CtaProps {
  cta: CtaData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Cta({ cta, size = 'md', className }: CtaProps) {
  const isLink = cta.style === 'link';
  return (
    <a
      href={cta.href}
      target={cta.external ? '_blank' : undefined}
      rel={cta.external ? 'noopener noreferrer' : undefined}
      className={cn(
        'font-body inline-flex items-center justify-center font-medium outline-none transition-colors transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]',
        isLink ? '' : 'rounded-[var(--radius)]',
        isLink ? 'px-0 py-0' : SIZE_CLASSES[size],
        STYLE_CLASSES[cta.style],
        className,
      )}
    >
      {cta.label}
    </a>
  );
}

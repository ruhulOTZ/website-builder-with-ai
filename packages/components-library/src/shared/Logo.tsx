import { type ImageRefSchema } from '@repo/shared-types';
import { type z } from 'zod';

import { cn } from '../utils/cn';

import { Image } from './Image';

type ImageRef = z.infer<typeof ImageRefSchema>;

export interface LogoProps {
  text?: string | undefined;
  image?: ImageRef | undefined;
  href?: string;
  className?: string;
  /** Use a larger text size when the logo is the dominant element. */
  size?: 'md' | 'lg';
}

export function Logo({ text, image, href = '/', className, size = 'md' }: LogoProps) {
  const sizeClass = size === 'lg' ? 'text-2xl' : 'text-lg';
  const inner = image ? (
    <Image image={image} fit="contain" className={size === 'lg' ? 'h-10 w-auto' : 'h-8 w-auto'} />
  ) : (
    <span className={cn('font-heading text-foreground font-semibold tracking-tight', sizeClass)}>
      {text ?? 'Brand'}
    </span>
  );

  return (
    <a
      href={href}
      className={cn(
        'focus-visible:ring-primary inline-flex items-center rounded-[var(--radius)] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]',
        className,
      )}
      aria-label={text ?? image?.alt ?? 'Home'}
    >
      {inner}
    </a>
  );
}

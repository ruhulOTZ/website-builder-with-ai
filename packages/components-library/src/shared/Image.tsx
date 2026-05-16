import { type ImageRefSchema } from '@repo/shared-types';
import { type z } from 'zod';

import { cn } from '../utils/cn';

type ImageRef = z.infer<typeof ImageRefSchema>;

export interface ImageProps {
  image: ImageRef;
  /** Caller controls sizing; this component fills its container. */
  className?: string;
  /** object-fit. Default: cover. */
  fit?: 'cover' | 'contain';
}

export function Image({ image, className, fit = 'cover' }: ImageProps) {
  const objectClass = fit === 'cover' ? 'object-cover' : 'object-contain';
  const objectPosition = image.focalPoint
    ? { objectPosition: `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%` }
    : undefined;

  if (image.url) {
    // Plain <img> is intentional — see Image rationale in step 5 prompt.
    // apps/web can later swap to next/image via a render-prop pattern.

    return (
      <img
        src={image.url}
        alt={image.alt}
        className={cn('block h-full w-full', objectClass, className)}
        style={objectPosition}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={image.alt}
      className={cn(
        'bg-muted-foreground/10 text-muted-foreground font-body flex h-full w-full items-center justify-center p-4 text-center text-xs leading-snug',
        className,
      )}
    >
      <span className="line-clamp-3 max-w-[80%]">
        {image.alt}
        {image.query ? <span className="opacity-60"> · {image.query}</span> : null}
      </span>
    </div>
  );
}

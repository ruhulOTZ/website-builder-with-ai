import { type IconRefSchema } from '@repo/shared-types';
import * as LucideIcons from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { type z } from 'zod';

import { cn } from '../utils/cn';

type IconRef = z.infer<typeof IconRefSchema>;

// lucide-react's barrel exports a mix of LucideIcon components and a few helpers
// (e.g. `createLucideIcon`, `icons` map). Casting once here keeps the lookup
// type-safe at call sites without needing `any`.
const lucideMap = LucideIcons as unknown as Record<string, LucideIcon | undefined>;

export interface IconProps {
  icon: IconRef;
  className?: string;
}

export function Icon({ icon, className }: IconProps) {
  if (icon.set === 'lucide') {
    const Comp = lucideMap[icon.name];
    if (Comp) {
      return <Comp className={className} aria-hidden="true" focusable="false" />;
    }
  }
  // TODO(icons): Add @tabler/icons-react support — for now `set: "tabler"` and
  // unknown lucide names fall through to a neutral placeholder.
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-muted-foreground/20 inline-block size-4 rounded-[var(--radius)]',
        className,
      )}
    />
  );
}

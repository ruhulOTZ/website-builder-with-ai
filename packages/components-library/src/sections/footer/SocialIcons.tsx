import { Facebook, Github, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { type ComponentType } from 'react';

import { cn } from '../../utils/cn';

const ICON_MAP: Record<string, ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  github: Github,
};

export function SocialIcons({
  socials,
  className,
}: {
  socials: Record<string, string>;
  className?: string;
}) {
  const entries = Object.entries(socials).filter(([, href]) => Boolean(href));
  if (entries.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap items-center gap-3', className)}>
      {entries.map(([key, href]) => {
        const Icon = ICON_MAP[key.toLowerCase()];
        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={key}
              className="text-muted-foreground hover:text-foreground border-border hover:border-foreground/40 focus-visible:ring-primary inline-flex size-9 items-center justify-center rounded-[var(--radius)] border outline-none transition-colors focus-visible:ring-2"
            >
              {Icon ? (
                <Icon className="size-4" aria-hidden />
              ) : (
                <span className="font-body text-xs font-medium uppercase">{key.slice(0, 2)}</span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

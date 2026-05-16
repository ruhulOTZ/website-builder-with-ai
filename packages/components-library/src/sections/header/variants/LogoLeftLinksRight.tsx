'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Cta } from '../../../shared/Cta';
import { Logo } from '../../../shared/Logo';
import { cn } from '../../../utils/cn';
import { type HeaderData } from '../types';

export function LogoLeftLinksRight({ logo, links, cta, sticky }: HeaderData) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn('bg-background border-border w-full border-b', sticky && 'sticky top-0 z-50')}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Logo text={logo.text} image={logo.image} />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {links.map((link, i) => (
            <a
              key={`${link.label}-${String(i)}`}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="font-body text-foreground hover:text-primary focus-visible:ring-primary rounded-sm text-sm font-medium tracking-tight outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--color-background)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">{cta ? <Cta cta={cta} /> : null}</div>

        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="header-mobile-panel"
          onClick={() => setOpen((v) => !v)}
          className="text-foreground hover:bg-surface focus-visible:ring-primary -mr-2 inline-flex size-10 items-center justify-center rounded-[var(--radius)] outline-none transition-colors focus-visible:ring-2 md:hidden"
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {open ? (
        <div id="header-mobile-panel" className="border-border bg-background border-t md:hidden">
          <nav aria-label="Primary mobile" className="flex flex-col gap-1 px-6 py-4">
            {links.map((link, i) => (
              <a
                key={`${link.label}-${String(i)}`}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="font-body text-foreground hover:bg-surface rounded-[var(--radius)] px-3 py-2 text-base font-medium"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            {cta ? (
              <div className="pt-3">
                <Cta cta={cta} className="w-full" />
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

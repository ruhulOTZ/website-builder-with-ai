'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Cta } from '../../../shared/Cta';
import { Logo } from '../../../shared/Logo';
import { cn } from '../../../utils/cn';
import { type HeaderData } from '../types';

export function LogoCenterLinksSplit({ logo, links, cta, sticky }: HeaderData) {
  const [open, setOpen] = useState(false);

  const mid = Math.ceil(links.length / 2);
  const left = links.slice(0, mid);
  const right = links.slice(mid);

  return (
    <header
      className={cn('bg-background border-border w-full border-b', sticky && 'sticky top-0 z-50')}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-x-8 px-6 py-5 lg:gap-x-12">
        {/* Desktop: split nav left */}
        <nav aria-label="Primary left" className="hidden items-center justify-end gap-8 md:flex">
          {left.map((link, i) => (
            <a
              key={`${link.label}-${String(i)}`}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="font-body text-foreground hover:text-primary text-sm font-medium tracking-tight transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile: hamburger flush left */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="header-mobile-panel"
          onClick={() => setOpen((v) => !v)}
          className="text-foreground hover:bg-surface focus-visible:ring-primary -ml-2 inline-flex size-10 items-center justify-center justify-self-start rounded-[var(--radius)] outline-none focus-visible:ring-2 md:hidden"
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>

        <div className="justify-self-center">
          <Logo text={logo.text} image={logo.image} size="lg" />
        </div>

        {/* Desktop: split nav right */}
        <nav aria-label="Primary right" className="hidden items-center justify-start gap-8 md:flex">
          {right.map((link, i) => (
            <a
              key={`${link.label}-${String(i)}`}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="font-body text-foreground hover:text-primary text-sm font-medium tracking-tight transition-colors"
            >
              {link.label}
            </a>
          ))}
          {cta ? (
            <div className="ml-2">
              <Cta cta={cta} size="sm" />
            </div>
          ) : null}
        </nav>

        {/* Mobile: spacer on right to balance grid */}
        <span className="size-10 justify-self-end md:hidden" aria-hidden="true" />
      </div>

      {open ? (
        <div id="header-mobile-panel" className="border-border bg-background border-t md:hidden">
          <nav aria-label="Primary mobile" className="flex flex-col gap-1 px-6 py-4">
            {links.map((link, i) => (
              <a
                key={`${link.label}-${String(i)}`}
                href={link.href}
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

import { type Metadata } from 'next';
import Link from 'next/link';

import { bloomSite } from '@/fixtures/bloom-site';
import { forgeSite } from '@/fixtures/forge-site';
import { vectorSite } from '@/fixtures/vector-site';

export const metadata: Metadata = {
  title: 'Sample sites · Website Builder',
  description: 'Three hand-authored sample sites rendered from SiteSchema fixtures.',
};

const SITES = [
  {
    href: '/sites/forge',
    site: forgeSite,
    archetype: 'hero / outlaw',
    direction: 'Dark, vibrant red, condensed display type, sharp corners.',
    swatches: ['oklch(0.13 0.01 250)', 'oklch(0.62 0.24 27)', 'oklch(0.96 0.005 250)'],
  },
  {
    href: '/sites/bloom',
    site: bloomSite,
    archetype: 'caregiver / innocent',
    direction: 'Cream, dusty mint, friendly serif, airy density.',
    swatches: ['oklch(0.975 0.018 80)', 'oklch(0.72 0.085 175)', 'oklch(0.28 0.04 40)'],
  },
  {
    href: '/sites/vector',
    site: vectorSite,
    archetype: 'sage',
    direction: 'Off-white, deep navy, Instrument Serif + Geist, restrained.',
    swatches: ['oklch(0.985 0.004 260)', 'oklch(0.22 0.05 260)', 'oklch(0.58 0.16 250)'],
  },
] as const;

export default function SitesIndexPage() {
  return (
    <main className="bg-background mx-auto max-w-5xl px-6 py-16">
      <header className="mb-12">
        <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-[0.24em]">
          Sample sites
        </p>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
          Three hand-authored fixtures, same component library.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-relaxed">
          The visual gate for step 7. Each site is a full <code>SiteSchema</code> fixture, validated
          at module load, rendered through the component registry with no per-site code changes.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {SITES.map(({ href, site, archetype, direction, swatches }) => (
          <li key={href}>
            <Link
              href={href}
              className="border-border bg-card hover:border-foreground/40 focus-visible:ring-ring group block h-full rounded-lg border p-6 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <div className="mb-4 flex gap-1.5">
                {swatches.map((color, i) => (
                  <span
                    key={`${href}-swatch-${String(i)}`}
                    className="border-border size-6 rounded-full border"
                    style={{ background: color }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <h2 className="text-foreground mb-1 text-lg font-semibold tracking-tight">
                {site.metadata.siteName}
              </h2>
              <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.18em]">
                {archetype}
              </p>
              <p className="text-foreground text-sm leading-relaxed">
                {site.metadata.siteDescription}
              </p>
              <p className="text-muted-foreground mt-4 text-xs leading-relaxed">{direction}</p>
              <p className="text-foreground/80 group-hover:text-foreground mt-6 text-sm font-medium">
                Open {site.metadata.siteName} →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

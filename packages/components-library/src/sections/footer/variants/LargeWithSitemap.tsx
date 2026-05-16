import { Logo } from '../../../shared/Logo';
import { NewsletterForm } from '../../../shared/NewsletterForm';
import { SocialIcons } from '../SocialIcons';
import { type FooterData } from '../types';

export function LargeWithSitemap({
  logo,
  tagline,
  columns,
  socials,
  newsletter,
  legal,
}: FooterData) {
  return (
    <footer className="bg-foreground text-[color:var(--color-background)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_2.4fr]">
          <div>
            <Logo
              text={logo.text}
              image={logo.image}
              size="lg"
              className="text-[color:var(--color-background)]"
            />
            {tagline ? (
              <p className="font-body mt-4 max-w-sm text-sm leading-relaxed opacity-80">
                {tagline}
              </p>
            ) : null}
            {newsletter ? (
              <div className="mt-8">
                <NewsletterForm
                  headline={newsletter.headline}
                  placeholder={newsletter.placeholder}
                  cta={newsletter.cta}
                />
              </div>
            ) : null}
          </div>

          {columns?.length ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
              {columns.map((col) => (
                <div key={col.title}>
                  <p className="font-heading mb-4 text-xs font-semibold uppercase tracking-[0.18em] opacity-90">
                    {col.title}
                  </p>
                  <ul className="space-y-3">
                    {col.links.map((link, i) => (
                      <li key={`${link.label}-${String(i)}`}>
                        <a
                          href={link.href}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          className="font-body text-sm opacity-70 transition-opacity hover:opacity-100"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/15 pt-8 sm:flex-row sm:items-center">
          <p className="font-body text-xs opacity-70">{legal.copyright}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {legal.links?.length ? (
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {legal.links.map((link, i) => (
                  <li key={`${link.label}-${String(i)}`}>
                    <a
                      href={link.href}
                      className="font-body text-xs opacity-70 transition-opacity hover:opacity-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {socials ? <SocialIcons socials={socials} /> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

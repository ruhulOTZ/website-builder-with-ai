import { Logo } from '../../../shared/Logo';
import { NewsletterForm } from '../../../shared/NewsletterForm';
import { SocialIcons } from '../SocialIcons';
import { type FooterData } from '../types';

export function ColumnsWithNewsletter({
  logo,
  tagline,
  columns,
  socials,
  newsletter,
  legal,
}: FooterData) {
  return (
    <footer className="bg-surface border-border border-t">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo text={logo.text} image={logo.image} size="lg" />
            {tagline ? (
              <p className="font-body text-muted-foreground mt-4 max-w-xs text-sm leading-relaxed">
                {tagline}
              </p>
            ) : null}
            {socials ? <SocialIcons socials={socials} className="mt-6" /> : null}
          </div>

          {columns?.length ? (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
              {columns.map((col) => (
                <div key={col.title}>
                  <p className="font-heading text-foreground mb-4 text-sm font-semibold uppercase tracking-wider">
                    {col.title}
                  </p>
                  <ul className="space-y-3">
                    {col.links.map((link, i) => (
                      <li key={`${link.label}-${String(i)}`}>
                        <a
                          href={link.href}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          className="font-body text-muted-foreground hover:text-foreground text-sm transition-colors"
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

          {newsletter ? (
            <div className="lg:col-span-3">
              <NewsletterForm
                headline={newsletter.headline}
                placeholder={newsletter.placeholder}
                cta={newsletter.cta}
              />
            </div>
          ) : null}
        </div>

        <div className="border-border mt-12 flex flex-col items-start justify-between gap-4 border-t pt-8 sm:flex-row sm:items-center">
          <p className="font-body text-muted-foreground text-xs">{legal.copyright}</p>
          {legal.links?.length ? (
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {legal.links.map((link, i) => (
                <li key={`${link.label}-${String(i)}`}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="font-body text-muted-foreground hover:text-foreground text-xs transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

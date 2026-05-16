import { Logo } from '../../../shared/Logo';
import { SocialIcons } from '../SocialIcons';
import { type FooterData } from '../types';

export function MinimalCentered({ logo, tagline, columns, socials, legal }: FooterData) {
  // Minimal variant flattens any provided columns into a single horizontal link row.
  const inlineLinks = columns?.flatMap((c) => c.links) ?? [];

  return (
    <footer className="bg-background border-border border-t">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-14 text-center">
        <Logo text={logo.text} image={logo.image} size="lg" />
        {tagline ? (
          <p className="font-body text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
            {tagline}
          </p>
        ) : null}

        {inlineLinks.length > 0 ? (
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {inlineLinks.map((link, i) => (
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
        ) : null}

        {socials ? <SocialIcons socials={socials} className="mt-6 justify-center" /> : null}

        <p className="font-body text-muted-foreground mt-10 text-xs">{legal.copyright}</p>
        {legal.links?.length ? (
          <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {legal.links.map((link, i) => (
              <li key={`${link.label}-${String(i)}`}>
                <a
                  href={link.href}
                  className="font-body text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  );
}

interface IntroProps {
  eyebrow?: string | undefined;
  headline?: string | undefined;
  subheadline?: string | undefined;
  align?: 'start' | 'center';
}

export function SectionIntro({ eyebrow, headline, subheadline, align = 'start' }: IntroProps) {
  if (!eyebrow && !headline && !subheadline) return null;
  const alignClass = align === 'center' ? 'text-center mx-auto' : '';

  return (
    <div className={`mb-12 max-w-2xl ${alignClass}`}>
      {eyebrow ? (
        <p className="font-body text-primary mb-3 text-xs font-semibold uppercase tracking-[0.24em]">
          {eyebrow}
        </p>
      ) : null}
      {headline ? (
        <h2 className="font-heading text-foreground text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          {headline}
        </h2>
      ) : null}
      {subheadline ? (
        <p className="font-body text-muted-foreground mt-4 text-base leading-relaxed md:text-lg">
          {subheadline}
        </p>
      ) : null}
    </div>
  );
}

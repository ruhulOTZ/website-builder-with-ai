import { type HeaderSection } from './types';
import { LogoCenterLinksSplit } from './variants/LogoCenterLinksSplit';
import { LogoLeftCtaRight } from './variants/LogoLeftCtaRight';
import { LogoLeftLinksRight } from './variants/LogoLeftLinksRight';
import { MinimalLogoOnly } from './variants/MinimalLogoOnly';

export function Header({ variant, props }: HeaderSection) {
  // Safety fallback: the AI sometimes picks `logo_left_cta_right` (logo on
  // left, CTA on right — no nav menu) while emitting a populated `links`
  // array and no `cta`. That variant by design drops `links`, so the page
  // ends up with a logo-only header — to the user the navbar looks missing.
  // When we detect that mismatch, render the `logo_left_links_right` variant
  // instead so the AI-emitted links are visible.
  const effectiveVariant: HeaderSection['variant'] =
    variant === 'logo_left_cta_right' && props.cta === undefined && props.links.length > 0
      ? 'logo_left_links_right'
      : variant;

  switch (effectiveVariant) {
    case 'logo_left_links_right':
      return <LogoLeftLinksRight {...props} />;
    case 'logo_center_links_split':
      return <LogoCenterLinksSplit {...props} />;
    case 'minimal_logo_only':
      return <MinimalLogoOnly {...props} />;
    case 'logo_left_cta_right':
      return <LogoLeftCtaRight {...props} />;
    default: {
      const _exhaustive: never = effectiveVariant;
      return _exhaustive;
    }
  }
}

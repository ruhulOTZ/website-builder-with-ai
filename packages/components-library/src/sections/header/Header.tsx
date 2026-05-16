import { type HeaderSection } from './types';
import { LogoCenterLinksSplit } from './variants/LogoCenterLinksSplit';
import { LogoLeftCtaRight } from './variants/LogoLeftCtaRight';
import { LogoLeftLinksRight } from './variants/LogoLeftLinksRight';
import { MinimalLogoOnly } from './variants/MinimalLogoOnly';

export function Header({ variant, props }: HeaderSection) {
  switch (variant) {
    case 'logo_left_links_right':
      return <LogoLeftLinksRight {...props} />;
    case 'logo_center_links_split':
      return <LogoCenterLinksSplit {...props} />;
    case 'minimal_logo_only':
      return <MinimalLogoOnly {...props} />;
    case 'logo_left_cta_right':
      return <LogoLeftCtaRight {...props} />;
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

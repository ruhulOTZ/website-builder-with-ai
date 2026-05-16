import { type FooterSection } from './types';
import { ColumnsWithNewsletter } from './variants/ColumnsWithNewsletter';
import { LargeWithSitemap } from './variants/LargeWithSitemap';
import { MinimalCentered } from './variants/MinimalCentered';

export function Footer({ variant, props }: FooterSection) {
  switch (variant) {
    case 'columns_with_newsletter':
      return <ColumnsWithNewsletter {...props} />;
    case 'minimal_centered':
      return <MinimalCentered {...props} />;
    case 'large_with_sitemap':
      return <LargeWithSitemap {...props} />;
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

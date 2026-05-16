import { Cta } from '../../../shared/Cta';
import { Logo } from '../../../shared/Logo';
import { cn } from '../../../utils/cn';
import { type HeaderData } from '../types';

export function MinimalLogoOnly({ logo, cta, sticky }: HeaderData) {
  return (
    <header className={cn('bg-background w-full', sticky && 'sticky top-0 z-50')}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Logo text={logo.text} image={logo.image} size="lg" />
        {cta ? <Cta cta={cta} /> : null}
      </div>
    </header>
  );
}

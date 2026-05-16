import { Cta } from '../../../shared/Cta';
import { Logo } from '../../../shared/Logo';
import { cn } from '../../../utils/cn';
import { type HeaderData } from '../types';

export function LogoLeftCtaRight({ logo, cta, sticky }: HeaderData) {
  return (
    <header
      className={cn('bg-background border-border w-full border-b', sticky && 'sticky top-0 z-50')}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Logo text={logo.text} image={logo.image} />
        {cta ? <Cta cta={cta} /> : null}
      </div>
    </header>
  );
}

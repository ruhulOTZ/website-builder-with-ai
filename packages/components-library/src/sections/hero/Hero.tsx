import { type HeroSection } from './types';
import { AsymmetricFloating } from './variants/AsymmetricFloating';
import { CenteredTextOverImage } from './variants/CenteredTextOverImage';
import { GradientMesh } from './variants/GradientMesh';
import { MinimalTypographic } from './variants/MinimalTypographic';
import { SplitImageLeft } from './variants/SplitImageLeft';
import { SplitImageRight } from './variants/SplitImageRight';
import { VideoBackground } from './variants/VideoBackground';

export function Hero({ variant, props }: HeroSection) {
  switch (variant) {
    case 'centered_text_over_image':
      return <CenteredTextOverImage {...props} />;
    case 'split_image_right':
      return <SplitImageRight {...props} />;
    case 'split_image_left':
      return <SplitImageLeft {...props} />;
    case 'video_background':
      return <VideoBackground {...props} />;
    case 'gradient_mesh':
      return <GradientMesh {...props} />;
    case 'asymmetric_floating':
      return <AsymmetricFloating {...props} />;
    case 'minimal_typographic':
      return <MinimalTypographic {...props} />;
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

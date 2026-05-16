import { type FeatureGridSection } from './types';
import { AlternatingRows } from './variants/AlternatingRows';
import { FourColMinimal } from './variants/FourColMinimal';
import { ThreeColIconTop } from './variants/ThreeColIconTop';
import { TwoColImageLeft } from './variants/TwoColImageLeft';

export function FeatureGrid({ variant, props }: FeatureGridSection) {
  switch (variant) {
    case '3_col_icon_top':
      return <ThreeColIconTop {...props} />;
    case '2_col_image_left':
      return <TwoColImageLeft {...props} />;
    case '4_col_minimal':
      return <FourColMinimal {...props} />;
    case 'alternating_rows':
      return <AlternatingRows {...props} />;
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

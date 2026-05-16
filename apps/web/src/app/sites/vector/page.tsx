import { buildSiteMetadata, RenderSite } from '../_render-site';

import { vectorSite } from '@/fixtures/vector-site';

export const metadata = buildSiteMetadata(vectorSite);

export default function VectorPage() {
  return <RenderSite site={vectorSite} />;
}

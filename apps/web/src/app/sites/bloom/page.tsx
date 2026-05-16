import { buildSiteMetadata, RenderSite } from '../_render-site';

import { bloomSite } from '@/fixtures/bloom-site';

export const metadata = buildSiteMetadata(bloomSite);

export default function BloomPage() {
  return <RenderSite site={bloomSite} />;
}

import { buildSiteMetadata, RenderSite } from '../_render-site';

import { forgeSite } from '@/fixtures/forge-site';

export const metadata = buildSiteMetadata(forgeSite);

export default function ForgePage() {
  return <RenderSite site={forgeSite} />;
}

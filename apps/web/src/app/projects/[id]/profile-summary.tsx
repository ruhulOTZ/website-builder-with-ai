import { type BusinessProfile } from '@repo/shared-types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  profile: BusinessProfile;
}

// Read-only collapsed summary for use above the brief form. The user has
// confirmed the profile; we don't want to force them back to a previous
// page to remember what they wrote, but we also don't want them re-editing
// from the brief stage. Display-only.
export function ProfileSummary({ profile }: Props) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-muted-foreground text-sm uppercase tracking-wide">
          Business profile (confirmed)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <details>
          <summary className="text-foreground cursor-pointer text-base font-medium">
            {profile.businessName}
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              · {profile.domain}
              {profile.domainSpecifier !== undefined && profile.domainSpecifier !== ''
                ? ` (${profile.domainSpecifier})`
                : ''}
            </span>
          </summary>
          <div className="text-muted-foreground mt-4 space-y-3 text-sm">
            <p className="text-foreground italic">{profile.oneLineDescription}</p>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide">Audience:</span>{' '}
              {profile.targetAudience}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide">Personality:</span>{' '}
              {profile.brandPersonality.join(', ')}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide">Price point:</span>{' '}
              <Badge variant="outline" className="text-xs">
                {profile.pricePoint}
              </Badge>
            </div>
            {profile.services.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Services ({String(profile.services.length)}):
                </span>{' '}
                {profile.services.map((s) => s.name).join(' · ')}
              </div>
            )}
            {profile.uniqueSellingPoints.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide">USPs:</span>
                <ul className="mt-1 list-disc pl-5">
                  {profile.uniqueSellingPoints.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

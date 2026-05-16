'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { BusinessDomain, type BusinessProfile } from '@repo/shared-types';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DOMAIN_OPTIONS, PRICE_POINT_OPTIONS } from '@/lib/profile-options';

type Status = 'PROFILE_GENERATED' | 'PROFILE_CONFIRMED';

interface Props {
  projectId: string;
  initialProfile: BusinessProfile;
  status: Status;
}

// Internal form shape — string arrays wrapped as { value }[] objects so
// react-hook-form's useFieldArray can manage them. Converted to/from
// canonical BusinessProfile at the form boundary. This is the standard
// pattern for primitive-array fields in react-hook-form.
const FormShape = z.object({
  domain: BusinessDomain,
  domainSpecifier: z.string(),
  businessName: z.string().min(1),
  tagline: z.string(),
  oneLineDescription: z.string().min(1),
  services: z.array(z.object({ name: z.string().min(1), description: z.string().min(1) })),
  targetAudience: z.string().min(1),
  uniqueSellingPoints: z.array(z.object({ value: z.string() })),
  brandPersonality: z.array(z.object({ value: z.string() })),
  pricePoint: z.enum(['budget', 'mid', 'premium', 'luxury']),
  location: z.object({
    city: z.string(),
    region: z.string(),
    country: z.string(),
    isOnlineOnly: z.boolean(),
  }),
  contact: z.object({
    email: z.string(),
    phone: z.string(),
    address: z.string(),
  }),
});
type FormValues = z.infer<typeof FormShape>;

function toForm(p: BusinessProfile): FormValues {
  return {
    domain: p.domain,
    domainSpecifier: p.domainSpecifier ?? '',
    businessName: p.businessName,
    tagline: p.tagline ?? '',
    oneLineDescription: p.oneLineDescription,
    services: p.services,
    targetAudience: p.targetAudience,
    uniqueSellingPoints: p.uniqueSellingPoints.map((v) => ({ value: v })),
    brandPersonality: p.brandPersonality.map((v) => ({ value: v })),
    pricePoint: p.pricePoint,
    location: {
      city: p.location?.city ?? '',
      region: p.location?.region ?? '',
      country: p.location?.country ?? '',
      isOnlineOnly: p.location?.isOnlineOnly ?? false,
    },
    contact: {
      email: p.contact?.email ?? '',
      phone: p.contact?.phone ?? '',
      address: p.contact?.address ?? '',
    },
  };
}

// Convert form state back to the canonical BusinessProfile. Strips empty
// optionals so the schema validates cleanly server-side.
function toSubmit(v: FormValues): BusinessProfile {
  const out: BusinessProfile = {
    domain: v.domain,
    businessName: v.businessName.trim(),
    oneLineDescription: v.oneLineDescription.trim(),
    services: v.services.map((s) => ({
      name: s.name.trim(),
      description: s.description.trim(),
    })),
    targetAudience: v.targetAudience.trim(),
    uniqueSellingPoints: v.uniqueSellingPoints.map((s) => s.value.trim()).filter((s) => s !== ''),
    brandPersonality: v.brandPersonality.map((s) => s.value.trim()).filter((s) => s !== ''),
    pricePoint: v.pricePoint,
  };
  if (v.domainSpecifier.trim() !== '') out.domainSpecifier = v.domainSpecifier.trim();
  if (v.tagline.trim() !== '') out.tagline = v.tagline.trim();

  const loc = v.location;
  const locHas =
    loc.city.trim() !== '' ||
    loc.region.trim() !== '' ||
    loc.country.trim() !== '' ||
    loc.isOnlineOnly;
  if (locHas) {
    out.location = {
      ...(loc.city.trim() !== '' ? { city: loc.city.trim() } : {}),
      ...(loc.region.trim() !== '' ? { region: loc.region.trim() } : {}),
      ...(loc.country.trim() !== '' ? { country: loc.country.trim() } : {}),
      isOnlineOnly: loc.isOnlineOnly,
    };
  }

  const c = v.contact;
  const cHas = c.email.trim() !== '' || c.phone.trim() !== '' || c.address.trim() !== '';
  if (cHas) {
    out.contact = {
      ...(c.email.trim() !== '' ? { email: c.email.trim() } : {}),
      ...(c.phone.trim() !== '' ? { phone: c.phone.trim() } : {}),
      ...(c.address.trim() !== '' ? { address: c.address.trim() } : {}),
    };
  }
  return out;
}

export function ProfileForm({ projectId, initialProfile, status }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState<'save' | 'confirm' | 'regenerate' | null>(null);
  const [collapsed, setCollapsed] = useState({ location: true, contact: true });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormShape),
    defaultValues: toForm(initialProfile),
  });

  const services = useFieldArray({ control: form.control, name: 'services' });
  const usps = useFieldArray({ control: form.control, name: 'uniqueSellingPoints' });
  const personality = useFieldArray({ control: form.control, name: 'brandPersonality' });

  async function patchProfile(body: Record<string, unknown>): Promise<boolean> {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      toast.error(errBody.message ?? errBody.error ?? `Save failed (${String(res.status)})`);
      return false;
    }
    return true;
  }

  async function onSave(values: FormValues): Promise<void> {
    setSaving('save');
    const ok = await patchProfile({ businessProfileJson: toSubmit(values) });
    if (ok) {
      toast.success('Profile saved');
      router.refresh();
    }
    setSaving(null);
  }

  async function onConfirm(values: FormValues): Promise<void> {
    setSaving('confirm');
    const ok = await patchProfile({
      businessProfileJson: toSubmit(values),
      confirmProfile: true,
    });
    if (ok) {
      toast.success('Profile confirmed');
      router.refresh();
    }
    setSaving(null);
  }

  async function onRegenerate(): Promise<void> {
    setSaving('regenerate');
    try {
      const res = await fetch(`/api/projects/${projectId}/parse`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? `Regenerate failed (${String(res.status)})`);
        return;
      }
      toast.success('Profile regenerated');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(null);
    }
  }

  const isConfirmed = status === 'PROFILE_CONFIRMED';
  const isSaving = saving !== null;

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {/* --- Business basics --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Business basics
          </h3>
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="oneLineDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-line description</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} disabled={isSaving} />
                </FormControl>
                <FormDescription>
                  The elevator pitch in the brand&apos;s voice. Up to 25 words.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tagline <span className="text-muted-foreground font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* --- Domain --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Domain
          </h3>
          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business domain</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DOMAIN_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="domainSpecifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Sub-category <span className="text-muted-foreground font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. pediatric, powerlifting gym"
                    {...field}
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* --- Services --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
              Services
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                services.append({ name: '', description: '' });
              }}
              disabled={isSaving}
            >
              + Add service
            </Button>
          </div>
          {services.fields.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">No services listed.</p>
          ) : null}
          {services.fields.map((f, i) => (
            <div key={f.id} className="bg-muted/30 space-y-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground text-xs">Service {String(i + 1)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    services.remove(i);
                  }}
                  disabled={isSaving}
                  aria-label="Remove service"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <FormField
                control={form.control}
                name={`services.${i}.name` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`services.${i}.description` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </section>

        <Separator />

        {/* --- Audience + USPs --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Audience &amp; positioning
          </h3>
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target audience</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pricePoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price point</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRICE_POINT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>Unique selling points</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  usps.append({ value: '' });
                }}
                disabled={isSaving}
              >
                + Add USP
              </Button>
            </div>
            {usps.fields.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">No USPs listed.</p>
            ) : null}
            {usps.fields.map((f, i) => (
              <div key={f.id} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name={`uniqueSellingPoints.${i}.value` as const}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    usps.remove(i);
                  }}
                  disabled={isSaving}
                  aria-label="Remove USP"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* --- Brand personality --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
              Brand personality
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                personality.append({ value: '' });
              }}
              disabled={isSaving}
            >
              + Add adjective
            </Button>
          </div>
          <FormDescription>Single-word adjectives that describe the brand voice.</FormDescription>
          {personality.fields.length === 0 ? (
            <p className="text-muted-foreground text-sm italic">No adjectives listed.</p>
          ) : null}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {personality.fields.map((f, i) => (
              <div key={f.id} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name={`brandPersonality.${i}.value` as const}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    personality.remove(i);
                  }}
                  disabled={isSaving}
                  aria-label="Remove adjective"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* --- Location (collapsible) --- */}
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setCollapsed((c) => ({ ...c, location: !c.location }));
            }}
            className="flex w-full items-center justify-between text-left"
          >
            <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
              Location
            </h3>
            <span className="text-muted-foreground text-xs">
              {collapsed.location ? 'Expand' : 'Collapse'}
            </span>
          </button>
          {!collapsed.location && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="location.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSaving} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSaving} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSaving} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location.isOnlineOnly"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 sm:col-span-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormLabel className="mb-0">Online only — no physical location</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          )}
        </section>

        <Separator />

        {/* --- Contact (collapsible) --- */}
        <section className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setCollapsed((c) => ({ ...c, contact: !c.contact }));
            }}
            className="flex w-full items-center justify-between text-left"
          >
            <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
              Contact
            </h3>
            <span className="text-muted-foreground text-xs">
              {collapsed.contact ? 'Expand' : 'Collapse'}
            </span>
          </button>
          {!collapsed.contact && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contact.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={isSaving} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSaving} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact.address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSaving} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </section>

        <Separator />

        {/* --- Actions --- */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" disabled={isSaving}>
                {saving === 'regenerate' ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Regenerating…
                  </>
                ) : (
                  'Regenerate from requirements'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Replace this profile?</AlertDialogTitle>
                <AlertDialogDescription>
                  Re-running the parser will overwrite your current profile (including any edits)
                  with a fresh AI-generated result. This costs one AI call.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    void onRegenerate();
                  }}
                >
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={form.handleSubmit(onSave)}
              disabled={isSaving}
            >
              {saving === 'save' ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
            {!isConfirmed ? (
              <Button type="button" onClick={form.handleSubmit(onConfirm)} disabled={isSaving}>
                {saving === 'confirm' ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  'Confirm and continue'
                )}
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </Form>
  );
}

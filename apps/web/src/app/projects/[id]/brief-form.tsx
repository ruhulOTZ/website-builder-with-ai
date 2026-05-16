'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { TYPOGRAPHY_PAIRINGS, getFontsForPairing } from '@repo/design-system';
import { DesignBriefSchema, type DesignBrief } from '@repo/shared-types';
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
import { Textarea } from '@/components/ui/textarea';
import {
  ARCHETYPE_OPTIONS,
  BUTTON_STYLE_OPTIONS,
  CARD_STYLE_OPTIONS,
  DARK_MODE_SWATCHES,
  DENSITY_OPTIONS,
  HERO_VARIANT_OPTIONS,
  IMAGERY_OPTIONS,
  LAYOUT_OPTIONS,
  MOTION_OPTIONS,
  PAGE_PRIORITY_OPTIONS,
  PALETTE_STRATEGY_OPTIONS,
  PALETTE_SWATCHES,
  RADIUS_OPTIONS,
  SHADOW_OPTIONS,
  TRAIT_LABELS,
  TYPOGRAPHY_OPTIONS,
  VOICE_OPTIONS,
} from '@/lib/brief-options';

type Status = 'BRIEF_GENERATED' | 'BRIEF_CONFIRMED';

interface Props {
  projectId: string;
  initialBrief: DesignBrief;
  status: Status;
}

// Form-internal shape. Optional fields are widened to strings (then stripped
// at submit) so react-hook-form doesn't have to juggle undefined.
const FormShape = z.object({
  brandArchetype: z.string(),
  brandArchetypeRationale: z.string(),
  traits: z.object({
    energy: z.number().int().min(1).max(5),
    formality: z.number().int().min(1).max(5),
    warmth: z.number().int().min(1).max(5),
    sophistication: z.number().int().min(1).max(5),
    trustworthiness: z.number().int().min(1).max(5),
    novelty: z.number().int().min(1).max(5),
  }),
  colorPalette: z.object({
    strategy: z.string(),
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string(),
    foreground: z.string(),
    mutedForeground: z.string(),
    border: z.string(),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
    darkMode: z.object({
      background: z.string(),
      surface: z.string(),
      foreground: z.string(),
      mutedForeground: z.string(),
      border: z.string(),
    }),
  }),
  colorPaletteRationale: z.string(),
  hasDarkMode: z.boolean(),
  typography: z.string(),
  typographyRationale: z.string(),
  layoutArchetype: z.string(),
  layoutArchetypeRationale: z.string(),
  imagery: z.string(),
  imageryRationale: z.string(),
  density: z.string(),
  radius: z.string(),
  shadow: z.string(),
  motion: z.string(),
  voice: z.string(),
  voiceRationale: z.string(),
  voiceExamples: z.object({
    headline: z.string(),
    cta: z.string(),
    microcopy: z.string(),
  }),
  componentPreferences: z.object({
    heroVariantHint: z.string(),
    cardStyleHint: z.string(),
    buttonStyleHint: z.string(),
  }),
  recommendedPages: z.array(
    z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      purpose: z.string().min(1),
      priority: z.enum(['primary', 'secondary', 'optional']),
    }),
  ),
});
type FormValues = z.infer<typeof FormShape>;

function toForm(b: DesignBrief): FormValues {
  return {
    brandArchetype: b.brandArchetype,
    brandArchetypeRationale: b.brandArchetypeRationale,
    traits: b.traits,
    colorPalette: {
      strategy: b.colorPalette.strategy,
      primary: b.colorPalette.primary,
      secondary: b.colorPalette.secondary,
      accent: b.colorPalette.accent,
      background: b.colorPalette.background,
      surface: b.colorPalette.surface,
      foreground: b.colorPalette.foreground,
      mutedForeground: b.colorPalette.mutedForeground,
      border: b.colorPalette.border,
      success: b.colorPalette.success,
      warning: b.colorPalette.warning,
      danger: b.colorPalette.danger,
      darkMode: {
        background: b.colorPalette.darkMode?.background ?? '',
        surface: b.colorPalette.darkMode?.surface ?? '',
        foreground: b.colorPalette.darkMode?.foreground ?? '',
        mutedForeground: b.colorPalette.darkMode?.mutedForeground ?? '',
        border: b.colorPalette.darkMode?.border ?? '',
      },
    },
    colorPaletteRationale: b.colorPaletteRationale,
    hasDarkMode: b.colorPalette.darkMode !== undefined,
    typography: b.typography,
    typographyRationale: b.typographyRationale,
    layoutArchetype: b.layoutArchetype,
    layoutArchetypeRationale: b.layoutArchetypeRationale,
    imagery: b.imagery,
    imageryRationale: b.imageryRationale,
    density: b.density,
    radius: b.radius,
    shadow: b.shadow,
    motion: b.motion,
    voice: b.voice,
    voiceRationale: b.voiceRationale,
    voiceExamples: {
      headline: b.voiceExamples?.headline ?? '',
      cta: b.voiceExamples?.cta ?? '',
      microcopy: b.voiceExamples?.microcopy ?? '',
    },
    componentPreferences: {
      heroVariantHint: b.componentPreferences.heroVariantHint ?? '',
      cardStyleHint: b.componentPreferences.cardStyleHint ?? '',
      buttonStyleHint: b.componentPreferences.buttonStyleHint ?? '',
    },
    recommendedPages: b.recommendedPages,
  };
}

function toSubmit(v: FormValues, profile: DesignBrief['businessProfile']): DesignBrief {
  const palette: DesignBrief['colorPalette'] = {
    strategy: v.colorPalette.strategy as DesignBrief['colorPalette']['strategy'],
    primary: v.colorPalette.primary.trim(),
    secondary: v.colorPalette.secondary.trim(),
    accent: v.colorPalette.accent.trim(),
    background: v.colorPalette.background.trim(),
    surface: v.colorPalette.surface.trim(),
    foreground: v.colorPalette.foreground.trim(),
    mutedForeground: v.colorPalette.mutedForeground.trim(),
    border: v.colorPalette.border.trim(),
    success: v.colorPalette.success.trim(),
    warning: v.colorPalette.warning.trim(),
    danger: v.colorPalette.danger.trim(),
  };
  if (v.hasDarkMode) {
    const dm = v.colorPalette.darkMode;
    palette.darkMode = {
      background: dm.background.trim(),
      surface: dm.surface.trim(),
      foreground: dm.foreground.trim(),
      mutedForeground: dm.mutedForeground.trim(),
      border: dm.border.trim(),
    };
  }

  const voiceExamples: DesignBrief['voiceExamples'] = {};
  if (v.voiceExamples.headline.trim() !== '')
    voiceExamples.headline = v.voiceExamples.headline.trim();
  if (v.voiceExamples.cta.trim() !== '') voiceExamples.cta = v.voiceExamples.cta.trim();
  if (v.voiceExamples.microcopy.trim() !== '')
    voiceExamples.microcopy = v.voiceExamples.microcopy.trim();

  const componentPreferences: DesignBrief['componentPreferences'] = {};
  if (v.componentPreferences.heroVariantHint !== '') {
    componentPreferences.heroVariantHint = v.componentPreferences.heroVariantHint as NonNullable<
      DesignBrief['componentPreferences']['heroVariantHint']
    >;
  }
  if (v.componentPreferences.cardStyleHint !== '') {
    componentPreferences.cardStyleHint = v.componentPreferences.cardStyleHint as NonNullable<
      DesignBrief['componentPreferences']['cardStyleHint']
    >;
  }
  if (v.componentPreferences.buttonStyleHint !== '') {
    componentPreferences.buttonStyleHint = v.componentPreferences.buttonStyleHint as NonNullable<
      DesignBrief['componentPreferences']['buttonStyleHint']
    >;
  }

  const out: DesignBrief = {
    schemaVersion: 1,
    businessProfile: profile,
    brandArchetype: v.brandArchetype as DesignBrief['brandArchetype'],
    brandArchetypeRationale: v.brandArchetypeRationale.trim(),
    traits: v.traits,
    colorPalette: palette,
    colorPaletteRationale: v.colorPaletteRationale.trim(),
    typography: v.typography as DesignBrief['typography'],
    typographyRationale: v.typographyRationale.trim(),
    layoutArchetype: v.layoutArchetype as DesignBrief['layoutArchetype'],
    layoutArchetypeRationale: v.layoutArchetypeRationale.trim(),
    imagery: v.imagery as DesignBrief['imagery'],
    imageryRationale: v.imageryRationale.trim(),
    density: v.density as DesignBrief['density'],
    radius: v.radius as DesignBrief['radius'],
    shadow: v.shadow as DesignBrief['shadow'],
    motion: v.motion as DesignBrief['motion'],
    voice: v.voice as DesignBrief['voice'],
    voiceRationale: v.voiceRationale.trim(),
    componentPreferences,
    recommendedPages: v.recommendedPages.map((p) => ({
      slug: p.slug.trim(),
      title: p.title.trim(),
      purpose: p.purpose.trim(),
      priority: p.priority,
    })),
  };
  if (Object.keys(voiceExamples).length > 0) {
    out.voiceExamples = voiceExamples;
  }
  // Run through the canonical schema once at the boundary to catch any drift.
  return DesignBriefSchema.parse(out);
}

// 1–5 dot scale, click to set. Used per trait. Keyboard fallback via the
// hidden number input below the dots.
function TraitDots({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          aria-label={`Set value to ${String(n)}`}
          onClick={() => {
            onChange(n);
          }}
          className={
            'size-5 rounded-full border transition-colors ' +
            (n <= value
              ? 'bg-foreground border-foreground'
              : 'border-muted-foreground/30 hover:border-foreground/60 bg-transparent')
          }
        />
      ))}
      <span className="text-muted-foreground ml-2 text-xs tabular-nums">{value} / 5</span>
    </div>
  );
}

export function BriefForm({ projectId, initialBrief, status }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState<'save' | 'confirm' | 'regenerate' | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormShape),
    defaultValues: toForm(initialBrief),
  });

  const pages = useFieldArray({ control: form.control, name: 'recommendedPages' });
  const hasDarkMode = form.watch('hasDarkMode');
  const currentTypography = form.watch('typography');
  const palette = form.watch('colorPalette');

  async function patchBrief(body: Record<string, unknown>): Promise<boolean> {
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
    try {
      const merged = toSubmit(values, initialBrief.businessProfile);
      const ok = await patchBrief({ designBriefJson: merged });
      if (ok) {
        toast.success('Brief saved');
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Validation failed');
    }
    setSaving(null);
  }

  async function onConfirm(values: FormValues): Promise<void> {
    setSaving('confirm');
    try {
      const merged = toSubmit(values, initialBrief.businessProfile);
      const ok = await patchBrief({ designBriefJson: merged, confirmBrief: true });
      if (ok) {
        toast.success('Brief confirmed');
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Validation failed');
    }
    setSaving(null);
  }

  async function onRegenerate(): Promise<void> {
    setSaving('regenerate');
    try {
      const res = await fetch(`/api/projects/${projectId}/brief`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? `Regenerate failed (${String(res.status)})`);
        return;
      }
      toast.success('Brief regenerated');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(null);
    }
  }

  const isConfirmed = status === 'BRIEF_CONFIRMED';
  const isSaving = saving !== null;

  // Typography preview uses the design-system's getFontsForPairing() so the
  // font-family resolves to `var(--font-*)` references — next/font has the
  // actual @font-face under those variables. The fonts themselves are loaded
  // at the root layout via getAllFontVariables(). The preview renders in the
  // chosen pairing's actual fonts (Bebas Neue, Fraunces, etc.), not a fallback.
  type Pairing = keyof typeof TYPOGRAPHY_PAIRINGS;
  const isValidPairing = (v: string): v is Pairing => v in TYPOGRAPHY_PAIRINGS;
  const typographyConfig = isValidPairing(currentTypography)
    ? TYPOGRAPHY_PAIRINGS[currentTypography]
    : null;
  const typographyFonts = isValidPairing(currentTypography)
    ? getFontsForPairing(currentTypography)
    : null;

  return (
    <Form {...form}>
      <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
        {/* --- Brand archetype --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Brand archetype
          </h3>
          <div className="bg-foreground text-background inline-flex items-center rounded-md px-4 py-2 text-base font-semibold uppercase tracking-wide">
            {form.watch('brandArchetype')}
          </div>
          <FormField
            control={form.control}
            name="brandArchetype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Archetype</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ARCHETYPE_OPTIONS.map((o) => (
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
            name="brandArchetypeRationale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rationale</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* --- Traits --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Traits
          </h3>
          <div className="space-y-3">
            {TRAIT_LABELS.map((t) => (
              <FormField
                key={t.key}
                control={form.control}
                name={`traits.${t.key}` as const}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-[160px]">
                        <FormLabel className="mb-0">{t.label}</FormLabel>
                        <div className="text-muted-foreground text-xs">
                          {t.low} ↔ {t.high}
                        </div>
                      </div>
                      <FormControl>
                        <TraitDots
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSaving}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </section>

        <Separator />

        {/* --- Color palette --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Color palette
          </h3>
          <FormField
            control={form.control}
            name="colorPalette.strategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strategy</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PALETTE_STRATEGY_OPTIONS.map((o) => (
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {PALETTE_SWATCHES.map((s) => (
              <FormField
                key={s.key}
                control={form.control}
                name={`colorPalette.${s.key}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">{s.label}</FormLabel>
                    <div
                      className="h-16 w-full rounded-md border"
                      style={{ background: palette[s.key] }}
                      aria-label={`${s.label} preview`}
                    />
                    <FormControl>
                      <Input {...field} disabled={isSaving} className="font-mono text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <FormField
            control={form.control}
            name="colorPaletteRationale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rationale</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel className="mb-0">Dark mode</FormLabel>
              <FormField
                control={form.control}
                name="hasDarkMode"
                render={({ field }) => (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => {
                      field.onChange(!field.value);
                    }}
                  >
                    {field.value ? 'Remove dark mode' : 'Add dark mode'}
                  </Button>
                )}
              />
            </div>
            {hasDarkMode && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {DARK_MODE_SWATCHES.map((s) => (
                  <FormField
                    key={s.key}
                    control={form.control}
                    name={`colorPalette.darkMode.${s.key}` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">{s.label}</FormLabel>
                        <div
                          className="h-12 w-full rounded-md border"
                          style={{ background: palette.darkMode[s.key] }}
                          aria-label={`${s.label} preview`}
                        />
                        <FormControl>
                          <Input {...field} disabled={isSaving} className="font-mono text-xs" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* --- Typography --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Typography
          </h3>
          <FormField
            control={form.control}
            name="typography"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pairing</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TYPOGRAPHY_OPTIONS.map((o) => (
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
          {typographyConfig !== null && typographyFonts !== null && (
            <div className="bg-muted/30 rounded-md border p-5">
              <div className="text-3xl" style={{ fontFamily: typographyFonts.cssFamilies.heading }}>
                The brief in action.
              </div>
              <div
                className="text-muted-foreground mt-2 text-sm"
                style={{ fontFamily: typographyFonts.cssFamilies.body }}
              >
                Body copy renders in the chosen pairing&apos;s body font. Heading:{' '}
                {typographyConfig.googleFonts[0] ?? '—'} · Body:{' '}
                {typographyConfig.googleFonts[1] ?? typographyConfig.googleFonts[0] ?? '—'}.
              </div>
            </div>
          )}
          <FormField
            control={form.control}
            name="typographyRationale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rationale</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* --- Layout --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Layout
          </h3>
          <FormField
            control={form.control}
            name="layoutArchetype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Archetype</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LAYOUT_OPTIONS.map((o) => (
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
            name="layoutArchetypeRationale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rationale</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* --- Imagery --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Imagery
          </h3>
          <FormField
            control={form.control}
            name="imagery"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Direction</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {IMAGERY_OPTIONS.map((o) => (
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
            name="imageryRationale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rationale</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* --- Style tokens --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Style tokens
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="density"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Density</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DENSITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="radius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Radius</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shadow"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shadow</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SHADOW_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motion</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOTION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator />

        {/* --- Voice --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Voice
          </h3>
          <FormField
            control={form.control}
            name="voice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tone</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VOICE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="voiceRationale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rationale</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} disabled={isSaving} />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="bg-muted/30 space-y-3 rounded-md border p-4">
            <FormDescription className="mb-1">
              Voice examples (optional) — seeds for the content generator.
            </FormDescription>
            <FormField
              control={form.control}
              name="voiceExamples.headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Headline</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSaving} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="voiceExamples.cta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">CTA</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSaving} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="voiceExamples.microcopy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Microcopy</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSaving} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator />

        {/* --- Component preferences --- */}
        <section className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            Component preferences
          </h3>
          <FormDescription>
            Soft hints for downstream stages. Use Clear to remove a hint.
          </FormDescription>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="componentPreferences.heroVariantHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Hero variant</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="(none)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {HERO_VARIANT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value !== '' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          field.onChange('');
                        }}
                        disabled={isSaving}
                        aria-label="Clear hero variant"
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="componentPreferences.cardStyleHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Card style</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="(none)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CARD_STYLE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value !== '' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          field.onChange('');
                        }}
                        disabled={isSaving}
                        aria-label="Clear card style"
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="componentPreferences.buttonStyleHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Button style</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="(none)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUTTON_STYLE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value !== '' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          field.onChange('');
                        }}
                        disabled={isSaving}
                        aria-label="Clear button style"
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator />

        {/* --- Recommended pages --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
              Recommended pages
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                pages.append({ slug: '', title: '', purpose: '', priority: 'secondary' });
              }}
              disabled={isSaving}
            >
              + Add page
            </Button>
          </div>
          {pages.fields.map((f, i) => (
            <div key={f.id} className="bg-muted/30 space-y-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground text-xs">Page {String(i + 1)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    pages.remove(i);
                  }}
                  disabled={isSaving}
                  aria-label="Remove page"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_minmax(140px,_auto)]">
                <FormField
                  control={form.control}
                  name={`recommendedPages.${i}.slug` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Slug</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono text-xs" disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`recommendedPages.${i}.title` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Title</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`recommendedPages.${i}.priority` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Priority</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSaving}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAGE_PRIORITY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`recommendedPages.${i}.purpose` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Purpose</FormLabel>
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
                  'Regenerate brief'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Replace this brief?</AlertDialogTitle>
                <AlertDialogDescription>
                  Re-running the generator will overwrite your current brief (including any edits)
                  with a fresh AI-generated result. Status returns to{' '}
                  <span className="font-medium">Brief generated</span> — you&apos;ll need to
                  re-confirm. Costs one AI call.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    // Set spinner state synchronously before the dialog
                    // starts its close animation — eliminates the unmount-
                    // vs-mount flash on fast networks.
                    setSaving('regenerate');
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

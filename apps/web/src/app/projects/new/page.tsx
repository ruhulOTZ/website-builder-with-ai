'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { Textarea } from '@/components/ui/textarea';

// Mirror of CreateProjectSchema in apps/web/src/app/api/projects/_schemas.ts.
// Kept in sync manually; if a third callsite appears we lift to a shared module.
const FormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(80, 'Name must be 80 characters or fewer'),
  rawRequirements: z
    .string()
    .trim()
    .min(50, 'Tell us at least a sentence or two about the website (min 50 characters)')
    .max(50_000, 'Description is too long (max 50,000 characters)'),
});
type FormValues = z.infer<typeof FormSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', rawRequirements: '' },
  });

  async function onSubmit(values: FormValues): Promise<void> {
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? `Create failed (${String(res.status)})`);
        setSubmitting(false);
        return;
      }
      const { id } = (await res.json()) as { id: string };
      // Jump straight to the auto-pipeline page. It picks up the project at
      // REQUIREMENTS_SUBMITTED (set by the API in the same insert) and runs
      // parse → confirm → brief → confirm → home-page → redirect to render.
      router.push(`/projects/${id}/generating`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Generate website using AI</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Give your project a name and describe the business. We&apos;ll handle the rest.
        </p>
      </header>
      <hr className="mb-8" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Iron Halo Gym"
                    disabled={submitting}
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rawRequirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe your website</FormLabel>
                <FormControl>
                  <Textarea
                    rows={10}
                    placeholder="A boutique strength gym in Portland, Oregon. We specialize in 1:1 coaching and small-group strength training for adults 35+. Our voice is direct and supportive — no hype, no jargon. Pages we need: home, programs, coaches, schedule, contact."
                    disabled={submitting}
                    className="resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Cover what the business does, who it serves, brand voice, and any specific
                  services or pages you want. The more you give us, the better the result.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button variant="ghost" asChild>
              <Link href="/projects">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting} size="lg">
              {submitting ? 'Starting…' : 'Continue'}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}

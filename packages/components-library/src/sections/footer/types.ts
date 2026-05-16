import { type FooterSectionSchema } from '@repo/shared-types';
import { type z } from 'zod';

export type FooterSection = z.infer<typeof FooterSectionSchema>;
export type FooterVariant = FooterSection['variant'];
export type FooterData = FooterSection['props'];

import { type HeroSectionSchema } from '@repo/shared-types';
import { type z } from 'zod';

export type HeroSection = z.infer<typeof HeroSectionSchema>;
export type HeroVariant = HeroSection['variant'];
export type HeroData = HeroSection['props'];

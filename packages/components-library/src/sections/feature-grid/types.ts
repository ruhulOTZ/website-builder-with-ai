import { type FeatureGridSectionSchema } from '@repo/shared-types';
import { type z } from 'zod';

export type FeatureGridSection = z.infer<typeof FeatureGridSectionSchema>;
export type FeatureGridVariant = FeatureGridSection['variant'];
export type FeatureGridData = FeatureGridSection['props'];

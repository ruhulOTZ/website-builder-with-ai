import { type HeaderSectionSchema } from '@repo/shared-types';
import { type z } from 'zod';

export type HeaderSection = z.infer<typeof HeaderSectionSchema>;
export type HeaderVariant = HeaderSection['variant'];
export type HeaderData = HeaderSection['props'];

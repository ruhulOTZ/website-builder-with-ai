import { type TypographyPairing } from '@repo/shared-types';
import { type z } from 'zod';

type Pairing = z.infer<typeof TypographyPairing>;

export interface TypographyPairingConfig {
  headingFamily: string;
  bodyFamily: string;
  /** Display names of Google Fonts to load (e.g. "Bebas Neue", "Open Sans"). */
  googleFonts: string[];
  /** Weights to load per Google Font name. */
  weights: Record<string, number[]>;
}

const SANS_FALLBACK = 'system-ui, sans-serif';
const SERIF_FALLBACK = 'Georgia, serif';

// NOTE on `general_sans_only`: General Sans is published by Indian Type Foundry on
// Fontshare and is not available on Google Fonts. `next/font/google` cannot load it.
// We substitute Plus Jakarta Sans, which has a comparable modern-grotesk personality.
// If we later want true General Sans, we'll need to self-host via `next/font/local`.
export const TYPOGRAPHY_PAIRINGS: Record<Pairing, TypographyPairingConfig> = {
  bebas_inter: {
    headingFamily: `"Bebas Neue", ${SANS_FALLBACK}`,
    bodyFamily: `Inter, ${SANS_FALLBACK}`,
    googleFonts: ['Bebas Neue', 'Inter'],
    weights: { 'Bebas Neue': [400], Inter: [400, 500, 600, 700] },
  },
  playfair_lato: {
    headingFamily: `"Playfair Display", ${SERIF_FALLBACK}`,
    bodyFamily: `Lato, ${SANS_FALLBACK}`,
    googleFonts: ['Playfair Display', 'Lato'],
    weights: { 'Playfair Display': [400, 700, 900], Lato: [400, 700] },
  },
  space_grotesk_dm_sans: {
    headingFamily: `"Space Grotesk", ${SANS_FALLBACK}`,
    bodyFamily: `"DM Sans", ${SANS_FALLBACK}`,
    googleFonts: ['Space Grotesk', 'DM Sans'],
    weights: { 'Space Grotesk': [500, 700], 'DM Sans': [400, 500, 700] },
  },
  fraunces_inter: {
    headingFamily: `Fraunces, ${SERIF_FALLBACK}`,
    bodyFamily: `Inter, ${SANS_FALLBACK}`,
    googleFonts: ['Fraunces', 'Inter'],
    weights: { Fraunces: [400, 600, 900], Inter: [400, 500, 600, 700] },
  },
  archivo_inter: {
    headingFamily: `Archivo, ${SANS_FALLBACK}`,
    bodyFamily: `Inter, ${SANS_FALLBACK}`,
    googleFonts: ['Archivo', 'Inter'],
    weights: { Archivo: [600, 800], Inter: [400, 500, 600, 700] },
  },
  manrope_only: {
    headingFamily: `Manrope, ${SANS_FALLBACK}`,
    bodyFamily: `Manrope, ${SANS_FALLBACK}`,
    googleFonts: ['Manrope'],
    weights: { Manrope: [400, 500, 700, 800] },
  },
  instrument_serif_geist: {
    headingFamily: `"Instrument Serif", ${SERIF_FALLBACK}`,
    bodyFamily: `Geist, ${SANS_FALLBACK}`,
    googleFonts: ['Instrument Serif', 'Geist'],
    weights: { 'Instrument Serif': [400], Geist: [400, 500, 600, 700] },
  },
  syne_inter: {
    headingFamily: `Syne, ${SANS_FALLBACK}`,
    bodyFamily: `Inter, ${SANS_FALLBACK}`,
    googleFonts: ['Syne', 'Inter'],
    weights: { Syne: [600, 800], Inter: [400, 500, 600, 700] },
  },
  dm_serif_dm_sans: {
    headingFamily: `"DM Serif Display", ${SERIF_FALLBACK}`,
    bodyFamily: `"DM Sans", ${SANS_FALLBACK}`,
    googleFonts: ['DM Serif Display', 'DM Sans'],
    weights: { 'DM Serif Display': [400], 'DM Sans': [400, 500, 700] },
  },
  ibm_plex_only: {
    headingFamily: `"IBM Plex Sans", ${SANS_FALLBACK}`,
    bodyFamily: `"IBM Plex Sans", ${SANS_FALLBACK}`,
    googleFonts: ['IBM Plex Sans'],
    weights: { 'IBM Plex Sans': [400, 500, 600, 700] },
  },
  general_sans_only: {
    // Substituting Plus Jakarta Sans (Google Fonts) for General Sans (Fontshare-only).
    headingFamily: `"Plus Jakarta Sans", ${SANS_FALLBACK}`,
    bodyFamily: `"Plus Jakarta Sans", ${SANS_FALLBACK}`,
    googleFonts: ['Plus Jakarta Sans'],
    weights: { 'Plus Jakarta Sans': [400, 500, 700, 800] },
  },
  cormorant_montserrat: {
    headingFamily: `Cormorant, ${SERIF_FALLBACK}`,
    bodyFamily: `Montserrat, ${SANS_FALLBACK}`,
    googleFonts: ['Cormorant', 'Montserrat'],
    weights: { Cormorant: [400, 500, 700], Montserrat: [400, 500, 700] },
  },
  anton_open_sans: {
    headingFamily: `Anton, ${SANS_FALLBACK}`,
    bodyFamily: `"Open Sans", ${SANS_FALLBACK}`,
    googleFonts: ['Anton', 'Open Sans'],
    weights: { Anton: [400], 'Open Sans': [400, 600, 700] },
  },
  outfit_only: {
    headingFamily: `Outfit, ${SANS_FALLBACK}`,
    bodyFamily: `Outfit, ${SANS_FALLBACK}`,
    googleFonts: ['Outfit'],
    weights: { Outfit: [400, 500, 700, 800] },
  },
  epilogue_only: {
    headingFamily: `Epilogue, ${SANS_FALLBACK}`,
    bodyFamily: `Epilogue, ${SANS_FALLBACK}`,
    googleFonts: ['Epilogue'],
    weights: { Epilogue: [400, 500, 700, 800] },
  },
};

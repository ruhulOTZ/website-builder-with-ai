// fonts.ts — next/font/google integration for design-system typography pairings.
//
// next/font/google requires every font to be instantiated at module top-level with
// a literal options object. Dynamic font loading is impossible. So we pre-instantiate
// every Google Font referenced by any TypographyPairing, and `getFontsForPairing`
// just selects the relevant variable classNames + CSS family strings at runtime.
//
// Tree-shaking note: next/font ships the CSS for a font only if its `.variable` or
// `.className` is actually used somewhere in the rendered output. Pre-instantiating
// here does not bloat the bundle for pages that don't reference the font.

import { type TypographyPairing } from '@repo/shared-types';
import {
  Anton,
  Archivo,
  Bebas_Neue,
  Cormorant,
  DM_Sans,
  DM_Serif_Display,
  Epilogue,
  Fraunces,
  Geist,
  IBM_Plex_Sans,
  Instrument_Serif,
  Inter,
  Lato,
  Manrope,
  Montserrat,
  Open_Sans,
  Outfit,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Syne,
} from 'next/font/google';
import { type z } from 'zod';

import { TYPOGRAPHY_PAIRINGS } from './typography';

type Pairing = z.infer<typeof TypographyPairing>;

interface FontInstance {
  /** className that activates this font's CSS variable on a wrapping element. */
  variable: string;
  /** CSS font-family value referencing the variable, with a sensible fallback. */
  family: string;
}

const SANS = 'system-ui, sans-serif';
const SERIF = 'Georgia, serif';

// --- Static next/font instantiations ----------------------------------------

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-anton',
  display: 'swap',
});
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['600', '800'],
  variable: '--font-archivo',
  display: 'swap',
});
const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas-neue',
  display: 'swap',
});
const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});
const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-serif-display',
  display: 'swap',
});
const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-epilogue',
  display: 'swap',
});
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '900'],
  variable: '--font-fraunces',
  display: 'swap',
});
const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-instrument-serif',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  display: 'swap',
});
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});
const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
});
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair-display',
  display: 'swap',
});
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});
const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '800'],
  variable: '--font-syne',
  display: 'swap',
});

// --- Lookup: Google Font display name → instance + family string -------------

const FONTS: Record<string, FontInstance> = {
  Anton: { variable: anton.variable, family: `var(--font-anton), ${SANS}` },
  Archivo: { variable: archivo.variable, family: `var(--font-archivo), ${SANS}` },
  'Bebas Neue': { variable: bebasNeue.variable, family: `var(--font-bebas-neue), ${SANS}` },
  Cormorant: { variable: cormorant.variable, family: `var(--font-cormorant), ${SERIF}` },
  'DM Sans': { variable: dmSans.variable, family: `var(--font-dm-sans), ${SANS}` },
  'DM Serif Display': {
    variable: dmSerifDisplay.variable,
    family: `var(--font-dm-serif-display), ${SERIF}`,
  },
  Epilogue: { variable: epilogue.variable, family: `var(--font-epilogue), ${SANS}` },
  Fraunces: { variable: fraunces.variable, family: `var(--font-fraunces), ${SERIF}` },
  Geist: { variable: geist.variable, family: `var(--font-geist), ${SANS}` },
  'IBM Plex Sans': {
    variable: ibmPlexSans.variable,
    family: `var(--font-ibm-plex-sans), ${SANS}`,
  },
  'Instrument Serif': {
    variable: instrumentSerif.variable,
    family: `var(--font-instrument-serif), ${SERIF}`,
  },
  Inter: { variable: inter.variable, family: `var(--font-inter), ${SANS}` },
  Lato: { variable: lato.variable, family: `var(--font-lato), ${SANS}` },
  Manrope: { variable: manrope.variable, family: `var(--font-manrope), ${SANS}` },
  Montserrat: { variable: montserrat.variable, family: `var(--font-montserrat), ${SANS}` },
  'Open Sans': { variable: openSans.variable, family: `var(--font-open-sans), ${SANS}` },
  Outfit: { variable: outfit.variable, family: `var(--font-outfit), ${SANS}` },
  'Playfair Display': {
    variable: playfairDisplay.variable,
    family: `var(--font-playfair-display), ${SERIF}`,
  },
  'Plus Jakarta Sans': {
    variable: plusJakartaSans.variable,
    family: `var(--font-plus-jakarta-sans), ${SANS}`,
  },
  'Space Grotesk': {
    variable: spaceGrotesk.variable,
    family: `var(--font-space-grotesk), ${SANS}`,
  },
  Syne: { variable: syne.variable, family: `var(--font-syne), ${SANS}` },
};

// --- Public API --------------------------------------------------------------

export interface FontsForPairing {
  /**
   * Whitespace-separated CSS className string containing every font variable used
   * by the pairing. Apply this to a wrapping element (e.g. `<html>` or a `<div>`)
   * so the `--font-*` custom properties become available to descendants.
   */
  variables: string;
  /** CSS font-family values for heading and body, referencing the variables. */
  cssFamilies: { heading: string; body: string };
}

export function getFontsForPairing(pairing: Pairing): FontsForPairing {
  const config = TYPOGRAPHY_PAIRINGS[pairing];
  const headingFontName = config.googleFonts[0];
  const bodyFontName = config.googleFonts[1] ?? config.googleFonts[0];

  if (headingFontName === undefined || bodyFontName === undefined) {
    throw new Error(`Pairing "${pairing}" declares no Google fonts.`);
  }

  const headingFont = FONTS[headingFontName];
  const bodyFont = FONTS[bodyFontName];

  if (!headingFont || !bodyFont) {
    throw new Error(
      `Pairing "${pairing}" references an un-instantiated font ("${headingFontName}" / "${bodyFontName}").`,
    );
  }

  const variables =
    headingFont.variable === bodyFont.variable
      ? headingFont.variable
      : `${headingFont.variable} ${bodyFont.variable}`;

  return {
    variables,
    cssFamilies: { heading: headingFont.family, body: bodyFont.family },
  };
}

/**
 * Returns a className string activating every font variable in the system.
 * Useful for the root layout when pages may render any pairing.
 */
export function getAllFontVariables(): string {
  return Object.values(FONTS)
    .map((f) => f.variable)
    .join(' ');
}

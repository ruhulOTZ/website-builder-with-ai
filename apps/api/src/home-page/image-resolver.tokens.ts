/**
 * DI token for the home-page module's image resolver. The factory in
 * home-page.module.ts decides between createUnsplashResolver (when
 * UNSPLASH_ACCESS_KEY is configured) and noopResolver (when it isn't).
 */
export const IMAGE_RESOLVER = Symbol('IMAGE_RESOLVER');

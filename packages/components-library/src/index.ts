// Generated-site sections.
export * from './sections/header';
export * from './sections/hero';
export * from './sections/feature-grid';
export * from './sections/footer';

// Renderer.
export { SiteRenderer } from './render/SiteRenderer';
export { PageRenderer } from './render/PageRenderer';
export { SectionRenderer } from './render/SectionRenderer';
export { UnknownSection } from './render/UnknownSection';
export { SECTION_REGISTRY, type SectionRegistry } from './render/section-registry';

// Shared primitives — exported so apps/web can render outside a section context
// (e.g. when composing a custom block) and so showcases can mix primitives.
export { Cta } from './shared/Cta';
export { Icon } from './shared/Icon';
export { Image } from './shared/Image';
export { Logo } from './shared/Logo';
export { NewsletterForm } from './shared/NewsletterForm';

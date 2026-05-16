export interface UnknownSectionProps {
  sectionType: string;
  sectionId: string;
}

/**
 * Fallback for section types that aren't registered in section-registry.ts
 * (either because they're not yet implemented, or because the schema added
 * a new type and the registry hasn't been updated).
 *
 * Development: renders a visible, alarming block so the gap is obvious.
 * Production: warns once to console and renders nothing — generated sites
 * should never ship with unrenderable sections, but we don't want the page
 * to break either.
 */
export function UnknownSection({ sectionType, sectionId }: UnknownSectionProps) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      `[components-library] Unknown section type "${sectionType}" (id=${sectionId}). Skipping.`,
    );
    return null;
  }
  return (
    <div className="border-danger/50 bg-danger/5 text-danger m-8 rounded-[var(--radius)] border-2 border-dashed p-6">
      <p className="font-heading font-semibold">Unknown section type: {sectionType}</p>
      <p className="font-body text-sm opacity-70">Section ID: {sectionId}</p>
      <p className="font-body mt-2 text-xs">
        Not yet implemented in the component library, or not registered in section-registry.ts.
      </p>
    </div>
  );
}

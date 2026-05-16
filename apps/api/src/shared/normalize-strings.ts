/**
 * Normalize all string fields in an arbitrary object tree:
 * - Collapse runs of whitespace (including embedded newlines) to a single space.
 * - Trim leading/trailing whitespace.
 *
 * Rationale: Gemini occasionally returns strings with embedded \n characters
 * from line breaks in source documents. This is a mechanical hygiene step,
 * not a prompt rule (the prompt should focus on semantic correctness).
 *
 * Used by both the BusinessProfileParserService (parse-v2 onward) and the
 * DesignBriefGeneratorService (brief-v1 onward).
 */
export function normalizeStrings<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim() as T;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeStrings) as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = normalizeStrings(v);
    }
    return out as T;
  }
  return value;
}

// Minimal className combiner. We deliberately avoid clsx/tailwind-merge to keep
// the component library zero-dependency beyond React + lucide. Generated-site
// components rarely need conditional class merging; when they do, callers can
// build the string themselves.
export function cn(...args: (string | false | null | undefined)[]): string {
  return args.filter((x): x is string => Boolean(x)).join(' ');
}

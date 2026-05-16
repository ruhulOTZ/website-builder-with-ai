// Re-export shim so `@repo/database/nest` resolves under TypeScript's
// classic `moduleResolution: node` (used by nest build for CJS emit).
// The package.json `exports` map handles all other resolution settings
// (`bundler`, `node16`, `nodenext`) — this file just covers classic.
export * from './src/nest';

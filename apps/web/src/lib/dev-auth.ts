// Dev-time auth stub. Phase 2.5 replaces this with `auth()` from
// `@clerk/nextjs/server` and a middleware-enforced sign-in flow.
//
// Until then, every request is treated as coming from a single hard-coded
// development user. This is consistent with the API's parser controller,
// which is gated behind `NODE_ENV !== 'production'` instead of real auth.
// In production this code path is unreachable — Phase 2.5 lands before the
// app ships behind a public URL.
//
// Swap surface for Phase 2.5:
//   import { auth } from '@clerk/nextjs/server';
//   const { userId } = await auth();
//   if (!userId) return new Response('Unauthorized', { status: 401 });

const DEV_USER_ID = 'dev-user-stub';

export interface AuthResult {
  userId: string;
}

/**
 * Returns the current user's ID for API route handlers and server components.
 * In dev: a hard-coded stub so the route handlers can persist owner-scoped
 * rows. In Phase 2.5: real Clerk session lookup with redirect-on-unauth.
 */
export function requireUserId(): AuthResult {
  if (process.env.NODE_ENV === 'production') {
    // Defense in depth — Phase 2.5 must land before any prod deploy.
    throw new Error('auth stub reached in production; Phase 2.5 (Clerk wiring) must land first');
  }
  return { userId: DEV_USER_ID };
}

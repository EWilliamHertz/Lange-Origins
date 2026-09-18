/**
 * Server-authoritative identity (roadmap Phase 1, item 1).
 *
 * Identity always comes from a verified Firebase ID token — never from
 * client-supplied fields. The module is split into pure functions (tested in
 * tests/serverAuth.test.ts) and a thin authenticator that server.ts wires to
 * firebase-admin's `verifyIdToken`.
 */

export interface VerifiedClaims {
  uid: string;
  email?: string;
  email_verified?: boolean;
  admin?: unknown;
  [key: string]: unknown;
}

export interface SocketIdentity {
  uid: string;
  email?: string;
  isAdmin: boolean;
}

export type TokenVerifier = (token: string) => Promise<VerifiedClaims>;

/** Accounts allowed to administer the game even without a custom claim. */
export const DEFAULT_ADMIN_EMAILS: readonly string[] = [
  'ewilliamhe@gmail.com',
  'zudran@gmail.com',
];

/**
 * Decide whether verified claims grant admin rights. Admin means either the
 * `admin` custom claim is literally true, or the *verified* email is on the
 * allowlist. Unverified emails never grant anything.
 */
export function isAdminClaims(
  claims: { admin?: unknown; email?: string; email_verified?: boolean; [key: string]: unknown },
  adminEmails: readonly string[] = DEFAULT_ADMIN_EMAILS,
): boolean {
  if (claims.admin === true) return true;
  if (claims.email_verified !== true || typeof claims.email !== 'string') return false;
  return adminEmails.includes(claims.email.toLowerCase());
}

export interface AuthenticatorOptions {
  verifyIdToken: TokenVerifier;
  adminEmails?: readonly string[];
}

export interface Authenticator {
  /** Verify a token; resolves to an identity or rejects when invalid. */
  authenticate(token: string): Promise<SocketIdentity>;
  /** Verify a token but resolve to null instead of rejecting. */
  tryAuthenticate(token: string): Promise<SocketIdentity | null>;
}

export function createAuthenticator(options: AuthenticatorOptions): Authenticator {
  const adminEmails = options.adminEmails ?? DEFAULT_ADMIN_EMAILS;
  return {
    async authenticate(token: string): Promise<SocketIdentity> {
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error('missing token');
      }
      const claims = await options.verifyIdToken(token);
      if (!claims || typeof claims.uid !== 'string' || claims.uid.length === 0) {
        throw new Error('token missing uid');
      }
      return {
        uid: claims.uid,
        email: typeof claims.email === 'string' ? claims.email : undefined,
        isAdmin: isAdminClaims(claims, adminEmails),
      };
    },
    async tryAuthenticate(token: string): Promise<SocketIdentity | null> {
      try {
        return await this.authenticate(token);
      } catch {
        return null;
      }
    },
  };
}

/** Pull the bearer token out of an Authorization header, if present. */
export function extractBearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string') return null;
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1].trim() : null;
}

/** Parse ADMIN_EMAILS env overrides into a lowercase allowlist. */
export function adminEmailsFromEnv(envValue: string | undefined): string[] {
  const list = (envValue || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s.includes('@'));
  return [...new Set([...DEFAULT_ADMIN_EMAILS, ...list])];
}

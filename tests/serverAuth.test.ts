import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ADMIN_EMAILS,
  adminEmailsFromEnv,
  createAuthenticator,
  extractBearerToken,
  isAdminClaims,
} from '../src/server/auth';

describe('isAdminClaims', () => {
  it('grants admin for the literal admin custom claim', () => {
    expect(isAdminClaims({ uid: 'u', admin: true })).toBe(true);
    expect(isAdminClaims({ uid: 'u', admin: 'true' })).toBe(false); // must be boolean true
  });

  it('grants admin for allowlisted verified emails, case-insensitively', () => {
    const email = DEFAULT_ADMIN_EMAILS[0];
    expect(isAdminClaims({ uid: 'u', email: email.toUpperCase(), email_verified: true })).toBe(true);
  });

  it('never grants admin for unverified or missing emails', () => {
    const email = DEFAULT_ADMIN_EMAILS[0];
    expect(isAdminClaims({ uid: 'u', email, email_verified: false })).toBe(false);
    expect(isAdminClaims({ uid: 'u', email })).toBe(false);
    expect(isAdminClaims({ uid: 'u' })).toBe(false);
  });

  it('respects a custom allowlist', () => {
    expect(isAdminClaims({ uid: 'u', email: 'ops@example.com', email_verified: true }, ['ops@example.com'])).toBe(true);
    expect(isAdminClaims({ uid: 'u', email: DEFAULT_ADMIN_EMAILS[0], email_verified: true }, ['ops@example.com'])).toBe(false);
  });
});

describe('createAuthenticator', () => {
  const okVerifier = async (token: string) => {
    if (token === 'good-admin') return { uid: 'u1', email: DEFAULT_ADMIN_EMAILS[0], email_verified: true };
    if (token === 'good-player') return { uid: 'u2', email: 'player@example.com', email_verified: true };
    if (token === 'no-uid') return { uid: '' } as any;
    throw new Error('invalid token');
  };

  it('derives identity from verified claims, not client input', async () => {
    const auth = createAuthenticator({ verifyIdToken: okVerifier });
    await expect(auth.authenticate('good-player')).resolves.toEqual({
      uid: 'u2', email: 'player@example.com', isAdmin: false,
    });
    await expect(auth.authenticate('good-admin')).resolves.toEqual({
      uid: 'u1', email: DEFAULT_ADMIN_EMAILS[0], isAdmin: true,
    });
  });

  it('rejects invalid, missing and uid-less tokens', async () => {
    const auth = createAuthenticator({ verifyIdToken: okVerifier });
    await expect(auth.authenticate('forged')).rejects.toThrow();
    await expect(auth.authenticate('')).rejects.toThrow();
    await expect(auth.authenticate('no-uid')).rejects.toThrow();
    await expect(auth.tryAuthenticate('forged')).resolves.toBeNull();
  });
});

describe('http helpers', () => {
  it('extracts bearer tokens', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(extractBearerToken('bearer  spaced ')).toBe('spaced');
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken(['Bearer x'])).toBe('x');
  });

  it('merges ADMIN_EMAILS env overrides with the defaults', () => {
    const list = adminEmailsFromEnv('Ops@Example.com ,, not-an-email');
    expect(list).toContain('ops@example.com');
    for (const email of DEFAULT_ADMIN_EMAILS) expect(list).toContain(email);
    expect(adminEmailsFromEnv(undefined)).toEqual([...DEFAULT_ADMIN_EMAILS]);
  });
});

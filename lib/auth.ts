import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'unspec-session';
const MAX_AGE = 60 * 60 * 12;
const local = globalThis as typeof globalThis & { unspecDevSecret?: string };
const devSecret = local.unspecDevSecret ??= randomBytes(32).toString('hex');
const defaultHash = 'cfa5d528221c12b2335699d1dd5556ed:e5066ccb4e7d62d6956535628b35f97f1b27e5d1e0ae66e33c1dcb956b1678ca85bf21ecbaeeadf25701d7070923d60de7de47ebcbc74c1732692fb0c88540e8';
function secret() {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET minimal 32 karakter belum dikonfigurasi.');
  return devSecret;
}
function signature(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url'); }
function equal(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function verifyCredentials(username: string, password: string) {
  const [salt, expected] = (process.env.AUTH_PASSWORD_HASH || defaultHash).split(':');
  if (!salt || !expected || !/^[a-f0-9]{128}$/i.test(expected)) throw new Error('Format AUTH_PASSWORD_HASH tidak valid.');
  const actual = scryptSync(password, salt, 64).toString('hex');
  return equal(actual, expected) && equal(username, process.env.AUTH_USERNAME || 'Sulbagsel');
}
export async function createSession() {
  const payload = Buffer.from(JSON.stringify({ user: process.env.AUTH_USERNAME || 'Sulbagsel', expires: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  (await cookies()).set(COOKIE, `${payload}.${signature(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: MAX_AGE,
  });
}
export async function authenticated() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return false;
    const [payload, sig, extra] = token.split('.');
    if (extra || !sig || !equal(signature(payload), sig)) return false;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return parsed.expires > Date.now() && parsed.user === (process.env.AUTH_USERNAME || 'Sulbagsel');
  } catch { return false; }
}
export async function destroySession() { (await cookies()).delete(COOKIE); }
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}

import type { Request, Response, CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'tdv_rt';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(): CookieOptions {
  // En contenedor NODE_ENV=production siempre (para que NestJS optimice),
  // por eso usamos COOKIE_SECURE como override explicito. Default: secure on
  // en prod salvo que se setee COOKIE_SECURE=false (necesario para HTTP local).
  const secure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

export function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: 0,
  });
}

export function readRefreshCookie(req: Request): string | null {
  const value = req.cookies?.[REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length >= 64 ? value : null;
}

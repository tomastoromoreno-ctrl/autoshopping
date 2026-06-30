import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

function getRateLimitKey(ip: string, route: string): string {
  return `${ip}:${route}`;
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60_000);

export function createRateLimitMiddleware(maxAttempts: number, windowMs: number, routeName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = getRateLimitKey(ip, routeName);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      store.set(key, entry);
      next();
      return;
    }

    entry.count++;

    if (entry.count > maxAttempts) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      throw new HttpException(
        `Too many requests. Try again in ${retryAfter} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  };
}

export const authSigninRateLimit = createRateLimitMiddleware(5, 15 * 60 * 1000, 'auth:signin');
export const authSignupRateLimit = createRateLimitMiddleware(3, 60 * 60 * 1000, 'auth:signup');
export const authRefreshRateLimit = createRateLimitMiddleware(10, 15 * 60 * 1000, 'auth:refresh');

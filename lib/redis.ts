/**
 * lib/redis.ts
 * Singleton клиент Upstash Redis.
 * Env vars (заданы в Vercel / .env.local):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;

  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN должны быть заданы"
    );
  }

  _redis = new Redis({ url, token });
  return _redis;
}

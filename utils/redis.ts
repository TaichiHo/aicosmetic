import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const CACHE_TTL = 60 * 60 * 24 * 7 // 1 week in seconds

export async function getCachedProductImage(brand: string, name: string): Promise<string | null> {
  const key = `product_image:${brand.toLowerCase()}:${name.toLowerCase()}`
  return redis.get(key)
}

export async function cacheProductImage(brand: string, name: string, imageUrl: string): Promise<void> {
  const key = `product_image:${brand.toLowerCase()}:${name.toLowerCase()}`
  await redis.set(key, imageUrl, { ex: CACHE_TTL })
} 
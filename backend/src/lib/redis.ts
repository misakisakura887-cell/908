import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL

// In-memory fallback when Redis is not configured
const memoryStore = new Map<string, { value: string; expiresAt?: number }>()

const memoryFallback = {
  async get(key: string): Promise<string | null> {
    const entry = memoryStore.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) { memoryStore.delete(key); return null }
    return entry.value
  },
  async set(key: string, value: string): Promise<'OK'> { memoryStore.set(key, { value }); return 'OK' as const },
  async setex(key: string, ttl: number, value: string): Promise<'OK'> {
    memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 }); return 'OK' as const
  },
  async del(key: string): Promise<number> { memoryStore.delete(key); return 1 },
  on() { return memoryFallback },
  connect() { return Promise.resolve() },
}

export const redis: any = redisUrl
  ? new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true })
  : memoryFallback

if (redisUrl) {
  redis.on('error', (err: any) => { console.error('Redis connection error:', err.message) })
} else {
  console.log('⚠️ REDIS_URL not set — using in-memory store (not for multi-instance production)')
}

// Price cache keys
export const PRICE_CACHE_KEY = 'mirror:price:current'
export const PRICE_CACHE_TTL = 300

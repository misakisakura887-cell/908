import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

// Price cache keys
export const PRICE_CACHE_KEY = 'mirror:price:current'
export const PRICE_CACHE_TTL = 300 // 5 minutes

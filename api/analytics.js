/**
 * Analytics API endpoint with multiple storage backends
 * Supports Vercel KV, file-based storage, and in-memory fallback
 */

let storage = null
let memoryStore = new Map()

/**
 * Initialize storage backend
 */
async function initStorage() {
  if (storage) return storage

  // Try Vercel KV first (production)
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv } = await import('@vercel/kv')
      storage = {
        type: 'kv',
        async get(key) {
          try {
            const value = await kv.get(key)
            return typeof value === 'number' ? value : null
          } catch {
            return null
          }
        },
        async set(key, value) {
          try {
            await kv.set(key, value)
            return value
          } catch {
            return null
          }
        },
        async incr(key, delta = 1) {
          try {
            const result = await kv.incrby(key, delta)
            return result
          } catch {
            return null
          }
        }
      }
      console.log('Analytics: Using Vercel KV storage')
      return storage
    }
  } catch (error) {
    console.warn('Analytics: Vercel KV not available:', error.message)
  }

  // Fallback to file-based storage (development)
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const dataDir = path.join(process.cwd(), '.analytics')
    
    // Ensure directory exists
    try {
      await fs.mkdir(dataDir, { recursive: true })
    } catch {
      // Directory might already exist
    }

    storage = {
      type: 'file',
      async get(key) {
        try {
          const filePath = path.join(dataDir, `${key}.json`)
          const data = await fs.readFile(filePath, 'utf-8')
          const parsed = JSON.parse(data)
          return typeof parsed.value === 'number' ? parsed.value : null
        } catch {
          return null
        }
      },
      async set(key, value) {
        try {
          const filePath = path.join(dataDir, `${key}.json`)
          await fs.writeFile(filePath, JSON.stringify({ value, updatedAt: new Date().toISOString() }))
          return value
        } catch {
          return null
        }
      },
      async incr(key, delta = 1) {
        try {
          const current = await this.get(key) || 0
          const newValue = current + delta
          await this.set(key, newValue)
          return newValue
        } catch {
          return null
        }
      }
    }
    console.log('Analytics: Using file-based storage')
    return storage
  } catch (error) {
    console.warn('Analytics: File storage not available:', error.message)
  }

  // Final fallback to in-memory storage
  storage = {
    type: 'memory',
    async get(key) {
      return memoryStore.get(key) || null
    },
    async set(key, value) {
      memoryStore.set(key, value)
      return value
    },
    async incr(key, delta = 1) {
      const current = memoryStore.get(key) || 0
      const newValue = current + delta
      memoryStore.set(key, newValue)
      return newValue
    }
  }
  console.log('Analytics: Using in-memory storage (not persistent)')
  return storage
}

/**
 * Get analytics value
 */
async function getValue(key) {
  const store = await initStorage()
  return await store.get(key)
}

/**
 * Increment analytics value
 */
async function incrementValue(key, delta = 1) {
  const store = await initStorage()
  return await store.incr(key, delta)
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  try {
    if (req.method === 'POST') {
      // Increment value
      const { key, delta = 1 } = req.body || {}
      
      if (!key || typeof key !== 'string') return send(res, 400, { error: 'Missing or invalid key' })

      const numDelta = parseInt(delta, 10) || 1
      const newValue = await incrementValue(key, numDelta)

      if (newValue === null) return send(res, 500, { error: 'Failed to increment value' })

      return send(res, 200, { value: newValue, key, delta: numDelta, timestamp: new Date().toISOString() })
    }

    if (req.method === 'GET') {
      // Get value
      const url = new URL(req.url || '/', 'http://localhost')
      const key = url.searchParams.get('key')

      if (!key) return send(res, 400, { error: 'Missing key parameter' })

      const value = await getValue(key)

      return send(res, 200, { value: value || 0, key, timestamp: new Date().toISOString() })
    }

    send(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    console.error('Analytics API error:', error)
    send(res, 500, { error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? error.message : undefined })
  }
}

function send(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

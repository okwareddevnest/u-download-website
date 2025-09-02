/**
 * Storage layer for download analytics
 * Supports multiple backends with fallbacks
 */

export interface StorageBackend {
  get(key: string): Promise<number | null>
  increment(key: string, delta: number): Promise<number | null>
}

/**
 * LocalStorage backend for development and fallback
 */
export class LocalStorageBackend implements StorageBackend {
  private prefix = 'u-download-analytics'

  async get(key: string): Promise<number | null> {
    try {
      const stored = localStorage.getItem(`${this.prefix}-${key}`)
      return stored ? parseInt(stored, 10) || 0 : 0
    } catch {
      return null
    }
  }

  async increment(key: string, delta: number): Promise<number | null> {
    try {
      const current = await this.get(key) || 0
      const newValue = current + delta
      localStorage.setItem(`${this.prefix}-${key}`, newValue.toString())
      return newValue
    } catch {
      return null
    }
  }
}

/**
 * Vercel Blob backend for cloud file storage
 */
export class BlobBackend implements StorageBackend {
  async get(key: string): Promise<number | null> {
    try {
      const response = await fetch(`/api/blob-analytics?action=get&key=${encodeURIComponent(key)}`)
      if (!response.ok) return null
      const data = await response.json()
      return typeof data.value === 'number' ? data.value : null
    } catch {
      return null
    }
  }

  async increment(key: string, delta: number): Promise<number | null> {
    try {
      const response = await fetch('/api/blob-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'increment', key, delta }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return typeof data.value === 'number' ? data.value : null
    } catch {
      return null
    }
  }
}

/**
 * API backend that calls Vercel serverless functions
 */
export class APIBackend implements StorageBackend {
  async get(key: string): Promise<number | null> {
    try {
      const response = await fetch(`/api/analytics?key=${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return typeof data.value === 'number' ? data.value : null
    } catch {
      return null
    }
  }

  async increment(key: string, delta: number): Promise<number | null> {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, delta }),
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      return typeof data.value === 'number' ? data.value : null
    } catch {
      return null
    }
  }
}

/**
 * Multi-backend storage with automatic fallback
 */
export class MultiBackendStorage implements StorageBackend {
  private backends: StorageBackend[]

  constructor(backends: StorageBackend[]) {
    this.backends = backends
  }

  async get(key: string): Promise<number | null> {
    for (const backend of this.backends) {
      try {
        const result = await backend.get(key)
        if (result !== null) return result
      } catch {
        continue
      }
    }
    return null
  }

  async increment(key: string, delta: number): Promise<number | null> {
    let lastResult: number | null = null
    
    // Try each backend, but continue trying others even if one fails
    for (const backend of this.backends) {
      try {
        const result = await backend.increment(key, delta)
        if (result !== null && lastResult === null) {
          lastResult = result
        }
      } catch {
        continue
      }
    }
    
    return lastResult
  }
}

/**
 * Create storage instance based on environment
 */
export function createStorage(): StorageBackend {
  const backends: StorageBackend[] = []

  // Prefer Blob when a token is available (works locally and in prod)
  if (import.meta.env.VITE_HAS_BLOB_TOKEN) {
    backends.push(new BlobBackend())
  }

  // API backend (Vercel or any backend serving /api/analytics)
  backends.push(new APIBackend())

  // Always include localStorage as the final fallback
  backends.push(new LocalStorageBackend())
  
  return new MultiBackendStorage(backends)
}

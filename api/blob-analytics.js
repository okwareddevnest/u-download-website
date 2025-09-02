/**
 * Vercel Blob analytics backend
 * Uses Vercel Blob storage for persistent analytics data
 */

import { put, head, BlobNotFoundError } from '@vercel/blob'

/**
 * Get analytics data from blob storage
 */
async function getFromBlob(key) {
  try {
    const pathname = `analytics/${key}.json`

    // Check if blob exists and get a download URL
    let downloadUrl
    try {
      const meta = await head(pathname)
      downloadUrl = meta.downloadUrl || meta.url
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        return 0 // New counter
      }
      throw error
    }

    // Fetch the content from the Blob CDN URL
    const response = await fetch(downloadUrl)
    if (!response.ok) return null

    const data = await response.json()
    return typeof data.value === 'number' ? data.value : 0
  } catch (error) {
    console.warn('Blob get error:', error)
    return null
  }
}

/**
 * Store analytics data to blob storage
 */
async function putToBlob(key, value) {
  try {
    const data = {
      value,
      updatedAt: new Date().toISOString(),
      key
    }
    const pathname = `analytics/${key}.json`
    const { url } = await put(pathname, JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
      // overwrite same key instead of creating versions
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    console.log(`Analytics stored to blob: ${url}`)
    return value
  } catch (error) {
    console.warn('Blob put error:', error)
    return null
  }
}

/**
 * Increment analytics value in blob storage
 */
async function incrementInBlob(key, delta = 1) {
  try {
    // Get current value
    const currentValue = await getFromBlob(key) || 0
    const newValue = currentValue + delta
    
    // Store updated value
    const result = await putToBlob(key, newValue)
    return result
  } catch (error) {
    console.warn('Blob increment error:', error)
    return null
  }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Check if blob token is available
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return send(res, 503, { error: 'Blob storage not configured', message: 'BLOB_READ_WRITE_TOKEN not found' })
  }

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
      // Handle increment action
      const { action, key, delta = 1 } = req.body || {}
      
      if (action !== 'increment' || !key || typeof key !== 'string') {
        return send(res, 400, { error: 'Invalid request. Expected action=increment with key.' })
      }

      const numDelta = parseInt(delta, 10) || 1
      const newValue = await incrementInBlob(key, numDelta)

      if (newValue === null) {
        return send(res, 500, { error: 'Failed to increment value in blob storage' })
      }

      return send(res, 200, { value: newValue, key, delta: numDelta, backend: 'blob', timestamp: new Date().toISOString() })
    }

    if (req.method === 'GET') {
      // Handle get action
      const url = new URL(req.url || '/', 'http://localhost')
      const action = url.searchParams.get('action')
      const key = url.searchParams.get('key')

      if (action !== 'get' || !key) {
        return send(res, 400, { error: 'Invalid request. Expected action=get with key parameter.' })
      }

      const value = await getFromBlob(key)

      if (value === null) {
        return send(res, 500, { error: 'Failed to get value from blob storage' })
      }

      return send(res, 200, { value, key, backend: 'blob', timestamp: new Date().toISOString() })
    }

    send(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    console.error('Blob analytics API error:', error)
    send(res, 500, { error: 'Internal server error', backend: 'blob', message: process.env.NODE_ENV === 'development' ? error.message : undefined })
  }
}

function send(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

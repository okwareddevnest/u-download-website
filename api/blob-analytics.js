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
    const blobUrl = `analytics/${key}.json`
    
    // Check if blob exists
    try {
      await head(blobUrl)
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        return 0 // Return 0 for new counters
      }
      throw error
    }

    // Fetch the blob content
    const response = await fetch(blobUrl)
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
    
    const { url } = await put(
      `analytics/${key}.json`,
      JSON.stringify(data),
      {
        access: 'private',
        contentType: 'application/json'
      }
    )
    
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
    res.status(503).json({ 
      error: 'Blob storage not configured',
      message: 'BLOB_READ_WRITE_TOKEN not found' 
    })
    return
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'POST') {
      // Handle increment action
      const { action, key, delta = 1 } = req.body || {}
      
      if (action !== 'increment' || !key || typeof key !== 'string') {
        res.status(400).json({ error: 'Invalid request. Expected action=increment with key.' })
        return
      }

      const numDelta = parseInt(delta, 10) || 1
      const newValue = await incrementInBlob(key, numDelta)

      if (newValue === null) {
        res.status(500).json({ error: 'Failed to increment value in blob storage' })
        return
      }

      res.status(200).json({ 
        value: newValue,
        key,
        delta: numDelta,
        backend: 'blob',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (req.method === 'GET') {
      // Handle get action
      const url = new URL(req.url || '/', 'http://localhost')
      const action = url.searchParams.get('action')
      const key = url.searchParams.get('key')

      if (action !== 'get' || !key) {
        res.status(400).json({ error: 'Invalid request. Expected action=get with key parameter.' })
        return
      }

      const value = await getFromBlob(key)

      if (value === null) {
        res.status(500).json({ error: 'Failed to get value from blob storage' })
        return
      }

      res.status(200).json({ 
        value,
        key,
        backend: 'blob',
        timestamp: new Date().toISOString()
      })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Blob analytics API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      backend: 'blob',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
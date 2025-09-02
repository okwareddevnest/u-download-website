import { createStorage } from './storage'

/**
 * Robust download analytics with multiple backend support
 */
class DownloadAnalytics {
  private storage = createStorage()
  private readonly DOWNLOADS_KEY = 'total-downloads'

  async getTotalDownloads(): Promise<number | null> {
    try {
      const total = await this.storage.get(this.DOWNLOADS_KEY)
      return total || 0
    } catch (error) {
      console.warn('Failed to get total downloads:', error)
      return null
    }
  }

  async incrementDownloads(delta = 1): Promise<number | null> {
    try {
      const newTotal = await this.storage.increment(this.DOWNLOADS_KEY, delta)
      if (newTotal !== null) {
        console.log(`Download count incremented by ${delta}. New total: ${newTotal}`)
      }
      return newTotal
    } catch (error) {
      console.warn('Failed to increment downloads:', error)
      return null
    }
  }

  /**
   * Get download statistics
   */
  async getStats(): Promise<{ total: number; available: boolean }> {
    const total = await this.getTotalDownloads()
    return {
      total: total || 0,
      available: total !== null
    }
  }
}

// Create singleton instance
const analytics = new DownloadAnalytics()

// Export convenience functions
export async function getTotalDownloads(): Promise<number | null> {
  return analytics.getTotalDownloads()
}

export async function incrementDownloads(delta = 1): Promise<number | null> {
  return analytics.incrementDownloads(delta)
}

export async function getDownloadStats() {
  return analytics.getStats()
}

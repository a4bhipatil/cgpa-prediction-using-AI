// Simple in-memory cache for frequently accessed data
class SimpleCache {
  constructor(ttl = 300000) { // Default 5 minutes TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
const testCache = new SimpleCache(300000); // 5 minutes for tests
const attemptCache = new SimpleCache(180000); // 3 minutes for attempts

// Cleanup expired entries every 5 minutes
setInterval(() => {
  testCache.cleanup();
  attemptCache.cleanup();
}, 300000);

module.exports = {
  testCache,
  attemptCache,
  SimpleCache
};
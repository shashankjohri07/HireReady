/**
 * LRU Cache with TTL and hit-rate tracking.
 *
 * Uses a Map (insertion-ordered) + O(1) delete-and-reinsert to maintain
 * recency order. The tail of the map is the LRU entry evicted when capacity
 * is exceeded.
 */
export class LRUCache {
  #capacity;
  #ttlMs;
  #map = new Map();   // key → { value, expiresAt }
  #hits = 0;
  #misses = 0;

  constructor(capacity, ttlMs) {
    this.#capacity = capacity;
    this.#ttlMs = ttlMs;
  }

  get(key) {
    const entry = this.#map.get(key);
    if (!entry) { this.#misses++; return undefined; }

    if (Date.now() > entry.expiresAt) {
      this.#map.delete(key);
      this.#misses++;
      return undefined;
    }

    // Refresh recency: delete + re-insert moves key to tail
    this.#map.delete(key);
    this.#map.set(key, entry);
    this.#hits++;
    return entry.value;
  }

  set(key, value) {
    if (this.#map.has(key)) this.#map.delete(key);
    else if (this.#map.size >= this.#capacity) {
      // Evict the least-recently-used entry (first key in Map)
      this.#map.delete(this.#map.keys().next().value);
    }
    this.#map.set(key, { value, expiresAt: Date.now() + this.#ttlMs });
  }

  stats() {
    const total = this.#hits + this.#misses;
    return {
      size: this.#map.size,
      capacity: this.#capacity,
      hits: this.#hits,
      misses: this.#misses,
      hitRate: total === 0 ? 0 : +(this.#hits / total * 100).toFixed(1),
    };
  }
}

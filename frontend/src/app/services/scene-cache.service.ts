/**
 * SceneCacheService — IndexedDB-backed 3D geometry cache.
 *
 * Caches the pre-computed galaxy particle Float32Arrays so the expensive
 * spiral-arm generation loop only runs once per theme, not on every page load.
 *
 * Storage: IndexedDB (unlimited binary, unlike localStorage's 5 MB string limit)
 * Key:     `galaxy_${theme}_v${CACHE_VERSION}`
 * Expiry:  7 days
 */

import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const DB_NAME    = 'orbitops-3d-cache';
const DB_VERSION = 1;
const STORE_NAME = 'galaxy-geometry';
const CACHE_VERSION = 3;         // bump to invalidate all cached geometry
const TTL_MS = 7 * 24 * 3600 * 1000; // 7 days

export interface GalaxyCache {
  positions: ArrayBuffer;   // Float32Array serialised as ArrayBuffer
  colors:    ArrayBuffer;
  theme:     string;
  version:   number;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class SceneCacheService {

  private db: IDBDatabase | null = null;
  private readonly supported: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.supported = isPlatformBrowser(this.platformId) && typeof indexedDB !== 'undefined';
  }

  // ── Open / upgrade DB ─────────────────────────────────────────────────────
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) { resolve(this.db); return; }
      if (!this.supported) { reject(new Error('IndexedDB not available')); return; }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      req.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve(this.db!);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Save galaxy geometry arrays for a given theme.
   * Arrays are stored as raw ArrayBuffers for zero-copy retrieval.
   */
  async saveGalaxyData(
    positions: Float32Array,
    colors:    Float32Array,
    theme:     string
  ): Promise<void> {
    if (!this.supported) return;

    try {
      const db = await this.openDb();
      const key = this.makeKey(theme);

      const record = {
        key,
        positions:  positions.buffer.slice(0),
        colors:     colors.buffer.slice(0),
        theme,
        version:    CACHE_VERSION,
        timestamp:  Date.now()
      };

      await new Promise<void>((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(record);
        req.onsuccess = () => resolve();
        req.onerror   = () => reject(req.error);
      });
    } catch {
      // Cache writes are best-effort — never block rendering
    }
  }

  /**
   * Load galaxy geometry arrays for a given theme.
   * Returns null on cache miss, version mismatch, or expiry.
   */
  async loadGalaxyData(theme: string): Promise<{ positions: Float32Array; colors: Float32Array } | null> {
    if (!this.supported) return null;

    try {
      const db  = await this.openDb();
      const key = this.makeKey(theme);

      const record = await new Promise<any>((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
      });

      if (!record) return null;
      if (record.version !== CACHE_VERSION) return null;
      if (Date.now() - record.timestamp > TTL_MS) {
        this.deleteKey(key);
        return null;
      }

      return {
        positions: new Float32Array(record.positions),
        colors:    new Float32Array(record.colors)
      };
    } catch {
      return null;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private makeKey(theme: string): string {
    return `galaxy_${theme}_v${CACHE_VERSION}`;
  }

  private async deleteKey(key: string): Promise<void> {
    try {
      const db = await this.openDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    } catch { /* best-effort */ }
  }
}

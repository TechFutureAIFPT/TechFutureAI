import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheEnvelope<T> {
  savedAt: number;
  value: T;
  version: number;
  metadata?: Record<string, unknown>;
}

export interface LocalCacheEnvelope<T> extends CacheEnvelope<T> {}

const CACHE_VERSION = 3;
const CACHE_PREFIX = "supporthr:data-cache:";

function cacheKey(key: string) {
  return `${CACHE_PREFIX}${key}`;
}

export async function readLocalCache<T>(key: string): Promise<T | null> {
  const envelope = await readLocalCacheEnvelope<T>(key);
  return envelope?.value ?? null;
}

export async function readLocalCacheEnvelope<T>(key: string): Promise<LocalCacheEnvelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>>;
    if (parsed.version !== CACHE_VERSION || parsed.value === undefined) return null;
    return parsed as LocalCacheEnvelope<T>;
  } catch (error) {
    console.warn(`[cache] Không đọc được cache ${key}.`, error);
    return null;
  }
}

export async function writeLocalCache<T>(
  key: string,
  value: T,
  metadata?: Record<string, unknown>
): Promise<void> {
  const storageKey = cacheKey(key);
  const envelope: CacheEnvelope<T> = {
    savedAt: Date.now(),
    value,
    version: CACHE_VERSION,
    metadata
  };
  const serialized = JSON.stringify(envelope);

  try {
    await AsyncStorage.setItem(storageKey, serialized);
  } catch (error) {
    try {
      await AsyncStorage.removeItem(storageKey);
      await AsyncStorage.setItem(storageKey, serialized);
      return;
    } catch {
      // Try a broader cache-only cleanup below.
    }

    try {
      const keys = await AsyncStorage.getAllKeys();
      const staleCacheKeys = keys.filter((item) => item.startsWith(CACHE_PREFIX) && item !== storageKey);
      if (staleCacheKeys.length > 0) {
        await Promise.all(staleCacheKeys.map((item) => AsyncStorage.removeItem(item)));
      }
      await AsyncStorage.setItem(storageKey, serialized);
      return;
    } catch {
      // Keep the original warning below so the failed key remains visible in logs.
    }
    console.warn(`[cache] Không ghi được cache ${key}.`, error);
  }
}

export async function removeLocalCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(cacheKey(key));
  } catch (error) {
    console.warn(`[cache] Không xóa được cache ${key}.`, error);
  }
}

export const localCacheKeys = {
  inbox(userKey?: string | null) {
    return `inbox:${userKey?.trim().toLowerCase() || "guest"}`;
  },
  accountData(userKey?: string | null) {
    return `account-data:${userKey?.trim().toLowerCase() || "guest"}`;
  },
  advisorChat(userKey?: string | null) {
    return `advisor-chat:${userKey?.trim().toLowerCase() || "guest"}`;
  }
};

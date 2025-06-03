import { GitHubReleaseRaw, DashboardSummary } from '../types/rawReleaseData'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>()

  constructor() {
    // 메모리 캐시만 사용
  }

  /**
   * 캐시 유효성 검사
   */
  private isValidCache(cacheEntry: CacheEntry<any>): boolean {
    const now = Date.now()
    return (now - cacheEntry.timestamp) < cacheEntry.ttl
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  get<T>(key: string): T | null {
    const cacheEntry = this.memoryCache.get(key)
    
    if (!cacheEntry) {
      return null
    }

    if (!this.isValidCache(cacheEntry)) {
      // 만료된 캐시 삭제
      this.delete(key)
      return null
    }

    console.log(`🎯 캐시 히트: ${key}`)
    
    // 캐시된 데이터 검증
    if (cacheEntry.data) {
      console.log(`🔍 캐시된 데이터 타입: ${typeof cacheEntry.data}`)
      console.log(`🔍 캐시된 데이터 키: ${Object.keys(cacheEntry.data)}`)
      console.log(`🔍 캐시된 데이터 JSON 길이: ${JSON.stringify(cacheEntry.data).length}`)
    } else {
      console.error(`❌ 캐시된 데이터가 비어있음: ${key}`)
    }
    
    return cacheEntry.data as T
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000 // minutes to milliseconds
    }

    // 메모리에만 저장
    this.memoryCache.set(key, cacheEntry)
    console.log(`💾 메모리 캐시 저장됨: ${key} (TTL: ${ttlMinutes}분)`)
  }

  /**
   * 캐시 삭제
   */
  delete(key: string): void {
    // 메모리에서만 삭제
    this.memoryCache.delete(key)
    console.log(`🗑️ 메모리 캐시 삭제됨: ${key}`)
  }

  /**
   * 모든 캐시 삭제
   */
  clear(): void {
    // 메모리 캐시만 클리어
    this.memoryCache.clear()
    console.log('🧹 모든 메모리 캐시 삭제됨')
  }

  /**
   * 캐시 상태 조회
   */
  getStatus(): { memoryKeys: string[], totalSize: number } {
    const memoryKeys = Array.from(this.memoryCache.keys())
    
    // 메모리 캐시 크기 추정 (JSON 문자열 길이 기준)
    let totalSize = 0
    for (const [key, entry] of this.memoryCache.entries()) {
      try {
        totalSize += JSON.stringify(entry).length
      } catch (error) {
        console.warn(`캐시 크기 계산 실패: ${key}`)
      }
    }

    return {
      memoryKeys,
      totalSize
    }
  }

  /**
   * 특정 타입별 캐시 키 생성 헬퍼
   */
  static generateKey(type: 'raw-data' | 'dashboard' | 'repository-dashboard', identifier?: string): string {
    if (type === 'repository-dashboard' && identifier) {
      return `${type}-${identifier.replace('/', '-')}`
    }
    return type
  }
} 
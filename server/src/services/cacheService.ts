import * as fs from 'fs'
import * as path from 'path'
import { GitHubReleaseRaw, DashboardSummary } from '../types/rawReleaseData'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds
}

export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private cacheDir: string

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'cache')
    this.ensureCacheDirectory()
    this.loadCacheFromDisk()
  }

  /**
   * 캐시 디렉토리 생성
   */
  private ensureCacheDirectory() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  /**
   * 서버 시작시 디스크에서 캐시 로드
   */
  private loadCacheFromDisk() {
    try {
      const cacheFiles = fs.readdirSync(this.cacheDir)
      
      for (const file of cacheFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file)
          const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          const key = file.replace('.json', '')
          
          // TTL 확인하여 유효한 캐시만 로드
          if (this.isValidCache(cacheData)) {
            this.memoryCache.set(key, cacheData)
            console.log(`📦 캐시 로드됨: ${key}`)
          } else {
            // 만료된 캐시 파일 삭제
            fs.unlinkSync(filePath)
            console.log(`🗑️ 만료된 캐시 삭제: ${key}`)
          }
        }
      }
    } catch (error) {
      console.log('캐시 로드 중 오류 (정상적임):', error)
    }
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

    // 메모리에 저장
    this.memoryCache.set(key, cacheEntry)

    // 디스크에도 저장 (백업용)
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`)
      fs.writeFileSync(filePath, JSON.stringify(cacheEntry, null, 2))
      console.log(`💾 캐시 저장됨: ${key} (TTL: ${ttlMinutes}분)`)
    } catch (error) {
      console.error(`캐시 파일 저장 실패: ${key}`, error)
    }
  }

  /**
   * 캐시 삭제
   */
  delete(key: string): void {
    // 메모리에서 삭제
    this.memoryCache.delete(key)

    // 디스크에서도 삭제
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      console.log(`🗑️ 캐시 삭제됨: ${key}`)
    } catch (error) {
      console.error(`캐시 파일 삭제 실패: ${key}`, error)
    }
  }

  /**
   * 모든 캐시 삭제
   */
  clear(): void {
    // 메모리 캐시 클리어
    this.memoryCache.clear()

    // 디스크 캐시 클리어
    try {
      const files = fs.readdirSync(this.cacheDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file))
        }
      }
      console.log('🧹 모든 캐시 삭제됨')
    } catch (error) {
      console.error('캐시 클리어 실패:', error)
    }
  }

  /**
   * 캐시 상태 조회
   */
  getStatus(): { memoryKeys: string[], diskFiles: string[], totalSize: number } {
    const memoryKeys = Array.from(this.memoryCache.keys())
    
    let diskFiles: string[] = []
    let totalSize = 0
    
    try {
      diskFiles = fs.readdirSync(this.cacheDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
      
      // 총 캐시 크기 계산
      for (const file of fs.readdirSync(this.cacheDir)) {
        if (file.endsWith('.json')) {
          const stat = fs.statSync(path.join(this.cacheDir, file))
          totalSize += stat.size
        }
      }
    } catch (error) {
      console.error('캐시 상태 조회 실패:', error)
    }

    return {
      memoryKeys,
      diskFiles,
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
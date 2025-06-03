import { GitHubReleaseRaw, DashboardSummary } from '../types/rawReleaseData'
import { RawDataService } from './rawDataService'
import { CacheService } from './cacheService'

export class DashboardService {
  private rawDataService: RawDataService
  private cacheService: CacheService

  constructor() {
    this.rawDataService = new RawDataService()
    this.cacheService = new CacheService()
  }

  /**
   * Raw 데이터에서 시간별 통계를 생성합니다
   */
  private generateTimeStats(rawReleases: GitHubReleaseRaw[]) {
    const stats = {
      yearly: {} as { [year: string]: number },
      quarterly: {} as { [quarter: string]: number },
      monthly: {} as { [month: string]: number },
      weekly: {} as { [week: string]: number },
      daily: {} as { [day: string]: number },
      hourly: {} as { [hour: string]: number },
      byDayOfWeek: {} as { [day: string]: number },
      weekendVsWeekday: { weekend: 0, weekday: 0 },
      businessHoursVsOther: { businessHours: 0, other: 0 }
    }

    rawReleases.forEach(release => {
      if (!release.published_at) return

      const date = new Date(release.published_at)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const quarter = Math.ceil(month / 3)
      const week = this.getISOWeekNumber(date)
      const dayOfWeek = date.getDay()
      const hour = date.getHours()

      // 시간 단위별 집계
      const yearStr = year.toString()
      const quarterStr = `${year}-Q${quarter}`
      const monthStr = `${year}-${String(month).padStart(2, '0')}`
      const weekStr = `${year}-W${String(week).padStart(2, '0')}`
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      stats.yearly[yearStr] = (stats.yearly[yearStr] || 0) + 1
      stats.quarterly[quarterStr] = (stats.quarterly[quarterStr] || 0) + 1
      stats.monthly[monthStr] = (stats.monthly[monthStr] || 0) + 1
      stats.weekly[weekStr] = (stats.weekly[weekStr] || 0) + 1
      stats.daily[dayStr] = (stats.daily[dayStr] || 0) + 1
      stats.hourly[hour] = (stats.hourly[hour] || 0) + 1
      stats.byDayOfWeek[dayOfWeek] = (stats.byDayOfWeek[dayOfWeek] || 0) + 1

      // 주말 vs 평일
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        stats.weekendVsWeekday.weekend++
      } else {
        stats.weekendVsWeekday.weekday++
      }

      // 업무시간 vs 기타
      if (hour >= 9 && hour <= 18) {
        stats.businessHoursVsOther.businessHours++
      } else {
        stats.businessHoursVsOther.other++
      }
    })

    return stats
  }

  /**
   * Raw 데이터에서 작성자별 통계를 생성합니다
   */
  private generateAuthorStats(rawReleases: GitHubReleaseRaw[]) {
    const authorMap = {} as { [login: string]: any }
    
    rawReleases.forEach(release => {
      const { author } = release
      if (!authorMap[author.login]) {
        authorMap[author.login] = {
          login: author.login,
          id: author.id,
          type: author.type,
          releaseCount: 0,
          isBot: author.type === 'Bot' || author.login.includes('[bot]'),
          repositories: new Set()
        }
      }
      authorMap[author.login].releaseCount++
      authorMap[author.login].repositories.add(release.repository_full_name)
    })

    const authors = Object.values(authorMap)
    const topAuthors = authors
      .sort((a: any, b: any) => b.releaseCount - a.releaseCount)
      .slice(0, 10)
      .map((author: any) => ({
        login: author.login,
        releaseCount: author.releaseCount,
        type: author.type,
        repositoryCount: author.repositories.size
      }))

    const botVsHuman = {
      bots: authors.filter((author: any) => author.isBot).length,
      humans: authors.filter((author: any) => !author.isBot).length
    }

    return {
      totalAuthors: authors.length,
      topAuthors,
      botVsHumanRatio: botVsHuman
    }
  }

  /**
   * Raw 데이터에서 버전별 통계를 생성합니다
   */
  private generateVersionStats(rawReleases: GitHubReleaseRaw[]) {
    const versionTypes = {
      major: 0,
      minor: 0,
      patch: 0,
      prerelease: 0,
      custom: 0
    }

    const releaseTypes = {
      stable: 0,
      prerelease: 0,
      draft: 0
    }

    rawReleases.forEach(release => {
      // 릴리즈 타입 분류
      if (release.draft) {
        releaseTypes.draft++
      } else if (release.prerelease) {
        releaseTypes.prerelease++
      } else {
        releaseTypes.stable++
      }

      // 버전 타입 분석 (간단한 패턴 매칭)
      const tagName = release.tag_name
      const semverMatch = tagName.match(/(\d+)\.(\d+)\.(\d+)/)
      
      if (semverMatch) {
        const [, major, minor, patch] = semverMatch
        if (release.prerelease) {
          versionTypes.prerelease++
        } else if (major !== '0' && minor === '0' && patch === '0') {
          versionTypes.major++
        } else if (minor !== '0' && patch === '0') {
          versionTypes.minor++
        } else {
          versionTypes.patch++
        }
      } else {
        versionTypes.custom++
      }
    })

    return {
      versionTypeDistribution: versionTypes,
      releasesByType: releaseTypes
    }
  }

  /**
   * Raw 데이터에서 저장소별 통계를 생성합니다
   */
  private generateRepositoryStats(rawReleases: GitHubReleaseRaw[]) {
    const repoMap = {} as { [repo: string]: any }

    rawReleases.forEach(release => {
      const repo = release.repository_full_name
      if (!repoMap[repo]) {
        repoMap[repo] = {
          name: repo,
          totalReleases: 0,
          stableReleases: 0,
          prereleases: 0,
          drafts: 0,
          totalDownloads: 0,
          latestRelease: null,
          authors: new Set()
        }
      }

      repoMap[repo].totalReleases++
      repoMap[repo].authors.add(release.author.login)
      
      if (release.draft) {
        repoMap[repo].drafts++
      } else if (release.prerelease) {
        repoMap[repo].prereleases++
      } else {
        repoMap[repo].stableReleases++
      }

      // Assets 다운로드 수 집계
      const downloads = release.assets.reduce((sum, asset) => sum + asset.download_count, 0)
      repoMap[repo].totalDownloads += downloads

      // 최신 릴리즈 찾기
      if (release.published_at && 
          (!repoMap[repo].latestRelease || release.published_at > repoMap[repo].latestRelease)) {
        repoMap[repo].latestRelease = release.published_at
      }
    })

    // Set을 array length로 변환
    Object.values(repoMap).forEach((repo: any) => {
      repo.authorCount = repo.authors.size
      delete repo.authors
    })

    return Object.values(repoMap)
  }

  /**
   * Assets 관련 통계를 생성합니다
   */
  private generateAssetStats(rawReleases: GitHubReleaseRaw[]) {
    let totalAssets = 0
    let totalDownloads = 0
    let totalSize = 0
    const fileTypes = {} as { [type: string]: { count: number, downloads: number, size: number } }

    rawReleases.forEach(release => {
      release.assets.forEach(asset => {
        totalAssets++
        totalDownloads += asset.download_count
        totalSize += asset.size

        const type = asset.content_type || 'unknown'
        if (!fileTypes[type]) {
          fileTypes[type] = { count: 0, downloads: 0, size: 0 }
        }
        fileTypes[type].count++
        fileTypes[type].downloads += asset.download_count
        fileTypes[type].size += asset.size
      })
    })

    const popularFileTypes = Object.entries(fileTypes)
      .map(([type, stats]) => ({ 
        type, 
        count: stats.count,
        totalDownloads: stats.downloads
      }))
      .sort((a, b) => b.totalDownloads - a.totalDownloads)
      .slice(0, 10)

    return {
      totalAssets,
      totalDownloads,
      averageAssetsPerRelease: rawReleases.length > 0 ? Math.round(totalAssets / rawReleases.length) : 0,
      popularFileTypes
    }
  }

  /**
   * ISO 주 번호를 계산합니다
   */
  private getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  /**
   * 캐시된 Raw 데이터를 가져옵니다 (캐시 미스 시 GitHub API 호출)
   */
  private async getCachedRawReleaseData(): Promise<GitHubReleaseRaw[]> {
    const cacheKey = CacheService.generateKey('raw-data')
    
    // 1. 캐시에서 먼저 확인
    const cachedData = this.cacheService.get<GitHubReleaseRaw[]>(cacheKey)
    if (cachedData) {
      console.log('🎯 Raw 데이터 캐시 사용')
      return cachedData
    }

    // 2. 캐시 미스 시 GitHub API 호출
    console.log('📡 GitHub API에서 Raw 데이터 수집 중...')
    const rawReleases = await this.rawDataService.generateRawReleaseData()
    
    // 3. 캐시에 저장 (30분 TTL)
    this.cacheService.set(cacheKey, rawReleases, 30)
    
    return rawReleases
  }

  /**
   * 전체 대시보드 데이터를 생성합니다 (캐싱 적용)
   */
  async generateDashboardData(): Promise<DashboardSummary> {
    const cacheKey = CacheService.generateKey('dashboard')
    
    // 1. 대시보드 캐시 확인
    const cachedDashboard = this.cacheService.get<DashboardSummary>(cacheKey)
    if (cachedDashboard) {
      console.log('🎯 대시보드 캐시 사용')
      return cachedDashboard
    }

    // 2. 캐시 미스 시 생성
    console.log('🔄 대시보드 데이터 새로 생성 중...')
    
    // Raw 데이터 수집 (이것도 캐시됨)
    const rawReleases = await this.getCachedRawReleaseData()

    if (rawReleases.length === 0) {
      throw new Error('No release data found')
    }

    // 각종 통계 생성
    const timeStats = this.generateTimeStats(rawReleases)
    const authorStats = this.generateAuthorStats(rawReleases)
    const versionStats = this.generateVersionStats(rawReleases)
    const repositoryStats = this.generateRepositoryStats(rawReleases)
    const assetStats = this.generateAssetStats(rawReleases)

    // 날짜 범위 계산
    const publishedDates = rawReleases
      .filter(r => r.published_at)
      .map(r => r.published_at!)
      .sort()

    const dashboardData: DashboardSummary = {
      totalReleases: rawReleases.length,
      dateRange: {
        earliest: publishedDates[0] || '',
        latest: publishedDates[publishedDates.length - 1] || ''
      },
      releasesByType: versionStats.releasesByType,
      versionTypeDistribution: versionStats.versionTypeDistribution,
      releasesByTimeUnit: timeStats,
      authorStats,
      contentStats: {
        averageReleaseNoteLength: rawReleases.reduce((sum, r) => sum + (r.body?.length || 0), 0) / rawReleases.length,
        releaseNoteCoverage: rawReleases.filter(r => r.body && r.body.trim().length > 0).length / rawReleases.length,
        changeTypeDistribution: {
          breaking: 0, // 추후 키워드 분석으로 확장 가능
          features: 0,
          bugfixes: 0,
          performance: 0,
          security: 0
        }
      },
      assetStats
    }

    // 3. 대시보드 캐시에 저장 (15분 TTL - Raw 데이터보다 짧게)
    this.cacheService.set(cacheKey, dashboardData, 15)

    return dashboardData
  }

  /**
   * 특정 저장소의 대시보드 데이터를 생성합니다 (캐싱 적용)
   */
  async generateRepositoryDashboard(repositoryName: string): Promise<DashboardSummary> {
    const cacheKey = CacheService.generateKey('repository-dashboard', repositoryName)
    
    // 1. 저장소별 대시보드 캐시 확인
    const cachedDashboard = this.cacheService.get<DashboardSummary>(cacheKey)
    if (cachedDashboard) {
      console.log(`🎯 ${repositoryName} 대시보드 캐시 사용`)
      return cachedDashboard
    }

    // 2. 캐시 미스 시 생성
    console.log(`🔄 ${repositoryName} 대시보드 새로 생성 중...`)
    
    const allRawReleases = await this.getCachedRawReleaseData()
    const filteredReleases = allRawReleases.filter(r => r.repository_full_name === repositoryName)
    
    if (filteredReleases.length === 0) {
      throw new Error(`No releases found for repository: ${repositoryName}`)
    }

    // 필터된 데이터로 동일한 통계 생성
    const timeStats = this.generateTimeStats(filteredReleases)
    const authorStats = this.generateAuthorStats(filteredReleases)
    const versionStats = this.generateVersionStats(filteredReleases)
    const assetStats = this.generateAssetStats(filteredReleases)

    const publishedDates = filteredReleases
      .filter(r => r.published_at)
      .map(r => r.published_at!)
      .sort()

    const dashboardData: DashboardSummary = {
      totalReleases: filteredReleases.length,
      dateRange: {
        earliest: publishedDates[0] || '',
        latest: publishedDates[publishedDates.length - 1] || ''
      },
      releasesByType: versionStats.releasesByType,
      versionTypeDistribution: versionStats.versionTypeDistribution,
      releasesByTimeUnit: timeStats,
      authorStats,
      contentStats: {
        averageReleaseNoteLength: filteredReleases.reduce((sum, r) => sum + (r.body?.length || 0), 0) / filteredReleases.length,
        releaseNoteCoverage: filteredReleases.filter(r => r.body && r.body.trim().length > 0).length / filteredReleases.length,
        changeTypeDistribution: {
          breaking: 0,
          features: 0,
          bugfixes: 0,
          performance: 0,
          security: 0
        }
      },
      assetStats
    }

    // 3. 저장소별 대시보드 캐시에 저장 (15분 TTL)
    this.cacheService.set(cacheKey, dashboardData, 15)

    return dashboardData
  }

  /**
   * 캐시 상태 조회
   */
  getCacheStatus() {
    return this.cacheService.getStatus()
  }

  /**
   * 캐시 무효화 (새 데이터로 강제 업데이트)
   */
  invalidateCache(): void {
    this.cacheService.clear()
    console.log('🧹 모든 대시보드 캐시가 삭제되었습니다')
  }

  /**
   * 특정 캐시만 무효화
   */
  invalidateSpecificCache(type: 'raw-data' | 'dashboard' | 'repository-dashboard', identifier?: string): void {
    const cacheKey = CacheService.generateKey(type, identifier)
    this.cacheService.delete(cacheKey)
    console.log(`🗑️ ${cacheKey} 캐시가 삭제되었습니다`)
  }
} 
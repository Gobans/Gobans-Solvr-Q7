import { GitHubReleaseRaw, DashboardSummary } from '../types/rawReleaseData'
import { RawDataService } from './rawDataService'
import { CacheService } from './cacheService'
import { TimeStatsService } from './timeStatsService'

export class DashboardService {
  private rawDataService: RawDataService
  private cacheService: CacheService
  private timeStatsService: TimeStatsService

  constructor() {
    this.rawDataService = new RawDataService()
    this.cacheService = new CacheService()
    this.timeStatsService = new TimeStatsService()
  }

  /**
   * Raw 데이터를 TimeStatsService 형식으로 변환합니다
   */
  private convertRawDataToReleaseFormat(rawReleases: GitHubReleaseRaw[]) {
    return rawReleases
      .filter(release => release.published_at) // published_at이 있는 것만
      .map(release => ({
        repo: release.repository_full_name,
        published_at: release.published_at!
      }))
  }

  /**
   * TimeStatsService를 활용하여 시간별 통계를 생성합니다 (평일만)
   */
  private generateTimeStats(rawReleases: GitHubReleaseRaw[]) {
    // 1. Raw 데이터를 TimeStatsService 형식으로 변환
    const releaseEntries = this.convertRawDataToReleaseFormat(rawReleases)
    
    // 2. TimeStatsService의 종합 통계 기능 활용
    return this.timeStatsService.generateComprehensiveTimeStats(releaseEntries)
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
   * Raw 데이터에서 브랜치별 통계를 생성합니다
   */
  private generateBranchStats(rawReleases: GitHubReleaseRaw[]) {
    const branchMap = {} as { [branch: string]: number }
    
    rawReleases.forEach(release => {
      const branch = release.target_commitish || 'unknown'
      branchMap[branch] = (branchMap[branch] || 0) + 1
    })

    // 브랜치별 릴리즈 수를 배열로 변환하고 정렬
    const branchEntries = Object.entries(branchMap)
      .sort(([, a], [, b]) => b - a) // 릴리즈 수 내림차순 정렬

    const totalReleases = rawReleases.length
    const topBranches = branchEntries.slice(0, 10).map(([branch, count]) => ({
      branch,
      releaseCount: count,
      percentage: Math.round((count / totalReleases) * 100)
    }))

    return {
      totalBranches: branchEntries.length,
      topBranches,
      branchDistribution: branchMap
    }
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
    
    try {
      // Raw 데이터 수집 (이것도 캐시됨)
      const rawReleases = await this.getCachedRawReleaseData()
      console.log(`📊 Raw 데이터 수집 완료: ${rawReleases.length}개`)

      if (rawReleases.length === 0) {
        throw new Error('No release data found')
      }

      // 각종 통계 생성
      console.log('⏰ 시간 통계 생성 중...')
      const timeStats = this.generateTimeStats(rawReleases)
      console.log('👤 작성자 통계 생성 중...')
      const authorStats = this.generateAuthorStats(rawReleases)
      console.log('📦 버전 통계 생성 중...')
      const versionStats = this.generateVersionStats(rawReleases)
      console.log('🏢 저장소 통계 생성 중...')
      const repositoryStats = this.generateRepositoryStats(rawReleases)
      console.log('📎 에셋 통계 생성 중...')
      const assetStats = this.generateAssetStats(rawReleases)
      console.log('🌿 브랜치 통계 생성 중...')
      const branchStats = this.generateBranchStats(rawReleases)

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
        assetStats,
        branchStats
      }

      console.log(`✅ 대시보드 데이터 생성 완료 - 총 ${dashboardData.totalReleases}개 릴리즈`)
      console.log('📋 대시보드 데이터 미리보기:', {
        totalReleases: dashboardData.totalReleases,
        hasTimeStats: !!dashboardData.releasesByTimeUnit,
        hasAuthorStats: !!dashboardData.authorStats,
        keys: Object.keys(dashboardData)
      })

      // 개별 필드별 직렬화 테스트
      console.log('🔍 개별 필드 직렬화 테스트:')
      for (const [key, value] of Object.entries(dashboardData)) {
        try {
          const serialized = JSON.stringify(value)
          console.log(`  ✅ ${key}: ${serialized.length}자`)
        } catch (error) {
          console.error(`  ❌ ${key}: 직렬화 실패`, error)
        }
      }

      // 3. 대시보드 캐시에 저장 (15분 TTL - Raw 데이터보다 짧게)
      console.log('💾 캐시에 저장하기 전 데이터 키:', Object.keys(dashboardData))
      
      // 캐시 저장 전 직렬화 테스트
      const preSerializeTest = JSON.stringify(dashboardData)
      console.log('💾 캐시 저장 전 JSON 길이:', preSerializeTest.length)
      
      this.cacheService.set(cacheKey, dashboardData, 15)
      
      // 캐시에서 바로 읽어보기
      const cachedResult = this.cacheService.get<DashboardSummary>(cacheKey)
      if (cachedResult) {
        console.log('🔍 캐시된 데이터 키:', Object.keys(cachedResult))
        console.log('🔍 캐시된 데이터 JSON 길이:', JSON.stringify(cachedResult).length)
      } else {
        console.error('❌ 캐시 저장 실패 - 캐시에서 데이터를 읽을 수 없음')
      }

      return dashboardData
    } catch (error) {
      console.error('❌ 대시보드 데이터 생성 중 오류:', error)
      throw error
    }
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
    const branchStats = this.generateBranchStats(filteredReleases)

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
      assetStats,
      branchStats
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
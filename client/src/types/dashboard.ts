// 백엔드 DashboardSummary와 동일한 타입 정의
export interface DashboardSummary {
  totalReleases: number
  dateRange: {
    earliest: string
    latest: string
  }
  
  // 기본 분포
  releasesByType: {
    stable: number
    prerelease: number
    draft: number
  }
  
  versionTypeDistribution: {
    major: number
    minor: number
    patch: number
    prerelease: number
  }
  
  // 시간 패턴
  releasesByTimeUnit: {
    hourly: { [hour: string]: number }
    daily: { [day: string]: number }
    weekly: { [week: string]: number }
    monthly: { [month: string]: number }
    quarterly: { [quarter: string]: number }
    yearly: { [year: string]: number }
    businessHoursVsOther: {
      businessHours: number
      other: number
    }
  }
  
  // 작성자 통계
  authorStats: {
    totalAuthors: number
    topAuthors: Array<{
      login: string
      releaseCount: number
      type: string
    }>
    botVsHumanRatio: {
      bots: number
      humans: number
    }
  }
  
  // 콘텐츠 통계
  contentStats: {
    averageReleaseNoteLength: number
    releaseNoteCoverage: number // 릴리즈 노트가 있는 비율
    changeTypeDistribution: {
      breaking: number
      features: number
      bugfixes: number
      performance: number
      security: number
    }
  }
  
  // 에셋 통계
  assetStats: {
    totalAssets: number
    totalDownloads: number
    averageAssetsPerRelease: number
    popularFileTypes: Array<{
      type: string
      count: number
      totalDownloads: number
    }>
  }
}

// API 응답 타입
export interface DashboardApiResponse {
  success: boolean
  data: DashboardSummary
  message: string
} 
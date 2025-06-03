// GitHub API 원본 응답 타입 정의
export interface GitHubAuthor {
  login: string // "github-actions[bot]"
  id: number // 41898282
  node_id: string // "MDM6Qm90NDE4OTgyODI="
  avatar_url: string // 프로필 이미지 URL
  gravatar_id: string
  url: string // API URL
  html_url: string // GitHub 프로필 페이지 URL
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: 'User' | 'Bot' | 'Organization' // 작성자 타입
  user_view_type?: string
  site_admin: boolean // GitHub 관리자 여부
}

export interface GitHubAsset {
  url: string
  id: number
  node_id: string
  name: string // 파일명
  label?: string
  uploader: GitHubAuthor
  content_type: string // MIME 타입
  state: string
  size: number // 파일 크기 (bytes)
  download_count: number // 다운로드 횟수
  created_at: string
  updated_at: string
  browser_download_url: string // 직접 다운로드 URL
}

// GitHub API 원본 릴리즈 데이터
export interface GitHubReleaseRaw {
  url: string // API URL
  assets_url: string
  upload_url: string
  html_url: string // GitHub 릴리즈 페이지 URL
  id: number // GitHub 릴리즈 ID
  author: GitHubAuthor
  node_id: string
  tag_name: string // 태그명 (예: @stackflow/react-ui-core@1.1.0)
  target_commitish: string // 대상 브랜치/커밋
  name: string | null // 릴리즈 제목
  draft: boolean // 초안 여부
  prerelease: boolean // 프리릴리즈 여부
  created_at: string // 생성 시간 (ISO string)
  published_at: string | null // 발행 시간 (ISO string)
  assets: GitHubAsset[] // 첨부 파일들
  tarball_url: string // 소스코드 tarball URL
  zipball_url: string // 소스코드 zipball URL
  body: string | null // 릴리즈 노트 내용
}

// 대시보드용 가공된 데이터 타입들

// 🕒 시간 분석용 데이터
export interface TimeAnalysis {
  year: number // 2024
  month: number // 1-12
  quarter: number // 1-4
  week: number // 1-53 (ISO 주)
  dayOfWeek: number // 0-6 (일요일=0)
  hour: number // 0-23
  dayOfMonth: number // 1-31
  isWeekend: boolean
  isBusinessHour: boolean // 9-18시
  timeZone: string // 'UTC'
  
  // 포맷된 문자열들 (빠른 검색용)
  yearStr: string // "2024"
  monthStr: string // "2024-08"
  weekStr: string // "2024-W32"
  dayStr: string // "2024-08-08"
  quarterStr: string // "2024-Q3"
}

// 🏷️ 버전 분석용 데이터
export interface VersionAnalysis {
  originalTag: string // "@stackflow/react-ui-core@1.1.0"
  packageName?: string // "@stackflow/react-ui-core"
  versionString?: string // "1.1.0"
  
  // Semantic Version 파싱 결과
  isSemanticVersion: boolean
  major?: number // 1
  minor?: number // 1
  patch?: number // 0
  prerelease?: string // "alpha", "beta", "rc.1"
  buildMetadata?: string
  
  // 버전 타입 분류
  versionType: 'major' | 'minor' | 'patch' | 'prerelease' | 'custom'
  isStable: boolean // prerelease가 아닌 경우
  
  // 비교용 가중치 (정렬에 사용)
  versionWeight: number
  normalizedVersion: string // "001.001.000" (비교용)
}

// 👤 작성자 분석용 데이터
export interface AuthorAnalysis {
  login: string
  id: number
  type: 'User' | 'Bot' | 'Organization'
  avatarUrl: string
  profileUrl: string
  isBot: boolean // type이 'Bot'이거나 login에 '[bot]' 포함
  isSiteAdmin: boolean
  
  // 분류용 정보
  isAutomated: boolean // github-actions, dependabot 등
  authorCategory: 'human' | 'ci_bot' | 'dependency_bot' | 'other_bot' | 'organization'
}

// 📊 에셋 분석용 데이터
export interface AssetAnalysis {
  totalAssets: number
  totalSize: number // 전체 파일 크기 (bytes)
  totalDownloads: number // 전체 다운로드 수
  
  // 파일 타입별 분류
  assetsByType: {
    [mimeType: string]: {
      count: number
      totalSize: number
      totalDownloads: number
    }
  }
  
  // 평균 정보
  averageSize: number
  averageDownloads: number
  
  // 인기 에셋 (다운로드 수 기준)
  mostDownloadedAsset?: {
    name: string
    downloadCount: number
    size: number
  }
}

// 🌟 메타데이터
export interface ReleaseMetadata {
  repositoryOwner: string // "daangn"
  repositoryName: string // "stackflow"
  repositoryFullName: string // "daangn/stackflow"
  targetBranch: string // "main"
  
  // 릴리즈 상태
  isDraft: boolean
  isPrerelease: boolean
  isLatest?: boolean // API에서 제공하는 경우
  
  // URL 정보
  htmlUrl: string
  apiUrl: string
  tarballUrl: string
  zipballUrl: string
  
  // 데이터 수집 정보
  dataCollectedAt: string // 데이터를 수집한 시간
  apiVersion: string // GitHub API 버전
}

// 🔄 최종 통합 데이터 타입
export interface EnrichedReleaseData {
  // 원본 데이터 ID
  githubReleaseId: number
  
  // 기본 정보
  tagName: string
  releaseName: string | null
  
  // 분석된 데이터들
  timeAnalysis: TimeAnalysis
  versionAnalysis: VersionAnalysis
  authorAnalysis: AuthorAnalysis
  assetAnalysis: AssetAnalysis
  metadata: ReleaseMetadata
  
  // 원본 데이터 (필요시 참조용)
  rawData: GitHubReleaseRaw
}

// 🎯 대시보드 쿼리용 필터 타입들
export interface ReleaseDataFilters {
  // 시간 필터
  dateRange?: {
    from: string // ISO date string
    to: string
  }
  years?: number[]
  quarters?: string[] // ["2024-Q1", "2024-Q2"]
  months?: string[] // ["2024-08", "2024-09"]
  
  // 저장소 필터
  repositories?: string[] // ["daangn/stackflow", "daangn/seed-design"]
  owners?: string[] // ["daangn"]
  
  // 릴리즈 타입 필터
  includePrerelease?: boolean
  includeDrafts?: boolean
  versionTypes?: ('major' | 'minor' | 'patch' | 'prerelease')[]
  
  // 작성자 필터
  authorTypes?: ('User' | 'Bot' | 'Organization')[]
  excludeBots?: boolean
  authors?: string[] // GitHub login names
  
  // 콘텐츠 필터
  hasReleaseNotes?: boolean
  changeTypes?: ('breaking' | 'feature' | 'bugfix' | 'performance' | 'security')[]
  
  // 기타
  hasAssets?: boolean
  minDownloads?: number
}

// 📈 대시보드 집계 결과 타입들
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
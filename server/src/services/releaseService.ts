import { ReleaseEntryDto, ReleaseEntry, ReleaseStats, ParsedReleases } from '../types/releaseStats'

export class ReleaseService {
  private octokit: any

  constructor() {
    this.initOctokit()
  }

  private async initOctokit() {
    const { Octokit } = await import('octokit')
    this.octokit = new Octokit({
      // GitHub Personal Access Token이 필요한 경우 환경변수에서 가져올 수 있습니다
      // auth: process.env.GITHUB_TOKEN,
      // 토큰 없을 시 1시간에 60개로 제한
      // 토큰 존재 시 1시간에 5000개로 제한
    })
  }

  /**
   * GitHub 저장소에서 모든 릴리즈 데이터를 가져옵니다
   */
  async fetchAllReleases(owner: string, repo: string): Promise<ReleaseEntryDto[]> {
    if (!this.octokit) {
      await this.initOctokit()
    }

    try {
      const releases = await this.octokit.paginate(
        this.octokit.rest.repos.listReleases,
        {
          owner,
          repo,
          per_page: 100,
        }
      )

      return releases.map((release: any) => ({
        repo: `${owner}/${repo}`,
        published_at: release.published_at || release.created_at,
      }))
    } catch (error) {
      console.error(`Error fetching releases for ${owner}/${repo}:`, error)
      throw new Error(`Failed to fetch releases for ${owner}/${repo}`)
    }
  }

  /**
   * 여러 저장소에서 릴리즈 데이터를 가져옵니다
   */
  async fetchMultipleRepoReleases(repos: Array<{ owner: string; repo: string }>): Promise<ReleaseEntryDto[]> {
    const allReleases: ReleaseEntryDto[] = []

    for (const { owner, repo } of repos) {
      const releases = await this.fetchAllReleases(owner, repo)
      allReleases.push(...releases)
    }

    return allReleases
  }

  /**
   * 릴리즈 데이터를 파싱하여 날짜별 정보를 추가합니다
   */
  parseReleases(releases: ReleaseEntryDto[]): ParsedReleases {
    return releases.map((release: ReleaseEntryDto) => {
      const publishedDate = new Date(release.published_at)
      
      // 년도
      const year = publishedDate.getFullYear().toString()
      
      // 월 (YYYY-MM 형식)
      const month = `${year}-${String(publishedDate.getMonth() + 1).padStart(2, '0')}`
      
      // 주 (ISO Week Number 형식: YYYY-WNN)
      const weekNumber = this.getISOWeekNumber(publishedDate)
      const week = `${year}-W${String(weekNumber).padStart(2, '0')}`
      
      // 일 (YYYY-MM-DD 형식)
      const day = `${year}-${String(publishedDate.getMonth() + 1).padStart(2, '0')}-${String(publishedDate.getDate()).padStart(2, '0')}`

      return {
        repo: release.repo,
        published_at: release.published_at,
        year,
        month,
        week,
        day,
      }
    })
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
   * 파싱된 릴리즈 데이터로부터 통계를 생성합니다 (주말 제외)
   */
  generateStats(parsedReleases: ParsedReleases): ReleaseStats {
    const stats: ReleaseStats = {
      yearly: {},
      monthly: {},
      weekly: {},
      daily: {},
    }

    parsedReleases.forEach((release: ReleaseEntry) => {
      // 주말 여부 확인
      const publishedDate = new Date(release.published_at)
      const dayOfWeek = publishedDate.getDay() // 0: 일요일, 6: 토요일
      
      // 주말(토요일=6, 일요일=0)인 경우 통계에서 제외
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return
      }

      // 연간 통계
      stats.yearly[release.year] = (stats.yearly[release.year] || 0) + 1
      
      // 월간 통계
      stats.monthly[release.month] = (stats.monthly[release.month] || 0) + 1
      
      // 주간 통계
      stats.weekly[release.week] = (stats.weekly[release.week] || 0) + 1
      
      // 일간 통계
      stats.daily[release.day] = (stats.daily[release.day] || 0) + 1
    })

    return stats
  }

  /**
   * 전체 프로세스를 실행하여 릴리즈 통계를 생성합니다
   */
  async generateReleaseStats(): Promise<{
    rawData: ParsedReleases
    stats: ReleaseStats
  }> {
    // 두 저장소의 릴리즈 데이터 가져오기
    const repos = [
      { owner: 'daangn', repo: 'stackflow' },
      { owner: 'daangn', repo: 'seed-design' },
    ]

    const releases = await this.fetchMultipleRepoReleases(repos)
    const parsedReleases = this.parseReleases(releases)
    const stats = this.generateStats(parsedReleases)

    return {
      rawData: parsedReleases,
      stats,
    }
  }
} 
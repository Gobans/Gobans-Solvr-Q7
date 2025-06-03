import { TimedReleaseDto, TimedReleaseEntry, TimeStats, ParsedTimeEntries } from '../types/timeStats'

/**
 * 시간 기반 통계 전용 서비스
 * 릴리즈 날짜/시간 데이터를 파싱하고 다양한 시간 단위별 통계를 생성합니다
 */
export class TimeStatsService {
  
  /**
   * 릴리즈 데이터를 파싱하여 날짜별 정보를 추가합니다
   */
  parseReleases(releases: TimedReleaseDto[]): ParsedTimeEntries {
    return releases.map((release: TimedReleaseDto) => {
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
  getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  /**
   * 파싱된 릴리즈 데이터로부터 통계를 생성합니다 (평일만)
   */
  generateWeekdayStats(parsedEntries: ParsedTimeEntries): TimeStats {
    const stats: TimeStats = {
      yearly: {},
      monthly: {},
      weekly: {},
      daily: {},
    }

    parsedEntries.forEach((entry: TimedReleaseEntry) => {
      // 주말 여부 확인
      const publishedDate = new Date(entry.published_at)
      const dayOfWeek = publishedDate.getDay() // 0: 일요일, 6: 토요일
      
      // 주말(토요일=6, 일요일=0)인 경우 통계에서 제외
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return
      }

      // 연간 통계
      stats.yearly[entry.year] = (stats.yearly[entry.year] || 0) + 1
      
      // 월간 통계
      stats.monthly[entry.month] = (stats.monthly[entry.month] || 0) + 1
      
      // 주간 통계
      stats.weekly[entry.week] = (stats.weekly[entry.week] || 0) + 1
      
      // 일간 통계
      stats.daily[entry.day] = (stats.daily[entry.day] || 0) + 1
    })

    return stats
  }

  /**
   * 분기별 통계를 생성합니다 (평일만)
   */
  generateQuarterlyStats(parsedEntries: ParsedTimeEntries): { [quarter: string]: number } {
    const quarterlyStats = {} as { [quarter: string]: number }
    
    parsedEntries.forEach(entry => {
      const date = new Date(entry.published_at)
      const year = date.getFullYear()
      const quarter = Math.ceil((date.getMonth() + 1) / 3)
      const quarterStr = `${year}-Q${quarter}`
      
      // 주말 체크 (평일만 포함)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return // 주말 제외
      }
      
      quarterlyStats[quarterStr] = (quarterlyStats[quarterStr] || 0) + 1
    })
    
    return quarterlyStats
  }

  /**
   * 시간별 통계를 생성합니다 (평일만)
   */
  generateHourlyStats(releases: TimedReleaseDto[]): { [hour: string]: number } {
    const hourlyStats = {} as { [hour: string]: number }

    releases.forEach(release => {
      const date = new Date(release.published_at)
      const dayOfWeek = date.getDay()
      
      // 주말 제외
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return
      }

      const hour = date.getHours()
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1
    })

    return hourlyStats
  }

  /**
   * 업무시간 vs 기타시간 통계 (평일만)
   */
  generateBusinessHoursStats(releases: TimedReleaseDto[]): { businessHours: number, other: number } {
    let businessHours = 0
    let other = 0

    releases.forEach(release => {
      const date = new Date(release.published_at)
      const dayOfWeek = date.getDay()
      
      // 주말 제외
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return
      }

      const hour = date.getHours()
      if (hour >= 9 && hour <= 18) {
        businessHours++
      } else {
        other++
      }
    })

    return { businessHours, other }
  }

  /**
   * 종합 시간 통계 생성 (평일만)
   */
  generateComprehensiveTimeStats(releases: TimedReleaseDto[]) {
    const parsedEntries = this.parseReleases(releases)
    const baseStats = this.generateWeekdayStats(parsedEntries)
    const quarterlyStats = this.generateQuarterlyStats(parsedEntries)
    const hourlyStats = this.generateHourlyStats(releases)
    const businessHoursStats = this.generateBusinessHoursStats(releases)

    return {
      yearly: baseStats.yearly,
      quarterly: quarterlyStats,
      monthly: baseStats.monthly,
      weekly: baseStats.weekly,
      daily: baseStats.daily,
      hourly: hourlyStats,
      businessHoursVsOther: businessHoursStats
    }
  }
} 
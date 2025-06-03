import * as path from 'path'
import * as fs from 'fs'
import { ReleaseStats, ParsedReleases } from '../types/releaseStats'

const createCsvWriter = require('csv-writer').createObjectCsvWriter

export class CsvGenerator {
  private outputDir: string

  constructor() {
    this.outputDir = path.join(process.cwd(), 'data')
    this.ensureOutputDirectory()
  }

  private ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * 릴리즈 데이터로부터 통계를 생성합니다
   */
  private generateStatsFromReleases(releases: ParsedReleases): ReleaseStats {
    const stats: ReleaseStats = {
      yearly: {},
      monthly: {},
      weekly: {},
      daily: {},
    }

    releases.forEach((release) => {
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
   * 통계 데이터를 CSV 형태로 변환합니다
   */
  private convertStatsToData(stats: ReleaseStats): Array<{
    period_type: string
    period: string
    count: number
  }> {
    const data: Array<{
      period_type: string
      period: string
      count: number
    }> = []

    // 연간 통계 추가
    Object.entries(stats.yearly).forEach(([period, count]) => {
      data.push({
        period_type: 'yearly',
        period,
        count,
      })
    })

    // 월간 통계 추가
    Object.entries(stats.monthly).forEach(([period, count]) => {
      data.push({
        period_type: 'monthly',
        period,
        count,
      })
    })

    // 주간 통계 추가
    Object.entries(stats.weekly).forEach(([period, count]) => {
      data.push({
        period_type: 'weekly',
        period,
        count,
      })
    })

    // 일간 통계 추가
    Object.entries(stats.daily).forEach(([period, count]) => {
      data.push({
        period_type: 'daily',
        period,
        count,
      })
    })

    // period_type별로 그룹화하고 period로 정렬
    return data.sort((a, b) => {
      // 먼저 period_type으로 정렬 (yearly, monthly, weekly, daily 순)
      const typeOrder = ['yearly', 'monthly', 'weekly', 'daily']
      const typeComparison = typeOrder.indexOf(a.period_type) - typeOrder.indexOf(b.period_type)
      
      if (typeComparison !== 0) {
        return typeComparison
      }
      
      // 같은 타입 내에서는 period로 정렬
      return a.period.localeCompare(b.period)
    })
  }

  /**
   * 저장소별로 개별 통계 CSV 파일을 생성합니다
   */
  async generateRepoWiseCsv(rawData: ParsedReleases): Promise<string[]> {
    // 저장소별로 데이터 그룹화
    const repoGroups = rawData.reduce((acc, release) => {
      if (!acc[release.repo]) {
        acc[release.repo] = []
      }
      acc[release.repo].push(release)
      return acc
    }, {} as { [repo: string]: ParsedReleases })

    const filePaths: string[] = []

    // 각 저장소별로 통계 CSV 파일 생성
    for (const [repo, releases] of Object.entries(repoGroups)) {
      const fileName = repo.replace('/', '_') + '_stats.csv'
      const filePath = path.join(this.outputDir, fileName)
      
      // 해당 저장소의 통계 생성
      const repoStats = this.generateStatsFromReleases(releases)
      const statsData = this.convertStatsToData(repoStats)

      const csvWriter = createCsvWriter({
        path: filePath,
        header: [
          { id: 'period_type', title: 'Period Type' },
          { id: 'period', title: 'Period' },
          { id: 'count', title: 'Release Count' },
        ],
      })

      await csvWriter.writeRecords(statsData)
      filePaths.push(filePath)
    }

    return filePaths
  }

  /**
   * 전체 통계를 하나의 CSV 파일로 생성합니다
   */
  async generateUnifiedStatsCsv(stats: ReleaseStats): Promise<string> {
    const filePath = path.join(this.outputDir, 'unified_stats.csv')
    const sortedData = this.convertStatsToData(stats)

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'period_type', title: 'Period Type' },
        { id: 'period', title: 'Period' },
        { id: 'count', title: 'Release Count' },
      ],
    })

    await csvWriter.writeRecords(sortedData)
    return filePath
  }

  /**
   * 저장소별 CSV와 통합 통계 CSV를 생성합니다
   */
  async generateAllCsvFiles(rawData: ParsedReleases, stats: ReleaseStats): Promise<{
    repoFiles: string[]
    unifiedStatsFile: string
  }> {
    const [repoFiles, unifiedStatsFile] = await Promise.all([
      this.generateRepoWiseCsv(rawData),
      this.generateUnifiedStatsCsv(stats),
    ])

    return {
      repoFiles,
      unifiedStatsFile,
    }
  }
} 
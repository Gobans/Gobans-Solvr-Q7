import { FastifyRequest, FastifyReply } from 'fastify'
import { DashboardService } from '../services/dashboardService'
import { RawDataService } from '../services/rawDataService'
import { RawDataCsvGenerator } from '../utils/rawDataCsvGenerator'

export class DashboardController {
  private dashboardService: DashboardService
  private rawDataService: RawDataService
  private csvGenerator: RawDataCsvGenerator

  constructor() {
    this.dashboardService = new DashboardService()
    this.rawDataService = new RawDataService()
    this.csvGenerator = new RawDataCsvGenerator()
  }

  /**
   * 📊 통합 대시보드 데이터 조회
   * Raw 데이터 수집 + 통계 생성 + 시각화 데이터 반환
   */
  async getDashboardData(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📊 대시보드 데이터 생성 시작...')
      
      const dashboardData = await this.dashboardService.generateDashboardData()
      
      console.log(`✅ 대시보드 데이터 생성 완료 - 총 ${dashboardData.totalReleases}개 릴리즈`)
      
      return reply.code(200).send({
        success: true,
        data: dashboardData,
        message: `총 ${dashboardData.totalReleases}개 릴리즈의 대시보드 데이터를 생성했습니다.`
      })
    } catch (error) {
      console.error('❌ 대시보드 데이터 생성 실패:', error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : '대시보드 데이터 생성 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.stack : String(error)
      })
    }
  }

  /**
   * 🏢 특정 저장소의 대시보드 데이터 조회
   */
  async getRepositoryDashboard(request: FastifyRequest<{ Params: { repository: string } }>, reply: FastifyReply) {
    try {
      const { repository } = request.params
      console.log(`📊 ${repository} 저장소 대시보드 생성 시작...`)
      
      const dashboardData = await this.dashboardService.generateRepositoryDashboard(repository)
      
      console.log(`✅ ${repository} 대시보드 생성 완료 - 총 ${dashboardData.totalReleases}개 릴리즈`)
      
      return reply.code(200).send({
        success: true,
        data: dashboardData,
        repository,
        message: `${repository} 저장소의 총 ${dashboardData.totalReleases}개 릴리즈 대시보드를 생성했습니다.`
      })
    } catch (error) {
      console.error(`❌ ${request.params.repository} 대시보드 생성 실패:`, error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : '저장소 대시보드 생성 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.stack : String(error)
      })
    }
  }

  /**
   * 📄 Raw 데이터 조회 (CSV 생성용)
   */
  async generateRawDataCsv(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📄 Raw 데이터 CSV 생성 시작...')
      
      const rawReleases = await this.rawDataService.generateRawReleaseData()
      const filePath = await this.csvGenerator.generateRawDataCsv(rawReleases)
      const fileName = filePath.split('/').pop() || 'github_releases_raw.csv'
      
      return reply.code(200).send({
        success: true,
        data: {
          fileName,
          totalRecords: rawReleases.length,
          filePath
        },
        message: `CSV 파일이 생성되었습니다: ${fileName}`
      })
    } catch (error) {
      console.error('❌ Raw 데이터 CSV 생성 실패:', error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'CSV 생성 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.stack : String(error)
      })
    }
  }

  /**
   * 📊 Raw 데이터 기본 통계 조회
   */
  async getRawDataStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('📊 Raw 데이터 기본 통계 조회 시작...')
      
      const rawReleases = await this.rawDataService.generateRawReleaseData()
      
      // 기본 통계 계산
      const repositoryCount = new Set(rawReleases.map(r => r.repository_full_name)).size
      const authorCount = new Set(rawReleases.map(r => r.author.login)).size
      const stableReleases = rawReleases.filter(r => !r.draft && !r.prerelease).length
      const prereleases = rawReleases.filter(r => r.prerelease).length
      const drafts = rawReleases.filter(r => r.draft).length
      
      const stats = {
        totalReleases: rawReleases.length,
        repositoryCount,
        authorCount,
        releasesByType: {
          stable: stableReleases,
          prerelease: prereleases,
          draft: drafts
        },
        hasData: rawReleases.length > 0
      }
      
      return reply.code(200).send({
        success: true,
        data: stats,
        message: `Raw 데이터 통계를 조회했습니다. 총 ${stats.totalReleases}개 릴리즈`
      })
    } catch (error) {
      console.error('❌ Raw 데이터 통계 조회 실패:', error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : 'Raw 데이터 통계 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.stack : String(error)
      })
    }
  }

  /**
   * 🔄 데이터 새로고침 (Raw 데이터 재수집 + 통계 재생성)
   */
  async refreshData(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log('🔄 전체 데이터 새로고침 시작...')
      
      // 0. 캐시 무효화 먼저
      this.dashboardService.invalidateCache()
      
      // 1. Raw 데이터 재수집 (캐시 없으므로 GitHub API 호출)
      const rawDataResult = await this.rawDataService.generateRawReleaseData()
      console.log(`✅ Raw 데이터 수집 완료: ${rawDataResult.length}개 릴리즈`)
      
      // 2. 대시보드 통계 재생성 (캐시 새로 생성됨)
      const dashboardData = await this.dashboardService.generateDashboardData()
      console.log(`✅ 대시보드 통계 생성 완료`)
      
      // 3. CSV 파일도 재생성
      const csvFilePath = await this.csvGenerator.generateRawDataCsv(rawDataResult)
      const csvFileName = csvFilePath.split('/').pop() || 'github_releases_raw.csv'
      console.log(`✅ CSV 파일 재생성 완료: ${csvFileName}`)
      
      return reply.code(200).send({
        success: true,
        data: {
          rawDataCount: rawDataResult.length,
          dashboardStats: {
            totalReleases: dashboardData.totalReleases,
            dateRange: dashboardData.dateRange
          },
          csvFile: {
            fileName: csvFileName,
            totalRecords: rawDataResult.length
          }
        },
        message: `데이터 새로고침 완료. 총 ${rawDataResult.length}개 릴리즈 처리`
      })
    } catch (error) {
      console.error('❌ 데이터 새로고침 실패:', error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : '데이터 새로고침 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.stack : String(error)
      })
    }
  }

  /**
   * 🗃️ 캐시 상태 조회
   */
  async getCacheStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cacheStatus = this.dashboardService.getCacheStatus()
      
      return reply.code(200).send({
        success: true,
        data: {
          ...cacheStatus,
          totalSizeKB: Math.round(cacheStatus.totalSize / 1024)
        },
        message: `캐시 상태: 메모리 ${cacheStatus.memoryKeys.length}개, 디스크 ${cacheStatus.diskFiles.length}개`
      })
    } catch (error) {
      console.error('❌ 캐시 상태 조회 실패:', error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : '캐시 상태 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.stack : String(error)
      })
    }
  }

  /**
   * 🧹 캐시 무효화
   */
  async invalidateCache(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.dashboardService.invalidateCache()
      
      return reply.code(200).send({
        success: true,
        message: '모든 캐시가 무효화되었습니다. 다음 요청 시 새로운 데이터를 가져옵니다.'
      })
    } catch (error) {
      console.error('❌ 캐시 무효화 실패:', error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : '캐시 무효화 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.stack : String(error)
      })
    }
  }

  /**
   * 🎯 특정 캐시 무효화
   */
  async invalidateSpecificCache(
    request: FastifyRequest<{ 
      Params: { type: 'raw-data' | 'dashboard' | 'repository-dashboard' }
      Querystring: { repository?: string }
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { type } = request.params
      const { repository } = request.query

      if (type === 'repository-dashboard' && !repository) {
        return reply.code(400).send({
          success: false,
          message: 'repository-dashboard 타입의 경우 repository 쿼리 파라미터가 필요합니다.'
        })
      }

      this.dashboardService.invalidateSpecificCache(type, repository)
      
      const target = repository ? `${type} (${repository})` : type
      return reply.code(200).send({
        success: true,
        message: `${target} 캐시가 무효화되었습니다.`
      })
    } catch (error) {
      console.error('❌ 특정 캐시 무효화 실패:', error)
      return reply.code(500).send({
        success: false,
        message: error instanceof Error ? error.message : '캐시 무효화 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.stack : String(error)
      })
    }
  }
} 
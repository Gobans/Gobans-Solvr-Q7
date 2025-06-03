import { FastifyRequest, FastifyReply } from 'fastify'
import { createSuccessResponse, createErrorResponse } from '../utils/response'
import { ReleaseService } from '../services/releaseService'
import { CsvGenerator } from '../utils/csvGenerator'

type ReleaseControllerDeps = {
  releaseService: ReleaseService
  csvGenerator: CsvGenerator
}

export const createReleaseController = ({ releaseService, csvGenerator }: ReleaseControllerDeps) => {
  /**
   * 릴리즈 통계를 생성하고 CSV 파일로 저장합니다
   */
  const generateReleaseStats = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.log.info('릴리즈 통계 생성을 시작합니다...')
      
      // 릴리즈 데이터 가져오기 및 통계 생성
      const { rawData, stats } = await releaseService.generateReleaseStats()
      
      request.log.info(`총 ${rawData.length}개의 릴리즈 데이터를 처리했습니다.`)
      
      // CSV 파일 생성 (저장소별 + 통합 통계)
      const csvFiles = await csvGenerator.generateAllCsvFiles(rawData, stats)
      
      // 저장소별 릴리즈 수 계산
      const repoStats = rawData.reduce((acc, release) => {
        acc[release.repo] = (acc[release.repo] || 0) + 1
        return acc
      }, {} as { [repo: string]: number })
      
      request.log.info('CSV 파일 생성이 완료되었습니다.')
      
      return reply.code(200).send(
        createSuccessResponse(
          {
            summary: {
              totalReleases: rawData.length,
              repositoryStats: repoStats,
              yearlyStats: stats.yearly,
              monthlyStats: stats.monthly,
              weeklyStats: stats.weekly,
              dailyStats: stats.daily,
            },
            csvFiles: {
              repositoryFiles: csvFiles.repoFiles,
              unifiedStatsFile: csvFiles.unifiedStatsFile,
            },
          },
          '릴리즈 통계가 성공적으로 생성되었습니다.'
        )
      )
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send(createErrorResponse('릴리즈 통계 생성에 실패했습니다.'))
    }
  }
  
  return {
    generateReleaseStats
  }
}

export type ReleaseController = ReturnType<typeof createReleaseController> 
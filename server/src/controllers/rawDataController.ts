import { FastifyRequest, FastifyReply } from 'fastify'
import { createSuccessResponse, createErrorResponse } from '../utils/response'
import { RawDataService } from '../services/rawDataService'
import { RawDataCsvGenerator } from '../utils/rawDataCsvGenerator'

type RawDataControllerDeps = {
  rawDataService: RawDataService
  csvGenerator: RawDataCsvGenerator
}

export const createRawDataController = ({ rawDataService, csvGenerator }: RawDataControllerDeps) => {
  /**
   * GitHub API에서 raw 데이터를 가져와서 CSV 파일로 생성합니다
   */
  const generateRawDataCsv = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.log.info('GitHub raw 데이터 수집을 시작합니다...')
      
      // GitHub API에서 raw 데이터 가져오기
      const rawData = await rawDataService.generateRawReleaseData()
      
      request.log.info(`총 ${rawData.length}개의 릴리즈 데이터를 처리했습니다.`)
      
      // CSV 파일 생성
      const csvFilePath = await csvGenerator.generateRawDataCsv(rawData)
      
      // 기본 통계
      const repoStats = rawData.reduce((acc, release) => {
        const repo = release.html_url.split('/').slice(-4, -2).join('/')
        acc[repo] = (acc[repo] || 0) + 1
        return acc
      }, {} as { [repo: string]: number })

      const totalDownloads = rawData.reduce((sum, release) => 
        sum + release.assets.reduce((assetSum, asset) => assetSum + asset.download_count, 0), 0)

      request.log.info('Raw 데이터 CSV 파일 생성이 완료되었습니다.')
      
      return reply.code(200).send(
        createSuccessResponse(
          {
            summary: {
              totalReleases: rawData.length,
              repositoryStats: repoStats,
              totalDownloads,
              dataCollectedAt: new Date().toISOString(),
            },
            csvFile: {
              path: csvFilePath,
              filename: 'github_releases_raw.csv'
            },
          },
          'GitHub raw 데이터가 성공적으로 CSV 파일로 생성되었습니다.'
        )
      )
    } catch (error) {
      request.log.error(error)
      return reply.code(500).send(createErrorResponse('Raw 데이터 CSV 생성에 실패했습니다.'))
    }
  }

  return {
    generateRawDataCsv
  }
}

export type RawDataController = ReturnType<typeof createRawDataController> 
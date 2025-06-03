import { FastifyInstance } from 'fastify'
import { createReleaseController } from '../controllers/releaseController'
import { ReleaseService } from '../services/releaseService'
import { CsvGenerator } from '../utils/csvGenerator'

// 릴리즈 통계 관련 라우트 등록
export const createReleaseRoutes = () => async (fastify: FastifyInstance) => {
  const releaseService = new ReleaseService()
  const csvGenerator = new CsvGenerator()
  const releaseController = createReleaseController({ releaseService, csvGenerator })

  // 모든 저장소의 릴리즈 통계 생성 (CSV 파일 포함)
  fastify.post('/generate', releaseController.generateReleaseStats)
} 
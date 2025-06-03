import { FastifyInstance } from 'fastify'
import { createRawDataController } from '../controllers/rawDataController'
import { RawDataService } from '../services/rawDataService'
import { RawDataCsvGenerator } from '../utils/rawDataCsvGenerator'

// Raw 데이터 관련 라우트 등록
export const createRawDataRoutes = () => async (fastify: FastifyInstance) => {
  const rawDataService = new RawDataService()
  const csvGenerator = new RawDataCsvGenerator()
  const rawDataController = createRawDataController({ rawDataService, csvGenerator })

  // GitHub API에서 raw 데이터를 가져와서 CSV로 생성
  fastify.post('/generate-csv', rawDataController.generateRawDataCsv)
  
} 
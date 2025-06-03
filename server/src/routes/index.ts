import { FastifyInstance } from 'fastify'
import { AppContext } from '../types/context'
import { createUserRoutes } from './userRoutes'
import { createReleaseRoutes } from './releaseRoutes'
import { createRawDataRoutes } from './rawDataRoutes'
import healthRoutes from './healthRoutes'
import dashboardRoutes from './dashboardRoutes'

// 모든 라우트 등록
export const createRoutes = (context: AppContext) => async (fastify: FastifyInstance) => {
  // 헬스 체크 라우트
  fastify.register(healthRoutes, { prefix: '/api/health' })

  // 사용자 관련 라우트
  fastify.register(createUserRoutes(context), { prefix: '/api/users' })

  // 릴리즈 통계 관련 라우트
  fastify.register(createReleaseRoutes(), { prefix: '/api/releases' })

  // Raw 데이터 관련 라우트
  fastify.register(createRawDataRoutes(), { prefix: '/api/raw-data' })

  // 🚀 통합 대시보드 라우트 (Raw 데이터 + 시각화 통계)
  fastify.register(dashboardRoutes)
}

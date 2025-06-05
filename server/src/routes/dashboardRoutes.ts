import { FastifyInstance } from 'fastify'
import { DashboardController } from '../controllers/dashboardController'

export default async function dashboardRoutes(fastify: FastifyInstance) {
  const controller = new DashboardController()

  // 📊 통합 대시보드 데이터 API
  fastify.get('/api/dashboard', {
    schema: {
      description: '통합 대시보드 데이터 조회 - Raw 데이터 기반 시각화 통계',
      tags: ['Dashboard'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.getDashboardData.bind(controller))

  // 🏢 특정 저장소 대시보드 API
  fastify.get('/api/dashboard/repository/:repository', {
    schema: {
      description: '특정 저장소의 대시보드 데이터 조회',
      tags: ['Dashboard'],
      params: {
        type: 'object',
        properties: {
          repository: { type: 'string', description: '저장소명 (예: daangn/stackflow)' }
        },
        required: ['repository']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            repository: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.getRepositoryDashboard.bind(controller))

  // 📊 Raw 데이터 기본 통계 API
  fastify.get('/api/dashboard/raw-stats', {
    schema: {
      description: 'Raw 데이터 기본 통계 조회',
      tags: ['Dashboard', 'Raw Data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalReleases: { type: 'number' },
                repositoryCount: { type: 'number' },
                authorCount: { type: 'number' },
                releasesByType: {
                  type: 'object',
                  properties: {
                    stable: { type: 'number' },
                    prerelease: { type: 'number' },
                    draft: { type: 'number' }
                  }
                },
                hasData: { type: 'boolean' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.getRawDataStats.bind(controller))

  // 🔄 데이터 새로고침 API
  fastify.post('/api/dashboard/refresh', {
    schema: {
      description: '전체 데이터 새로고침 - Raw 데이터 재수집 + 통계 재생성',
      tags: ['Dashboard'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.refreshData.bind(controller))

  // 🗃️ 캐시 상태 조회 API
  fastify.get('/api/dashboard/cache/status', {
    schema: {
      description: '캐시 상태 조회 - 메모리, 디스크 캐시 정보',
      tags: ['Dashboard', 'Cache'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                memoryKeys: { type: 'array', items: { type: 'string' } },
                diskFiles: { type: 'array', items: { type: 'string' } },
                totalSize: { type: 'number' },
                totalSizeKB: { type: 'number' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.getCacheStatus.bind(controller))

  // 🧹 모든 캐시 무효화 API
  fastify.delete('/api/dashboard/cache', {
    schema: {
      description: '모든 캐시 무효화 - 다음 요청 시 새로운 데이터 가져옴',
      tags: ['Dashboard', 'Cache'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.invalidateCache.bind(controller))

  // 🎯 특정 캐시 무효화 API
  fastify.delete('/api/dashboard/cache/:type', {
    schema: {
      description: '특정 타입의 캐시 무효화',
      tags: ['Dashboard', 'Cache'],
      params: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['raw-data', 'dashboard', 'repository-dashboard'],
            description: '캐시 타입'
          }
        },
        required: ['type']
      },
      querystring: {
        type: 'object',
        properties: {
          repository: { 
            type: 'string', 
            description: 'repository-dashboard 타입인 경우 저장소명 (예: daangn/stackflow)'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.invalidateSpecificCache.bind(controller))
} 
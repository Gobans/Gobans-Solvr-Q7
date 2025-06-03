import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { DashboardSummary, DashboardApiResponse } from '../types/dashboard'

const COLORS = {
  primary: '#f97316', // orange-500
  secondary: '#3b82f6', // blue-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#06b6d4', // cyan-500
  purple: '#8b5cf6', // violet-500
  pink: '#ec4899', // pink-500
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('대시보드 데이터를 불러오는데 실패했습니다')
      }
      const result: DashboardApiResponse = await response.json()
      
      console.log('result', result)

      if (result.success && result.data) {
        setData(result.data)
      } else {
        throw new Error(result.message || '데이터를 불러올 수 없습니다')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">데이터를 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">데이터가 없습니다</div>
      </div>
    )
  }

  // 차트 데이터 변환 함수들
  const prepareTimeSeriesData = (timeData: { [key: string]: number }) => {
    return Object.entries(timeData)
      .map(([key, value]) => ({ period: key, releases: value }))
      .sort((a, b) => a.period.localeCompare(b.period))
  }

  const prepareHourlyData = () => {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}시`,
      releases: data.releasesByTimeUnit.hourly[hour] || 0
    }))
  }

  const prepareVersionTypeData = () => {
    return [
      { name: 'Major', value: data.versionTypeDistribution.major, color: COLORS.danger },
      { name: 'Minor', value: data.versionTypeDistribution.minor, color: COLORS.warning },
      { name: 'Patch', value: data.versionTypeDistribution.patch, color: COLORS.success },
      { name: 'Prerelease', value: data.versionTypeDistribution.prerelease, color: COLORS.info }
    ]
  }

  const prepareReleaseTypeData = () => {
    return [
      { name: 'Stable', value: data.releasesByType.stable, color: COLORS.success },
      { name: 'Prerelease', value: data.releasesByType.prerelease, color: COLORS.warning },
      { name: 'Draft', value: data.releasesByType.draft, color: COLORS.danger }
    ]
  }

  const prepareBranchData = () => {
    return data.branchStats.topBranches.map((branch, index) => ({
      name: branch.branch,
      releases: branch.releaseCount,
      percentage: branch.percentage,
      color: Object.values(COLORS)[index % Object.values(COLORS).length]
    }))
  }

  const yearlyData = prepareTimeSeriesData(data.releasesByTimeUnit.yearly)
  const monthlyData = prepareTimeSeriesData(data.releasesByTimeUnit.monthly)
  const dailyData = prepareTimeSeriesData(data.releasesByTimeUnit.daily).slice(-30) // 최근 30일
  const hourlyData = prepareHourlyData()
  const versionTypeData = prepareVersionTypeData()
  const releaseTypeData = prepareReleaseTypeData()
  const branchData = prepareBranchData()

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">당근마켓 릴리즈 대시보드</h1>
        <p className="text-gray-600">
          {data.dateRange.earliest ? new Date(data.dateRange.earliest).toLocaleDateString() : ''} ~ 
          {data.dateRange.latest ? new Date(data.dateRange.latest).toLocaleDateString() : ''}
        </p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">총 릴리즈</h3>
          <p className="text-3xl font-bold text-gray-900">{data.totalReleases.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">고유 작성자</h3>
          <p className="text-3xl font-bold text-blue-600">{data.authorStats.totalAuthors}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">업무시간 릴리즈</h3>
          <p className="text-3xl font-bold text-green-600">{data.releasesByTimeUnit.businessHoursVsOther.businessHours}</p>
          <p className="text-sm text-gray-500">전체의 {Math.round((data.releasesByTimeUnit.businessHoursVsOther.businessHours / data.totalReleases) * 100)}%</p>
        </div>
      </div>

      {/* 시간별 통계 차트 - 년/월/일별 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 연도별 릴리즈 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">연도별 릴리즈</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="releases" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 월별 릴리즈 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">월별 릴리즈</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="releases" stroke={COLORS.secondary} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 최근 30일 일별 릴리즈 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 30일 릴리즈</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="releases" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 시간대별 및 파이 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* 시간대별 릴리즈 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">시간대별 릴리즈</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="releases" fill={COLORS.info} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 브랜치별 릴리즈 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">브랜치별 릴리즈</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchData.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="releases" fill={COLORS.purple} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 버전 타입 분포 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">버전 타입 분포</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={versionTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {versionTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 릴리즈 타입 분포 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">릴리즈 상태 분포</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={releaseTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {releaseTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 작성자 및 콘텐츠 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 상위 작성자 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">상위 작성자</h2>
          <div className="space-y-3">
            {data.authorStats.topAuthors.slice(0, 10).map((author, index) => (
              <div key={author.login} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{author.login}</div>
                    <div className="text-sm text-gray-500">{author.type}</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900">{author.releaseCount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 브랜치별 상세 통계 */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">브랜치별 통계</h2>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">총 {data.branchStats.totalBranches}개 브랜치</div>
            {data.branchStats.topBranches.slice(0, 8).map((branch, index) => (
              <div key={branch.branch} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{branch.branch}</div>
                    <div className="text-sm text-gray-500">{branch.percentage}%</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900">{branch.releaseCount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 기타 통계 */}
        <div className="space-y-6">
          {/* Bot vs Human */}
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">작성자 유형</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{data.authorStats.botVsHumanRatio.humans}</div>
                <div className="text-sm text-gray-500">Human</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{data.authorStats.botVsHumanRatio.bots}</div>
                <div className="text-sm text-gray-500">Bot</div>
              </div>
            </div>
          </div>

          {/* 콘텐츠 통계 */}
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">콘텐츠 통계</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">평균 릴리즈 노트 길이</span>
                <span className="font-semibold">{Math.round(data.contentStats.averageReleaseNoteLength)}자</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">릴리즈 노트 작성 비율</span>
                <span className="font-semibold">{Math.round(data.contentStats.releaseNoteCoverage * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 다운로드</span>
                <span className="font-semibold">{data.assetStats.totalDownloads.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
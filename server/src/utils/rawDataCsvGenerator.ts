import * as path from 'path'
import * as fs from 'fs'
import { GitHubReleaseRaw } from '../types/rawReleaseData'

const createCsvWriter = require('csv-writer').createObjectCsvWriter

export class RawDataCsvGenerator {
  private outputDir: string

  constructor() {
    this.outputDir = path.join(process.cwd(), 'data')
    this.ensureOutputDirectory()
  }

  /**
   * 출력 디렉토리가 존재하는지 확인하고 없으면 생성합니다
   */
  private ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * GitHub API Raw 데이터를 CSV로 저장합니다
   */
  async generateRawDataCsv(rawReleases: GitHubReleaseRaw[]): Promise<string> {
    const filePath = path.join(this.outputDir, 'github_releases_raw.csv')

    // Raw 데이터를 플랫한 구조로 변환
    const flattenedData = rawReleases.map(release => ({
      // 저장소 정보를 맨 앞에
      repository_full_name: release.repository_full_name,
      
      // 기본 정보
      release_id: release.release_id,
      tag_name: release.tag_name,
      name: release.name || '',
      body: (release.body || '').replace(/\n/g, ' ').replace(/,/g, ';'), // CSV 안전화
      draft: release.draft,
      prerelease: release.prerelease,
      created_at: release.created_at,
      published_at: release.published_at || '',
      target_commitish: release.target_commitish,
      
      // 작성자 정보
      author_login: release.author.login,
      author_id: release.author.id,
      author_type: release.author.type,
      author_avatar_url: release.author.avatar_url,
      author_site_admin: release.author.site_admin,
      
      // URL 정보
      html_url: release.html_url,
      api_url: release.url,
      tarball_url: release.tarball_url,
      zipball_url: release.zipball_url,
      
      // Assets 정보 (요약)
      assets_count: release.assets.length,
      total_downloads: release.assets.reduce((sum, asset) => sum + asset.download_count, 0),
      total_asset_size: release.assets.reduce((sum, asset) => sum + asset.size, 0),
    }))

    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'repository_full_name', title: 'Repository Full Name' },
        { id: 'release_id', title: 'Release ID' },
        { id: 'tag_name', title: 'Tag Name' },
        { id: 'name', title: 'Release Name' },
        { id: 'body', title: 'Release Notes' },
        { id: 'draft', title: 'Is Draft' },
        { id: 'prerelease', title: 'Is Prerelease' },
        { id: 'created_at', title: 'Created At' },
        { id: 'published_at', title: 'Published At' },
        { id: 'target_commitish', title: 'Target Branch' },
        { id: 'author_login', title: 'Author Login' },
        { id: 'author_id', title: 'Author ID' },
        { id: 'author_type', title: 'Author Type' },
        { id: 'author_avatar_url', title: 'Author Avatar URL' },
        { id: 'author_site_admin', title: 'Is Site Admin' },
        { id: 'html_url', title: 'Release URL' },
        { id: 'api_url', title: 'API URL' },
        { id: 'tarball_url', title: 'Tarball URL' },
        { id: 'zipball_url', title: 'Zipball URL' },
        { id: 'assets_count', title: 'Assets Count' },
        { id: 'total_downloads', title: 'Total Downloads' },
        { id: 'total_asset_size', title: 'Total Asset Size (bytes)' },
      ],
    })

    await csvWriter.writeRecords(flattenedData)
    return filePath
  }
} 
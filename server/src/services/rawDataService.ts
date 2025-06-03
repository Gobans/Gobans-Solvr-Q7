import { GitHubReleaseRaw } from '../types/rawReleaseData'

export class RawDataService {
  private octokit: any

  constructor() {
    this.initOctokit()
  }

  private async initOctokit() {
    const { Octokit } = await import('octokit')
    this.octokit = new Octokit({
      // GitHub Personal Access Token이 필요한 경우 환경변수에서 가져올 수 있습니다
      // auth: process.env.GITHUB_TOKEN,
    })
  }

  /**
   * GitHub 저장소에서 완전한 릴리즈 데이터를 가져옵니다 (assets 포함)
   */
  async fetchFullReleaseData(owner: string, repo: string): Promise<GitHubReleaseRaw[]> {
    if (!this.octokit) {
      await this.initOctokit()
    }

    try {
      const releases = await this.octokit.paginate(
        this.octokit.rest.repos.listReleases,
        {
          owner,
          repo,
          per_page: 100,
        }
      )

      // GitHub API 응답을 우리 타입에 맞게 변환
      return releases.map((release: any): GitHubReleaseRaw => ({
        repository_full_name: `${owner}/${repo}`,
        url: release.url,
        assets_url: release.assets_url,
        upload_url: release.upload_url,
        html_url: release.html_url,
        release_id: release.id,
        author: {
          login: release.author.login,
          id: release.author.id,
          node_id: release.author.node_id,
          avatar_url: release.author.avatar_url,
          gravatar_id: release.author.gravatar_id || '',
          url: release.author.url,
          html_url: release.author.html_url,
          followers_url: release.author.followers_url,
          following_url: release.author.following_url,
          gists_url: release.author.gists_url,
          starred_url: release.author.starred_url,
          subscriptions_url: release.author.subscriptions_url,
          organizations_url: release.author.organizations_url,
          repos_url: release.author.repos_url,
          events_url: release.author.events_url,
          received_events_url: release.author.received_events_url,
          type: release.author.type,
          user_view_type: release.author.user_view_type,
          site_admin: release.author.site_admin
        },
        node_id: release.node_id,
        tag_name: release.tag_name,
        target_commitish: release.target_commitish,
        name: release.name,
        draft: release.draft,
        prerelease: release.prerelease,
        created_at: release.created_at,
        published_at: release.published_at,
        assets: release.assets.map((asset: any) => ({
          url: asset.url,
          id: asset.id,
          node_id: asset.node_id,
          name: asset.name,
          label: asset.label,
          uploader: asset.uploader,
          content_type: asset.content_type,
          state: asset.state,
          size: asset.size,
          download_count: asset.download_count,
          created_at: asset.created_at,
          updated_at: asset.updated_at,
          browser_download_url: asset.browser_download_url
        })),
        tarball_url: release.tarball_url,
        zipball_url: release.zipball_url,
        body: release.body,
      }))
    } catch (error) {
      console.error(`Error fetching releases for ${owner}/${repo}:`, error)
      throw new Error(`Failed to fetch releases for ${owner}/${repo}`)
    }
  }

  /**
   * 여러 저장소에서 raw 데이터를 가져옵니다
   */
  async fetchMultipleRepoRawData(repos: Array<{ owner: string; repo: string }>): Promise<GitHubReleaseRaw[]> {
    const allReleases: GitHubReleaseRaw[] = []

    for (const { owner, repo } of repos) {
      const releases = await this.fetchFullReleaseData(owner, repo)
      allReleases.push(...releases)
    }

    return allReleases
  }

  /**
   * 기본 저장소들에서 raw 데이터를 가져옵니다
   */
  async generateRawReleaseData(): Promise<GitHubReleaseRaw[]> {
    // 기본 저장소들
    const repos = [
      { owner: 'daangn', repo: 'stackflow' },
      { owner: 'daangn', repo: 'seed-design' },
    ]

    const rawReleases = await this.fetchMultipleRepoRawData(repos)
    return rawReleases
  }
} 
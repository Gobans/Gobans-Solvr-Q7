# 당근 대시보드

## 프로젝트 개요

<br/>

Github 릴리즈 데이터를 분석하여 팀의 개발 활동을 모니터링하는 도구예요

<br/>

<img width="1502" alt="스크린샷 2025-06-03 오후 9 10 21" src="https://github.com/user-attachments/assets/72d185be-4c6c-4a54-acd6-3cbfc361b834" />
<img width="1502" alt="image" src="https://github.com/user-attachments/assets/168d1574-b803-4d98-a4d1-3cc9995f8702" />



<br/>

## Features

### 우리팀의 릴리즈 트랙킹 📈

1. 레포지토리의 총 릴리즈 횟수, 고유 작성자
> 팀에서 여태 릴리즈한 횟수와 사람들의 수를 기념해요

<br/>

2. 업무시간(9 to 6)에 릴리즈 된 횟수를 확인할 수 있어요
> 업무 시간을 벗어난 릴리즈가 많다면 이유가 왜일지 점검해볼 수 있어요

<br/>

3. 연도, 월별, 최근 30일, 시간대 별 릴리즈 횟수를 확인할 수 있어요
> 릴리즈가 몰려있는 구간이 있을 수 있어요
> 이유가 있다면, 왜일지, 문제가 없는지 점검해볼 수 있어요

<br/>

4. 릴리즈되는 브랜치와 횟수를 확인할 수 있어요.
> 릴리즈 전략에 따라 브랜치를 잘 사용하고있는지 점검해볼 수 있어요

<br/>
<br/>

### 우리팀의 릴리즈 상태는? 🛠️
1. 릴리즈 버전의 분포를 확인할 수 있어요. (Major, Minor, Patch, Prerelease)
2. 릴리즈 상태의 분포를 확인할 수 있어요. (Stable, Prerelease, Draft)

> 릴리즈 버전과 상태가 잘 관리되고 있는지 점검해볼 수 있어요

<br/>
<br/>

### 우리팀에서 릴리즈를 담당하는자는 누구? 🧑‍💻
1. 많이 릴리즈한 사람의 순위, 유형을 확인할 수 있어요.
> 특정 사람이 릴리즈를 너무 도맡아서 하고있는 것이 아닌지 점검해볼 필요가 있어요
> 혹은 영광의 자리를 기념할 수 있어요 👑

<br/>
<br/>

### 릴리즈 노트 잘 작성되고 있나요? 📝
1. 평균 릴리즈 노트 길이와 작성 비율을 확인할 수 있어요.
> 너무 길게 쓰는건 아닌지, 혹은 너무 안쓰는게 아닌지 점검해볼 수 있어요


## changeLog

### V1
- Github API를 통해 release 데이터 패치
- release raw data를 차트 데이터로 변환하여 시각화
- 차트 데이터와 raw data 캐싱 (30분)


## 기술 스택

### 공통

- 패키지 매니저: pnpm (workspace 기능 활용)
- 언어: TypeScript
- Node.js 버전: 22.x
- 테스트: Vitest
- 코드 품질: Prettier

### 클라이언트

- 프레임워크: React
- 빌드 도구: Vite
- 라우팅: React Router
- 스타일링: TailwindCSS
- 차트: recharts

### 서버

- 프레임워크: Fastify
- 데이터베이스: SQLite with DirzzleORM

## 설치 및 실행

### 초기 설치

```bash
# 프로젝트 루트 디렉토리에서 실행
pnpm install
```

### 개발 서버 실행

```bash
# 클라이언트 및 서버 동시 실행
pnpm dev

# 클라이언트만 실행
pnpm dev:client

# 서버만 실행
pnpm dev:server
```

### 테스트 실행

```bash
# 클라이언트 테스트
pnpm test:client

# 서버 테스트
pnpm test:server

# 모든 테스트 실행
pnpm test
```

### 빌드

```bash
# 클라이언트 및 서버 빌드
pnpm build
```

## 환경 변수 설정

- 클라이언트: `client/.env` 파일에 설정 (예시는 `client/.env.example` 참조)
- 서버: `server/.env` 파일에 설정 (예시는 `server/.env.example` 참조)

## API 엔드포인트

서버는 다음과 같은 기본 API 엔드포인트를 제공합니다:

- `GET /api/health`: 서버 상태 확인
- `GET /api/users`: 유저 목록 조회
- `GET /api/users/:id`: 특정 유저 조회
- `POST /api/users`: 새 유저 추가
- `PUT /api/users/:id`: 유저 정보 수정
- `DELETE /api/users/:id`: 유저 삭제

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

1. 레포지토리의 총 릴리즈 횟수, 고유 작성자, 업무시간(9 to 6)에 릴리즈 된 횟수를 확인할 수 있어요.
2. 연도, 월별, 최근 30일, 시간대 별 릴리즈 횟수를 확인할 수 있어요.
3. 릴리즈되는 브랜치와 횟수를 확인할 수 있어요.


### 우리팀의 릴리즈 상태는? 🛠️
1. 릴리즈 버전의 분포를 확인할 수 있어요. (Major, Minor, Patch, Prerelease)
2. 릴리즈 상태의 분포를 확인할 수 있어요. (Stable, Prerelease, Draft)

### 우리팀에서 릴리즈를 담당하는자는 누구? 🧑‍💻
1. 많이 릴리즈한 사람의 순위, 유형을 확인할 수 있어요.



<br/>



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

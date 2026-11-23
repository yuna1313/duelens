# DueLens

프론트엔드와 백엔드를 하나의 Git 저장소에서 관리하는 프로젝트입니다.
Git 저장소 루트는 현재 `duelens/` 폴더입니다.

## 폴더 구성

```text
duelens/
├── frontend/             # React + TypeScript + Vite 애플리케이션
│   ├── src/              # 화면 및 프론트엔드 소스
│   ├── index.html
│   ├── package.json      # 프론트엔드 의존성 및 명령
│   ├── eslint.config.js
│   ├── tsconfig*.json
│   └── vite.config.ts
├── backend/              # Java + Spring Boot 백엔드
├── package.json          # npm 워크스페이스 및 공통 실행 진입점
├── package-lock.json     # npm 의존성 잠금 파일
├── .editorconfig
├── .gitignore
├── .nvmrc
├── AGENTS.md
└── README.md
```

`node_modules/`는 npm이 생성하는 의존성 폴더이며 Git에서 제외합니다.
프론트엔드 빌드 결과는 `frontend/dist/`에 생성되며 Git에서 제외합니다.

## 프론트엔드 개발 환경

- Node.js 26 LTS (`.nvmrc`에 버전 고정)
- npm workspaces
- React + TypeScript (엄격한 타입 검사)
- Vite + ESLint

## 설치 및 실행

저장소 루트에서 실행합니다.

```sh
npm ci
npm run dev
```

프론트엔드 개발 서버는 <http://localhost:5173>에서 실행됩니다.
루트 명령은 `@duelens/frontend` 워크스페이스의 명령을 실행합니다.

## 과목·수업 관리

첫 화면에서 학교 연결 없이 과목을 직접 등록하고 수정할 수 있습니다.

- 연도·학기, 과목명, 분반을 등록하며 같은 학기의 동일 과목·분반 중복은 막습니다. 다른 학기나 분반은 별개로 관리합니다.
- 수업 요일과 시작 시각은 함께 입력하거나 모두 비울 수 있습니다. 시간표가 정해지지 않은 과목에 임의의 시간을 붙이지 않습니다.
- 학기별로 목록을 조회하며, 새로고침하면 과목과 선택한 학기가 복원됩니다. 날짜와 수업 시각은 한국 표준시(UTC+9)를 기준으로 합니다.
- 다른 창에서 먼저 수정된 내용을 감지하면 저장된 내용을 다시 불러오도록 안내합니다. 저장 실패 시 성공 메시지를 표시하지 않고 입력을 유지합니다.

과목 정보는 현재 브라우저의 `localStorage`에 저장됩니다. 브라우저·프로필·접속 주소가 다르면 별도 데이터이며, 브라우저 데이터를 삭제하면 기록도 삭제됩니다.
손상되었거나 지원하지 않는 형식의 저장 데이터는 자동으로 초기화하거나 덮어쓰지 않습니다.
현재 백엔드에는 기동 상태 확인만 구현되어 있으며, 과목 API·데이터베이스·기기 간 동기화와 마감 표현 해석은 아직 구현하지 않았습니다.

## 검증 및 빌드

저장소 루트에서 실행합니다.

```sh
npm run typecheck
npm run lint
npm run test --workspace @duelens/frontend
npm run build
npm run preview
```

현재 위 명령은 프론트엔드를 대상으로 합니다.
`build`는 타입 검사 후 `frontend/dist/`에 배포용 파일을 생성합니다.
`preview`는 빌드 결과를 로컬에서 확인할 때 사용합니다.
과목 테스트는 Node.js 기본 테스트 실행기로 등록 중복, 시간표 검증, 수정 충돌, 저장 복원 및 저장 실패 처리를 확인합니다.
백엔드는 별도 터미널에서 실행합니다.

```sh
npm run dev:backend
npm run test:backend
npm run build:backend
```

백엔드는 JDK 25 이상에서 Java 25 호환으로 빌드하며 Gradle Wrapper를 사용합니다.
기동 상태는 <http://127.0.0.1:8080/api/health>에서 확인할 수 있습니다.
프론트엔드 개발 서버의 `/api` 요청은 백엔드로 전달됩니다.
자세한 내용은 [백엔드 개발 안내](backend/README.md)를 참고합니다.

## 프론트엔드 의존성 추가

```sh
npm install <패키지명> --workspace @duelens/frontend
npm install -D <개발용-패키지명> --workspace @duelens/frontend
```

의존성 변경 시 `frontend/package.json`과 루트 `package-lock.json`을 함께 커밋합니다.
잠금 파일과 의존성 설치는 저장소 루트에서 관리합니다.

## 소스 및 환경 변수

프론트엔드의 `@/`는 `frontend/src/`를 가리킵니다.
예: `import App from '@/App'`.

프론트엔드 환경 변수는 `frontend/.env.local`에 작성합니다.
브라우저에서 사용하는 값은 `VITE_` 접두사가 필요하며 빌드 결과에 공개되므로 비밀키를 넣지 않습니다.
환경 변수 파일은 Git에서 제외하고, 공유할 형식은 `frontend/.env.example`에 작성합니다.

## Git 및 배포 대상

- `feature/<기능명>`: 기능 개발
- `develop`: 최종 개발 테스트 환경
- `master`: 운영 환경

프론트엔드와 백엔드는 동일한 저장소에서 관리하며 각각 빌드·배포할 수 있도록 구성합니다.
자동 배포 파이프라인은 아직 설정하지 않았습니다.

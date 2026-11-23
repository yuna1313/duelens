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
├── backend/              # 백엔드 개발 공간 (기술 스택 미정)
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

## 검증 및 빌드

저장소 루트에서 실행합니다.

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

현재 위 명령은 프론트엔드를 대상으로 합니다.
`build`는 타입 검사 후 `frontend/dist/`에 배포용 파일을 생성합니다.
`preview`는 빌드 결과를 로컬에서 확인할 때 사용합니다.
백엔드의 실행·검증·배포 명령은 기술 스택을 결정한 후 추가합니다.

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

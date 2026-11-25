# DueLens 백엔드

Java + Spring Boot로 구성한 백엔드 애플리케이션입니다.
프론트엔드와 상위 `duelens/` Git 저장소를 함께 사용합니다.

## 개발 환경

- JDK 25 이상 (사용하는 Gradle의 지원 범위 내)
- Java 25 호환 바이트코드 (`--release 25`)
- Spring Boot 4.2.0
- Gradle Wrapper 9.9.2

Gradle을 따로 설치할 필요는 없습니다. Wrapper가 지정 버전을 내려받으며 SHA-256 체크섬을 검증합니다.
Java 컴파일은 현재 실행 중인 JDK를 사용하며, Java 25 API를 기준으로 검사합니다.

## 실행

최초 한 번 PostgreSQL 18을 설치하고 프로젝트 전용 DB를 준비합니다.

```sh
brew install postgresql@18
npm run db:start
```

이미 설치했다면 `brew install`은 생략합니다. Docker·전역 Gradle 설치는 필요하지 않습니다. Homebrew 기본 서비스 대신 프로젝트 전용 클러스터를 사용합니다. 재부팅 뒤에는 `npm run db:start`로 다시 시작합니다.

저장소 루트에서 실행합니다.

```sh
npm run dev:backend
```

npm을 사용하지 않고 직접 실행할 수도 있습니다.

```sh
./backend/gradlew -p backend bootRun
```

Windows에서는 `backend\gradlew.bat -p backend bootRun`을 사용합니다.
기본 주소는 <http://127.0.0.1:8080>입니다.

## 기동 상태 확인

```sh
curl http://127.0.0.1:8080/api/health
```

정상 기동 시 HTTP 200과 공통 응답 `success:true`, `code:SUCCESS`, `data.status:UP`을 반환합니다. DB가 비정상이면 HTTP 200의 `success:false`, `code:SERVER_UNHEALTHY`, `data:null`로 구분합니다.
프론트엔드 개발 서버에서는 `/api/health` 요청을 백엔드로 전달합니다.
Actuator의 다른 관리 엔드포인트와 상세 상태는 노출하지 않습니다.

## 테스트 및 빌드

```sh
npm run test:backend
npm run build:backend
```

또는 저장소 루트에서 직접 실행합니다.

```sh
./backend/gradlew -p backend test
./backend/gradlew -p backend build
```

실행 가능한 JAR은 `backend/build/libs/`에 생성됩니다.
통합 테스트는 임의 포트에서 서버를 시작하고 `/api/health`의 실제 HTTP 응답을 확인합니다.
실제 PostgreSQL의 별도 `duelens_test` DB에서 마이그레이션·FK/NOT NULL·과목 중복·삭제 후 보존·과제/이력 롤백·실행 계정 권한을 검증합니다. 먼저 `npm run db:start`를 실행해 주세요. 일반 테스트 데이터는 트랜잭션 종료 시 롤백하며 HTTP·동시 실행 테스트의 커밋된 데이터는 해당 테스트의 소유자 범위만 정리합니다. 이력 삭제가 필요한 실패 검증은 테스트 DB를 확인한 마이그레이션 계정으로 정리하고 실행 계정 권한은 유지합니다. H2로 대체하거나 DB 테스트를 자동 생략하지 않습니다.

## 설정

애플리케이션 설정은 `src/main/resources/application.properties`에서 관리합니다.
`bootRun`의 작업 디렉터리는 `backend/`이며 로컬 접속 값은 `config/local.properties`에서 읽습니다. 테스트 프로필은 `config/test.properties`와 `DUELENS_TEST_*`를 사용해 개발 DB 환경 변수와 분리합니다.
`SERVER_PORT`, `SERVER_ADDRESS` 등 Spring 환경 변수로 값을 덮어쓸 수 있습니다.
포트를 변경하면 프론트엔드 `vite.config.ts`의 개발 프록시 대상도 맞춰야 합니다.

## 로컬 PostgreSQL 관리

- 시작·준비: `npm run db:start` — 최초에는 개발/테스트 DB와 계정을 만들며 재실행 시 기존 값을 유지합니다.
- 상태: `npm run db:status`
- 중지: `npm run db:stop` — 프로젝트 DB만 중지하며 데이터는 남깁니다.
- 주소: `127.0.0.1:5432`, 개발 DB `duelens`, 테스트 DB `duelens_test`
- 바이너리 기본 경로: `/opt/homebrew/opt/postgresql@18/bin`; 다른 설치 경로는 `POSTGRES_BIN`으로 지정합니다.
- DB 파일·관리 접속 정보: 저장소의 `.local/postgres/`. 런타임 접속 값은 `backend/config/local.properties`·`test.properties`에 생성하며 모두 Git에서 제외합니다. 비밀 파일의 권한은 소유자만 읽고 쓰는 600입니다. `local.properties.example`에는 공개 가능한 형식만 있습니다.

DB는 루프백에만 바인딩하고 SCRAM 인증을 사용합니다. 앱 실행 계정과 스키마 변경 계정을 분리하며 앱에는 DDL·마이그레이션 메타데이터·이력 수정/삭제 권한을 주지 않습니다. 개발·테스트 앱 계정은 각각 허용한 DB에만 접속합니다. 운영 DB는 별도로 구성하고 `DUELENS_DB_*`·`DUELENS_MIGRATION_*`를 환경 변수·외부 비밀 저장소로 전달합니다. 위 접속 URL의 TLS 생략은 로컬 루프백 개발용입니다.

스키마 변경은 `src/main/resources/db/migration/`의 Flyway로만 관리합니다. V1은 업무 테이블, V2는 실행 역할 권한, V3는 Spring Session JDBC 공식 세션·속성 테이블을 만듭니다. DB 관리자는 마이그레이션 전에 `duelens_runtime NOLOGIN` 역할과 전용 DB/계정을 준비해야 합니다. 적용한 마이그레이션을 수정하지 않고 새 버전을 추가합니다. 앱 시작 시 체크섬 검증과 미적용 버전만 실행하며 `clean`은 비활성화했습니다.

## API·DB 설계

PostgreSQL 연결과 초기 스키마를 구현했습니다. 가입 없는 게스트 세션·CSRF·현재 사용자/학기 소유권 검사도 구현했으며, 과목 등록·조회·수정·삭제와 연결 과제 이력 처리를 구현했습니다. 과제·이력·일정 API와 학교 로그인·공지 수집·AI 분석은 후속으로 진행합니다.

- [저장 모델·소유권·트랜잭션 규칙](../docs/backend/data-model.md)
- [ERD: 테이블·PK/FK·관계 그림과 편집 원본](../docs/backend/erd.md)
- [PostgreSQL 테이블 설계안](../docs/backend/schema.sql)
- [컬럼·제약 참고: SQL 상세](../docs/backend/database-design.md)
- [API 명세 설명](../docs/backend/api.md)
- [요청·응답 모델 정의서](../docs/backend/models.md)
- [오류코드 정의서](../docs/backend/error-codes.md)
- [OpenAPI 3.1.1 계약](../docs/backend/openapi.json)

API 목표 계약은 성공·실패·생성·삭제 모두 HTTP 200과 `success`, `code`, `message`, `data` 네 필드의 공통 JSON을 사용합니다. 요청 쿼리는 URL, 헤더·본문과 응답은 4칸 들여쓰기 JSON으로 명세합니다. API 명세에는 성공 예시를 직접 표시하고 헤더가 없으면 비워 둡니다. 타입·필드는 모델 정의서, 실패 코드·발생 조건·처리 방법·응답 예시는 오류코드 정의서에서 관리합니다.

첫 공간은 `initialTerm` 없이 `{}`로 시작할 수 있으며 선택 학기를 `null`로 응답합니다. 이후 명시적으로 학기를 저장합니다. 과목 생성은 소속 `term`이 필수이고 과제 생성은 등록한 과목의 `courseId`가 필수입니다. DB의 `users.selected_term`은 NULL을 허용하며 사용자 → 과목 → 과제로 소유권을 확인합니다. 모델 정의서의 ‘읽는 방법’에서 요청 모델과 전체 응답·내부 데이터 모델의 차이를 확인할 수 있습니다.

DB 연결·V1~V3 마이그레이션을 로컬 PostgreSQL 18.7에 적용했습니다. `/api/health`와 `/api/v1/session`, `/api/v1/workspace/start`, `/api/v1/workspace`, `/api/v1/terms`의 실제 API·공통 응답을 구현했습니다. 사용자 세션은 JDBC로 유지하고 시작 시 세션 ID·CSRF 토큰을 갱신합니다. 과목 API의 소유권·변경 충돌·생성 재시도·삭제 보존도 구현했습니다. 바로 다음 단계는 과제·변경 이력·주간 일정 API입니다. 프론트 저장은 아직 목 데이터 흐름이며 실제 API 연결은 후속 범위입니다. 목 데이터·기존 로컬 과목은 서버로 자동 가져오지 않습니다. [DB 구성 검증](../docs/backend/postgresql-setup.md)·[의존성 점검](../docs/backend/dependency-security-20261125.md)을 참고해 주세요.

세션 호출 순서·쿠키·출처 설정과 25개 백엔드 검증은 [사용자 세션 구현 기록](../docs/backend/user-session.md)에 있습니다. 기존 로컬 설정에 공개 개발 옵션이 없으면 `npm run db:start`가 접속 정보는 유지하며 누락된 옵션만 보완합니다.

과목 API 구현·동시성·기록 보존 및 전체 43개 테스트 결과는 [과목 API 구현 기록](../docs/backend/course-api.md)에 있습니다.

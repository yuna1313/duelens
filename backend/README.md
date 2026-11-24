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

정상 기동 시 HTTP 200을 반환하며, JSON의 `status` 값은 `UP`입니다.
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

## 설정

애플리케이션 설정은 `src/main/resources/application.properties`에서 관리합니다.
`SERVER_PORT`, `SERVER_ADDRESS` 등 Spring 환경 변수로 값을 덮어쓸 수 있습니다.
포트를 변경하면 프론트엔드 `vite.config.ts`의 개발 프록시 대상도 맞춰야 합니다.

## API·DB 설계

PostgreSQL을 사용해 학기·과목·수동 과제·변경 이력을 저장할 계획입니다. 가입 없는 게스트 세션의 소유권을 먼저 구현하고, 학교 로그인·공지 수집·AI 분석은 후속으로 진행합니다.

- [저장 모델·소유권·트랜잭션 규칙](../docs/backend/data-model.md)
- [PostgreSQL 테이블 설계안](../docs/backend/schema.sql)
- [API 명세 설명](../docs/backend/api.md)
- [OpenAPI 3.1.1 계약](../docs/backend/openapi.json)

위 파일은 설계 산출물입니다. DB·세션·업무 API는 아직 연결하지 않았으며 `/api/health`만 실제 제공됩니다. 바로 다음 단계는 지원 버전·보안 공지 확인 후 DB 연결·마이그레이션과 게스트 세션·소유권 검증을 구현하는 작업입니다. 프론트엔드에 연결하기 전 저장 위치·복구 범위를 안내하고 로컬 데이터의 서버 가져오기는 사용자 선택으로 처리합니다.

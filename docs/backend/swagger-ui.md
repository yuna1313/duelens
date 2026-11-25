# Swagger UI 로컬 확인

2026-11-25. `feature/swagger-ui`에서 springdoc-openapi 3.2.1을 연결했습니다. 실제 해석된 Swagger UI는 5.35.1입니다.

- 화면: <http://localhost:8080/swagger-ui/index.html>
- 문서 JSON: <http://localhost:8080/api/docs/openapi.json>

## 실행과 문서 범위

저장소 루트에서 `npm run db:start`, `npm run dev:backend`를 실행합니다. 로컬 DB 준비 명령은 Git에서 제외한 `backend/config/local.properties`에 `DUELENS_API_DOCS_ENABLED=true`를 보완합니다. 기본 애플리케이션 설정은 false이며 명시적으로 활성화한 환경에서만 문서 경로의 GET을 허용합니다.

Swagger는 검토한 `docs/backend/openapi.json`을 읽습니다. Gradle processResources가 해당 원본을 JAR 내부로 복사하므로 운영 코드와 분리된 별도 수기 JSON 사본을 관리하지 않습니다. 원본 변경 후 서버를 재기동하면 반영됩니다. 자동 생성 명세의 `/v3/api-docs`와 직접 WebJar 경로는 공개하지 않습니다.

전체 17개 API 중 API-00~10의 11개는 구현·검증했고 API-11~16은 설계 단계입니다. 각 API를 펼쳐 Extensions의 x-implementation으로 상태를 확인합니다. 표시된 예정 API가 구현 완료를 의미하지 않습니다.

## 실제 호출 순서

1. GET `/session`의 Try it out → Execute로 쿠키·csrfToken을 준비합니다. 브라우저가 세션 쿠키를 보관하므로 Cookie를 직접 입력하지 않습니다.
2. 상단 Authorize에서 csrfToken 항목에 응답의 data.csrfToken을 입력합니다. X-CSRF-TOKEN 헤더로 사용합니다.
3. POST `/workspace/start`에 `{}`를 실행합니다. 첫 시작은 세션 ID와 CSRF 토큰을 갱신합니다.
4. GET `/session`을 다시 실행하고 Authorize의 csrfToken을 새 응답 값으로 교체합니다.
5. 과목 생성·조회·수정·삭제를 호출합니다. 새 내용의 생성에는 새 UUID Idempotency-Key를 사용하고 같은 요청을 재시도할 때는 기존 키를 유지합니다. 수정·삭제의 expectedRevision은 조회 결과의 revision을 보냅니다.

성공·실패 모두 HTTP 200이므로 응답의 success·code를 확인합니다. 세션 만료 뒤에는 세션 준비·시작 절차부터 다시 진행합니다. 로컬 Swagger에서 생성한 과목도 개발 DB에 실제로 저장됩니다.

## 검증

- [x] 전체 백엔드 테스트 46개와 `npm run build:backend` 통과
- [x] UI HTML·JavaScript 자원·설정·검토한 원본 JSON 응답 확인
- [x] 문서 비활성 모드의 UI·JSON·WebJar 경로 차단
- [x] 활성 모드에서도 관리·자동 생성 명세·직접 WebJar 경로와 업무 API 접근 권한 유지
- [x] 업무 쓰기 요청의 CSRF 검사 유지, 권한 영구 저장·URL 설정 변경 비활성
- [x] 실제 브라우저에서 전체 명세 표시와 `/api/health` HTTP 200·UP 호출 확인
- [x] 실제 Maven 런타임 93개 OSV 조회: 등록 결과 0개, [점검 범위](dependency-security-20261125.md)

근거: [Boot 4.2·springdoc 호환 표](https://springdoc.org/#what-is-the-compatibility-matrix-of-springdoc-openapi-with-spring-boot), [springdoc UI 설정](https://springdoc.org/properties.html), [Swagger UI 5.35.1 릴리스](https://github.com/swagger-api/swagger-ui/releases/tag/v5.35.1).

# 백엔드 저장 모델

v0.3 · 2026-11-25. [ERD](erd.md)·[DDL](schema.sql)·[컬럼 정의](database-design.md)·[API 계약](api.md)을 함께 관리합니다. PostgreSQL의 목표 설계이며 실행 중인 서버·DB에는 아직 적용하지 않았습니다.

## 사용자와 데이터 소유권

핵심 관계는 **사용자 → 과목 → 과제 → 변경 이력**입니다. 과목을 먼저 등록하고 그 과목에 과제를 만듭니다. 과목명을 문자열로만 적어 과목 연결을 생략하는 경로는 목표 설계에서 제거했습니다.

| 테이블 | 책임 | 필수 관계 |
| --- | --- | --- |
| users | DueLens 사용자 ID, 표시 이름·연락 이메일, 사용자 상태, 선택 학기 | 소유권의 기준 |
| courses | 학기별 과목·분반·수업 시간 | user_id → users.id |
| tasks | 해당 과목의 과제·마감·진행 상태·제출 조건 | course_id → courses.id |
| task_history | 과제 버전별 변경 전후 값 | task_id → tasks.id |
| idempotency_requests | 성공한 생성 요청의 재시도 결과 | user_id → users.id |

`tasks`에 `user_id`, `workspace_id`, `term`, `course_name`, `section`을 중복 저장하지 않습니다. 소유자는 `courses.user_id`, 소속 학기·과목명·분반은 `courses`에서 조회합니다. API의 과제 응답에는 화면에 필요한 term·courseName·section을 서버가 과목에서 가져와 포함합니다. 변경 이력에는 기록 당시 과목 값까지 사본으로 보관합니다.

FK는 연결 대상의 존재를 보장합니다. 접근 권한은 서버가 매 요청에서 별도로 검사합니다. UUID를 알고 있다는 사실이나 클라이언트가 보낸 사용자 ID를 접근 권한으로 사용하지 않습니다.

```sql
-- :session_user_id는 서버 세션에서 가져옵니다.
SELECT t.*, c.term, c.name AS course_name, c.section
FROM tasks t
JOIN courses c ON c.id = t.course_id
JOIN users u ON u.id = c.user_id
WHERE t.id = :task_id
  AND c.user_id = :session_user_id
  AND u.status IN ('guest', 'active')
  AND u.deleted_at IS NULL;
```

수정·이력 조회·일정 조회에도 같은 소유권 조건을 적용합니다. 과목을 바꾸는 수정에서는 기존 과제와 새 과목 모두 세션 사용자 소유인지 검사합니다. 다른 사용자의 ID와 없는 ID는 같은 NOT_FOUND로 응답합니다.

## 사용자 정보와 가입 없는 시작

users는 실제 서비스의 사용자 테이블입니다. display_name·email은 게스트 상태에서 NULL을 허용하고 status는 guest·active·withdrawn을 구분합니다. 탈퇴 표시와 실제 데이터 보관·삭제 정책은 서비스 공개 전에 확정합니다. 확인하지 않은 이메일을 로그인 식별자나 계정 병합 근거로 사용하지 않습니다.

1. GET /api/v1/session이 세션·CSRF 토큰을 준비합니다. 서버 세션 내부에 최초 시작용 사용자 UUID를 준비하며 시작 전 응답의 userId는 NULL입니다.
2. POST /api/v1/workspace/start가 그 UUID의 users 행을 최초 한 번 생성하고 세션에 연결합니다. 같은 세션의 동시 시작은 동일 UUID와 PK 충돌 처리로 중복 생성하지 않습니다. initialTerm 생략 시 selected_term은 NULL입니다.
3. 이후 요청의 사용자 ID는 서버 세션에서 가져옵니다. 세션 내부 UUID를 인증 토큰으로 사용하거나 클라이언트의 임의 userId를 신뢰하지 않습니다. 연결된 사용자가 없으면 USER_REQUIRED입니다.
4. workspace는 개인 화면·학기 설정을 부르는 API 이름입니다. 별도 workspaces 테이블을 두지 않으며 Workspace.id는 users.id입니다.

가입 없는 시작도 guest 사용자 행으로 구분합니다. 정식 로그인·기기 간 동기화는 미구현입니다. 게스트를 정식 계정에 연결할 때 같은 users.id를 유지해 과목·과제 소유권을 보존하도록 설계합니다. 기존 계정과의 병합은 별도 본인 확인·충돌 처리 정책이 필요합니다.

iClass 연결은 학교 데이터 접근용이며 DueLens 사용자 식별과 분리합니다. 공식 로그인 연동·안정적인 학교 식별자 제공 여부는 아직 확인하지 않았습니다. 학교 비밀번호는 users·Git·로그·프론트엔드·AI 입력에 저장하지 않습니다. 정식 로그인 식별자와 학교 연결·토큰 보관 방식은 실제 연동 단계에서 별도 설계합니다.

게스트는 쿠키 삭제·세션 만료 후 복구 수단이 아직 없습니다. 사용자 확인 없이 새 세션을 기존 사용자에 자동 연결하지 않습니다. 세션은 Spring Session JDBC의 해당 버전 공식 스키마로 관리할 계획이며 세션 ID 변경 뒤에도 서버의 사용자 연결을 올바르게 유지해야 합니다.

운영 쿠키는 HttpOnly·Secure·SameSite=Lax·호스트 전용으로 설정합니다. 쿠키 인증 쓰기 요청은 CSRF·출처 검증을 거치고 개인 응답은 Cache-Control: no-store로 반환합니다. 요청 본문·쿠키·CSRF 토큰은 로그에서 제외합니다. 개발은 루프백 바인딩과 Vite /api 프록시를 사용합니다.

## 학기와 과목

- 선택 학기는 처음에 NULL일 수 있습니다. 서버가 오늘 날짜나 iClass 예시로 자동 선택하지 않습니다. PATCH /workspace로 사용자가 선택한 학기를 저장합니다.
- 과목의 term은 YYYY-1·YYYY-summer·YYYY-2·YYYY-winter 형식의 필수 값입니다. 연도는 1000..9999이며 마감 날짜로 소속 학기를 나누지 않습니다. 별도 학기 테이블은 두지 않습니다.
- 과목명은 1~100자, 분반은 1~30자입니다. NFC·trim 후 저장하고 중복 검사 키는 Locale.ROOT 소문자화를 적용합니다. 활성 과목의 (user_id, term, name_key, section_key)는 중복될 수 없습니다.
- API 요일은 ISO 1=월요일..7=일요일의 중복 없는 배열, DB는 7비트 정수입니다. 요일이 없으면 시작 시각도 NULL, 요일이 있으면 HH:mm 시각이 필수입니다. 초·24:00은 받지 않습니다.
- 과목명·분반·학기가 바뀌면 과제 응답은 과목의 최신 값을 조회합니다. 같은 트랜잭션에서 연결 과제 버전을 올리고 변경 전후 이력을 기록합니다. 시간표만 바뀌면 과제 이력을 만들지 않습니다.
- 과목 삭제는 deleted_at으로 표시합니다. 과목 행·기존 과제·이력을 보존하고 삭제된 과목에 새 과제를 만들 수 없습니다. 기존 과제는 해당 연결을 유지하거나 자신의 다른 활성 과목으로 바꿀 수 있습니다. 연결 해제는 허용하지 않습니다.

## 과제·마감·입력

과제 생성은 필수 courseId·courseRevision으로 자신의 활성 과목을 선택합니다. 생성·수정 요청에 과목명·분반·학기는 받지 않습니다. 등록한 과목이 없으면 과목 등록으로 안내합니다. 프론트엔드에서도 문자열 직접 입력을 제거하고 과목 필수 등록·선택 흐름을 반영했습니다. 현재 과제는 탭 메모리에만 보관하며 courseRevision을 포함한 실제 API 요청 연결은 후속 단계입니다.

날짜만 확정·날짜와 시각 모두 미정·명시적 00:00을 구분합니다. 날짜 없이 시각만 저장하지 않으며 미정 시각을 23:59나 자정으로 채우지 않습니다. 실제 달력 날짜와 1000-01-01..9999-12-31 범위를 검사합니다. Java LocalDate·LocalTime, DB date·time without time zone을 사용하며 시간대는 Asia/Seoul입니다. 발생 시점은 Instant·timestamptz입니다.

상태는 todo·in-progress·written·submitted입니다. written은 미제출이며 submitted도 사용자 표시입니다. 학교 제출 API는 호출하지 않습니다. 첫 저장 원천은 서버가 설정하는 manual입니다.

제목 1~150자, 제출 형식·분량 각 100자 이하, 메모 20,000자 이하입니다. 필수 값의 공백 입력을 거부하고 길이는 화면과 같은 UTF-16 코드 단위로 서버에서도 검사합니다. DB 문자 수 제한은 추가 방어입니다. 제출 URL은 NULL 또는 최대 2,048자의 HTTP(S) URL이며 사용자 정보·제어 문자를 거부합니다. 서버가 링크를 직접 요청하지 않습니다.

## 변경·충돌·재시도

- 과제 생성과 최초 버전 1의 created 이력을 한 트랜잭션으로 기록합니다. 수정은 expectedRevision 일치를 확인한 뒤 버전을 올리고 manual-edit 이력을 기록합니다. 실패하면 모두 롤백합니다.
- 같은 값 저장은 버전·이력을 추가하지 않습니다. 오래된 버전은 값이 같아도 REVISION_CONFLICT입니다. 자동 덮어쓰기 없이 재조회·확인합니다.
- 저장 시 과목 버전도 확인합니다. 폼을 연 뒤 과목이 바뀌거나 삭제되면 COURSE_CHANGED입니다. 이미 삭제된 기존 연결을 유지하는 수정에서만 courseRevision: null을 허용합니다.
- 사용자·과목 상태를 확인하고 과목 행을 먼저 잠근 뒤 과제를 ID 순으로 잠가 경합을 처리합니다. 소유권 확인과 실제 변경 사이에 과목이 바뀌는 경쟁도 트랜잭션 안에서 처리합니다.
- 생성의 Idempotency-Key는 사용자별 UUID입니다. 정규화 요청·작업 경로의 SHA-256과 HTTP 200·공통 성공 본문을 24시간 보관합니다. 같은 키·같은 요청은 최초 결과를, 다른 내용은 IDEMPOTENCY_CONFLICT를 반환합니다. 실패한 생성은 성공 기록으로 저장하지 않습니다.
- 이력의 (task_id, version)은 유일하며 JSON 형식 버전이 있습니다. 이력은 당시 과제·과목 값의 사본이므로 과목 변경 뒤에도 당시 값을 보존합니다. 런타임 DB 역할에는 이력 수정·삭제 권한을 부여하지 않습니다.

## 목록과 일정

목록·집계는 동일 사용자·학기·기간·검색·과목·상태 조건과 같은 읽기 스냅샷을 사용합니다. 과목의 term·이름으로 필터링하며 집계는 페이지 분할 전 전체 기준입니다. all·week·month·undated를 지원합니다. 한국 시간 월~일·1일~말일을 기준으로 실제 범위와 asOf를 반환합니다. 제출 건수의 기간도 과제 마감일 기준입니다.

정렬은 마감 날짜·시각 NULLS LAST, 제목(C collation)·ID 순입니다. 전체 과제는 필터 결과 수, 남은 과제는 submitted가 아닌 수, 마감 미정은 날짜가 없는 수입니다. GET /schedule은 term·월요일 weekStart만 받는 독립 주간 미제출 조회로 메인·모바일 목록 필터와 분리합니다.

## 무료·유료 기능 확장

기본 기능 무료, 추후 추가 기능 유료화가 제품 방향입니다. 요금·무료 한도·유료 기능·결제 제공자는 아직 정하지 않았습니다. 구독·결제·기능 이용 권한은 이후 users.id에 연결한 별도 테이블로 설계합니다. 사용자 상태·학교 연결 여부로 결제 여부를 대신하지 않고 서버가 해당 기능 사용 시 권한을 검사합니다. 과목·과제 소유 관계는 요금제 변경과 독립적으로 유지합니다. 현재 ERD에 구독·결제 테이블을 구현된 것으로 표시하지 않습니다.

## 구현 순서와 검증

- [x] 사용자 테이블과 필수 과목 연결의 ERD·SQL·API 계약 개정
- [x] 화면의 과목 등록 필수 흐름 반영 — 검증 기록: ../frontend-course-flow.md
- [ ] PostgreSQL 연결·마이그레이션·사용자 세션과 소유권 검증 구현
- [ ] 과목·과제·변경 이력 API와 실제 DB 통합 검증
- [ ] 프론트엔드 API 연결과 로컬 데이터의 명시적 가져오기
- [ ] 정식 로그인·iClass·AI·알림 발송 구현
- [ ] 유료 기능·구독·결제 정책과 테이블 구현

실제 검증에는 타인 과목으로 생성·재연결·조회·수정 거부, 과목 없는 과제의 NOT NULL/FK 거부, 동시 중복 생성, 버전 충돌, 과제·이력 롤백, 과목 수정·삭제 후 보존, 날짜 경계, 목록·집계 일치를 포함합니다. 목 데이터·로컬 백업은 사용자 동의 없이 서버에 저장하지 않습니다.

## 근거

- [PostgreSQL 제약 조건](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [OWASP 접근 권한 검사](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Spring Security 세션 관리](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html)

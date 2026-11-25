# 로컬 PostgreSQL 구성·검증

2026-11-25. PostgreSQL 18.7(Homebrew), Spring Boot 4.2.0, Java 25 호환 코드로 확인했습니다.

## 실행

```sh
# 최초 설치 1회
brew install postgresql@18

# 저장소 루트에서 실행
npm run db:start
npm run dev:backend
```

`npm run db:status`로 상태를 확인하고 `npm run db:stop`으로 중지합니다. 중지는 데이터를 삭제하지 않습니다. Homebrew 전역 DB 서비스나 로그인 시 자동 실행은 등록하지 않았습니다.

DB는 프로젝트의 `.local/postgres/data/`에 보관하며 `127.0.0.1:5432`에만 바인딩합니다. SCRAM 인증을 사용하고 개발용 `duelens`와 테스트용 `duelens_test`를 분리합니다. 각 DB의 앱 실행 계정은 자기 DB에만 접속합니다. 비밀번호는 무작위 생성하며 `.local/postgres/credentials.json`과 `backend/config/local.properties`·`test.properties`를 Git에서 제외합니다. 비밀 파일은 소유자 읽기·쓰기만 허용합니다.

## 스키마와 권한

- [x] V1: users → courses → tasks → task_history 및 idempotency_requests
- [x] V2: 앱 역할에 업무 테이블 권한 부여, 이력은 조회·추가만 허용
- [x] 앱 실행 계정과 마이그레이션 계정 분리, 실행 계정의 DDL 차단
- [x] Flyway 체크섬 검증·재기동 시 미적용 버전만 실행, clean 비활성화
- [x] 목 데이터·사용자 로컬 과목을 DB로 자동 가져오지 않음

ERD의 업무 테이블 5개·관계 4개와 V1 DDL은 일치합니다. Flyway의 `flyway_schema_history`는 프레임워크 관리 테이블입니다. 서버 세션·속성 테이블은 후속 V3에서 추가했습니다. [현재 세션 구현](user-session.md)을 참고해 주세요. 적용한 V1/V2는 수정하지 않고 새 마이그레이션을 추가합니다.

## 검증 결과

- [x] `npm run build:backend` 통과: 실제 PostgreSQL 기반 통합 테스트 10개, 실패·생략 0개
- [x] HTTP 서버·DB 연결 상태 `/api/health`: HTTP 200, status UP
- [x] 초기 마이그레이션 2개 적용·체크섬·재실행 시 중복 생성 없음
- [x] 과목 없는 과제의 NOT NULL·FK 거부, 활성 과목 중복 거부
- [x] 과목 삭제 표시 후 기존 과제 연결 보존·동일 이름 재등록 허용
- [x] 과제 저장 뒤 이력 저장 실패 시 같은 트랜잭션의 과제도 롤백
- [x] 실행 계정의 DDL·이력 수정/삭제·마이그레이션 메타데이터 접근 권한 제한
- [x] 개발·테스트 앱 계정의 서로 다른 DB 접속 거부
- [x] 잘못된 개발 DB 환경 변수를 전달해도 테스트 전용 설정으로 테스트 성공
- [x] DB 중지·재시작 후 마이그레이션 버전 유지·앱 재접속 성공
- [x] 개발 users·courses·tasks는 각 0개: 예시·검증 데이터 입력 없음

## 남은 작업

- [x] 사용자 세션·CSRF·현재 작업 공간/학기 API — 후속 V3 구현 완료
- [ ] **바로 다음: 과목 API·소유권·변경 충돌 검사**
- [ ] 과목·과제·변경 이력 API와 접근 권한·충돌·재시도 검증
- [ ] 공통 HTTP 200 응답 적용과 프론트 실제 저장 연결
- [ ] 정식 로그인·iClass·AI·실제 알림 발송

이 문서의 최초 DB 구성 검증 이후 세션·현재 사용자/학기 API도 구현했습니다. DB 테이블 생성이 끝났어도 프론트 입력이 서버에 저장되는 단계는 아닙니다.

참고: [Homebrew PostgreSQL 18](https://formulae.brew.sh/formula/postgresql@18), [Spring Boot Flyway 초기화](https://docs.spring.io/spring-boot/how-to/data-initialization.html), [의존성 보안 점검](dependency-security-20261125.md).

# API 명세서

v0.10 · 2026-11-25. [OpenAPI 3.1.1](openapi.json), [DB 설계서(ERD)](erd.md), [업무 모델](data-model.md)을 함께 관리합니다. 엑셀 명세서는 API 하나당 한 행이며 URL·요청 헤더·요청 본문·성공 응답을 각각의 열에서 확인합니다. 실패 코드·조건·응답 예시는 오류코드 정의서에 모으며, 헤더가 없는 API의 헤더 칸은 비워 둡니다. 상태·세션·현재 사용자/학기·과목 API(API-00~10)와 공통 응답은 구현·검증했습니다. 과제·이력·일정 API는 목표 계약입니다.

## 공통 요청·응답

- 성공·실패·생성·삭제를 포함해 애플리케이션이 처리한 응답의 HTTP 상태는 모두 **200**, 본문 형식은 `application/json`입니다.
- 결과는 `success`와 `code`로 판단합니다. 성공은 `success:true`, `code:SUCCESS`, 업무 값은 `data`에 담습니다. 실패는 `success:false`, 업무 데이터는 `null`, 오류는 `code`와 `message`에 담으며 입력 검증 실패 이유도 `message` 문자열로 안내합니다.
- 프론트엔드는 HTTP 성공 여부만 보고 저장 성공을 표시하지 않습니다. 응답 JSON의 `success`와 `code`를 확인합니다. 네트워크 단절·프록시 오류 등 애플리케이션 응답을 받지 못한 경우는 별도로 처리합니다.
- 쿼리 매개변수는 아래 Request URL에 표시합니다. 경로 ID도 실제 예시 값으로 표시하며, 헤더와 본문은 각각 JSON으로 작성합니다. 본문 `null`은 실제 HTTP 요청에 본문이 없다는 뜻입니다.
- 세션 준비 → 공간 시작 → 세션/CSRF 재조회 → 업무 API 순서입니다. 쿠키는 브라우저가 전달하며, 예시의 Cookie 값은 서버 발급 세션을 나타내는 자리 표시자입니다. 모든 쓰기 요청은 CSRF 검증을 통과해야 합니다.
- 조회·변경은 서버 세션의 사용자로 제한합니다. 권한·CSRF 실패의 HTTP 상태를 200으로 맞추어도 접근 차단과 트랜잭션 롤백은 유지합니다. 타인의 리소스와 없는 리소스는 같은 NOT_FOUND로 응답합니다.
- 본문 최대 256 KiB, page는 0부터, size 기본 50·최대 100입니다. 알 수 없는 필드·쿼리, 중복 단일 쿼리, 잘못된 입력은 실패 응답으로 처리합니다.
- 과목·과제 생성은 UUID Idempotency-Key로 중복을 방지합니다. 성공한 최초 결과를 24시간 보관하며 같은 키의 다른 내용은 실패합니다. 수정은 expectedRevision·courseRevision을 확인하고 자동 덮어쓰지 않습니다.
- 개인 응답은 Cache-Control: no-store입니다. 실패 예시는 API별 대표 상황이며 해당 상황에서 변경한 요청값 또는 경합을 가정합니다. RATE_LIMITED에는 Retry-After를 초 단위로 전달합니다.

공통 성공 응답 구조:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "요청을 처리했습니다.",
    "data": null
}
```

## 관련 정의서

- [모델 정의서](models.md): 요청·응답의 타입과 필드
- [오류코드 정의서](error-codes.md): 실패 코드·발생 조건·처리 방법

## 과목 등록과 소유권

과목 등록 후 과제를 생성합니다. 과제 요청은 courseId로 과목을 지정하며 term·courseName·section을 받지 않습니다. 과제 응답의 해당 값은 과목에서 조회합니다. workspace API는 users의 개인 설정을 표현하며 별도 DB 테이블이 아닙니다.

## API별 Request / Response

### API-00 서버 기동 상태 확인

구현 상태: 구현 · 공통 HTTP 200 응답·DB 상태 통합 검증 완료.

Request URL:

```text
GET /api/health
```

Request headers:

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "서버 기동 상태 확인 처리 완료",
    "data": {
        "status": "UP"
    }
}
```

### API-01 사용자 세션과 CSRF 토큰 준비

구현 상태: 구현 · PostgreSQL·세션·HTTP 통합 검증 완료.

Request URL:

```text
GET /api/v1/session
```

Request headers:

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "게스트 세션과 CSRF 토큰 준비 처리 완료",
    "data": {
        "state": "active",
        "userId": "7a526074-a4e9-4ec6-8b48-05a1bb9604eb",
        "csrfToken": "example-csrf-token-not-a-real-secret"
    }
}
```

### API-02 DueLens 사용자 작업 공간 시작

구현 상태: 구현 · PostgreSQL·세션·HTTP 통합 검증 완료.

Request URL:

```text
POST /api/v1/workspace/start
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>",
    "X-CSRF-TOKEN": "<session.data.csrfToken>",
    "Content-Type": "application/json"
}
```

Request body:

```json
{}
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "가입 없이 작업 공간 시작 처리 완료",
    "data": {
        "id": "7a526074-a4e9-4ec6-8b48-05a1bb9604eb",
        "selectedTerm": null,
        "revision": 1,
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:00:00Z"
    }
}
```

### API-03 현재 작업 공간과 선택 학기 조회

구현 상태: 구현 · PostgreSQL·세션·HTTP 통합 검증 완료.

Request URL:

```text
GET /api/v1/workspace
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "현재 작업 공간과 선택 학기 조회 처리 완료",
    "data": {
        "id": "7a526074-a4e9-4ec6-8b48-05a1bb9604eb",
        "selectedTerm": null,
        "revision": 1,
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:00:00Z"
    }
}
```

### API-04 선택 학기 저장

구현 상태: 구현 · PostgreSQL·세션·HTTP 통합 검증 완료.

Request URL:

```text
PATCH /api/v1/workspace
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>",
    "X-CSRF-TOKEN": "<session.data.csrfToken>",
    "Content-Type": "application/json"
}
```

Request body:

```json
{
    "selectedTerm": "2026-winter",
    "expectedRevision": 1
}
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "선택 학기 저장 처리 완료",
    "data": {
        "id": "7a526074-a4e9-4ec6-8b48-05a1bb9604eb",
        "selectedTerm": "2026-winter",
        "revision": 2,
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:05:00Z"
    }
}
```

### API-05 선택 학기와 저장 데이터에 등장하는 학기 조회

구현 상태: 구현 · PostgreSQL·세션·HTTP 통합 검증 완료.

Request URL:

```text
GET /api/v1/terms
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "선택 학기와 저장 데이터에 등장하는 학기 조회 처리 완료",
    "data": {
        "selectedTerm": null,
        "items": []
    }
}
```

### API-06 학기의 삭제되지 않은 과목 조회

구현 상태: 구현 · PostgreSQL·HTTP·소유권·충돌·기록 보존 검증 완료.

Request URL:

```text
GET /api/v1/courses?term=2026-2&page=0&size=50
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "학기의 삭제되지 않은 과목 조회 처리 완료",
    "data": {
        "items": [
            {
                "term": "2026-2",
                "name": "알고리즘",
                "section": "001",
                "days": [
                    2,
                    4
                ],
                "startTime": "10:30",
                "id": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
                "revision": 1,
                "createdAt": "2026-11-24T02:00:00Z",
                "updatedAt": "2026-11-24T02:00:00Z"
            }
        ],
        "page": 0,
        "size": 50,
        "total": 1
    }
}
```

### API-07 과목 등록

구현 상태: 구현 · PostgreSQL·HTTP·소유권·충돌·기록 보존 검증 완료.

Request URL:

```text
POST /api/v1/courses
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>",
    "X-CSRF-TOKEN": "<session.data.csrfToken>",
    "Content-Type": "application/json",
    "Idempotency-Key": "04eaabce-07db-4088-87f5-c9da93b1e3b2"
}
```

Request body:

```json
{
    "term": "2026-2",
    "name": "알고리즘",
    "section": "001",
    "days": [
        2,
        4
    ],
    "startTime": "10:30"
}
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "과목 등록 처리 완료",
    "data": {
        "term": "2026-2",
        "name": "알고리즘",
        "section": "001",
        "days": [
            2,
            4
        ],
        "startTime": "10:30",
        "id": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
        "revision": 1,
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:00:00Z"
    }
}
```

### API-08 과목 상세 조회

구현 상태: 구현 · PostgreSQL·HTTP·소유권·충돌·기록 보존 검증 완료.

Request URL:

```text
GET /api/v1/courses/2377c5b5-7785-4dc8-a02c-1c14e3869de8
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "과목 상세 조회 처리 완료",
    "data": {
        "term": "2026-2",
        "name": "알고리즘",
        "section": "001",
        "days": [
            2,
            4
        ],
        "startTime": "10:30",
        "id": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
        "revision": 1,
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:00:00Z"
    }
}
```

### API-09 과목 전체 입력값 수정과 연결 과제 정보 갱신

구현 상태: 구현 · PostgreSQL·HTTP·소유권·충돌·기록 보존 검증 완료.

Request URL:

```text
PUT /api/v1/courses/2377c5b5-7785-4dc8-a02c-1c14e3869de8
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>",
    "X-CSRF-TOKEN": "<session.data.csrfToken>",
    "Content-Type": "application/json"
}
```

Request body:

```json
{
    "term": "2026-2",
    "name": "알고리즘 심화",
    "section": "001",
    "days": [
        2,
        4
    ],
    "startTime": "10:30",
    "expectedRevision": 1
}
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "과목 전체 입력값 수정과 연결 과제 정보 갱신 처리 완료",
    "data": {
        "term": "2026-2",
        "name": "알고리즘 심화",
        "section": "001",
        "days": [
            2,
            4
        ],
        "startTime": "10:30",
        "id": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
        "revision": 2,
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:05:00Z"
    }
}
```

### API-10 과목 삭제. 과제·이력·연결 ID 보존

구현 상태: 구현 · PostgreSQL·HTTP·소유권·충돌·기록 보존 검증 완료.

Request URL:

```text
DELETE /api/v1/courses/2377c5b5-7785-4dc8-a02c-1c14e3869de8?expectedRevision=1
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>",
    "X-CSRF-TOKEN": "<session.data.csrfToken>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "과목 삭제. 과제·이력·연결 ID 보존 처리 완료",
    "data": null
}
```

### API-11 같은 필터의 과제 목록과 전체 집계 조회

구현 상태: 설계 · 미구현.

Request URL:

```text
GET /api/v1/tasks?term=2026-2&period=week&q=%EA%B7%B8%EB%9E%98%ED%94%84&course=%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98&status=todo&page=0&size=50
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "같은 필터의 과제 목록과 전체 집계 조회 처리 완료",
    "data": {
        "items": [
            {
                "term": "2026-2",
                "courseId": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
                "courseRevision": 1,
                "courseName": "알고리즘",
                "section": "001",
                "title": "그래프 탐색 과제",
                "dueDate": "2026-11-28",
                "dueTime": null,
                "status": "todo",
                "submissionFormat": "소스 코드",
                "quantity": "",
                "submissionUrl": null,
                "description": "",
                "id": "05528382-0f6e-4bf5-bb30-60c038ca577f",
                "revision": 1,
                "source": "manual",
                "timeZone": "Asia/Seoul",
                "createdAt": "2026-11-24T02:00:00Z",
                "updatedAt": "2026-11-24T02:00:00Z"
            }
        ],
        "page": 0,
        "size": 50,
        "total": 1,
        "summary": {
            "total": 1,
            "remaining": 1,
            "submitted": 0,
            "unknown": 0
        },
        "range": {
            "period": "week",
            "startDate": "2026-11-23",
            "endDate": "2026-11-29",
            "timeZone": "Asia/Seoul"
        },
        "asOf": "2026-11-24T02:00:00Z"
    }
}
```

### API-12 수동 과제와 최초 변경 이력 생성

구현 상태: 설계 · 미구현.

Request URL:

```text
POST /api/v1/tasks
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>",
    "X-CSRF-TOKEN": "<session.data.csrfToken>",
    "Content-Type": "application/json",
    "Idempotency-Key": "04eaabce-07db-4088-87f5-c9da93b1e3b2"
}
```

Request body:

```json
{
    "courseId": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
    "courseRevision": 1,
    "title": "그래프 탐색 과제",
    "dueDate": "2026-11-28",
    "dueTime": null,
    "status": "todo",
    "submissionFormat": "소스 코드",
    "quantity": "",
    "submissionUrl": null,
    "description": ""
}
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "수동 과제와 최초 변경 이력 생성 처리 완료",
    "data": {
        "term": "2026-2",
        "courseId": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
        "courseRevision": 1,
        "courseName": "알고리즘",
        "section": "001",
        "title": "그래프 탐색 과제",
        "dueDate": "2026-11-28",
        "dueTime": null,
        "status": "todo",
        "submissionFormat": "소스 코드",
        "quantity": "",
        "submissionUrl": null,
        "description": "",
        "id": "05528382-0f6e-4bf5-bb30-60c038ca577f",
        "revision": 1,
        "source": "manual",
        "timeZone": "Asia/Seoul",
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:00:00Z"
    }
}
```

### API-13 과제 상세 조회

구현 상태: 설계 · 미구현.

Request URL:

```text
GET /api/v1/tasks/05528382-0f6e-4bf5-bb30-60c038ca577f
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "과제 상세 조회 처리 완료",
    "data": {
        "term": "2026-2",
        "courseId": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
        "courseRevision": 1,
        "courseName": "알고리즘",
        "section": "001",
        "title": "그래프 탐색 과제",
        "dueDate": "2026-11-28",
        "dueTime": null,
        "status": "todo",
        "submissionFormat": "소스 코드",
        "quantity": "",
        "submissionUrl": null,
        "description": "",
        "id": "05528382-0f6e-4bf5-bb30-60c038ca577f",
        "revision": 1,
        "source": "manual",
        "timeZone": "Asia/Seoul",
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:00:00Z"
    }
}
```

### API-14 과제 전체 입력값과 변경 이력 저장

구현 상태: 설계 · 미구현.

Request URL:

```text
PUT /api/v1/tasks/05528382-0f6e-4bf5-bb30-60c038ca577f
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>",
    "X-CSRF-TOKEN": "<session.data.csrfToken>",
    "Content-Type": "application/json"
}
```

Request body:

```json
{
    "courseId": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
    "courseRevision": 1,
    "title": "그래프 탐색 과제 (수정)",
    "dueDate": "2026-11-28",
    "dueTime": null,
    "status": "todo",
    "submissionFormat": "소스 코드",
    "quantity": "",
    "submissionUrl": null,
    "description": "",
    "expectedRevision": 1
}
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "과제 전체 입력값과 변경 이력 저장 처리 완료",
    "data": {
        "term": "2026-2",
        "courseId": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
        "courseRevision": 1,
        "courseName": "알고리즘",
        "section": "001",
        "title": "그래프 탐색 과제 (수정)",
        "dueDate": "2026-11-28",
        "dueTime": null,
        "status": "todo",
        "submissionFormat": "소스 코드",
        "quantity": "",
        "submissionUrl": null,
        "description": "",
        "id": "05528382-0f6e-4bf5-bb30-60c038ca577f",
        "revision": 2,
        "source": "manual",
        "timeZone": "Asia/Seoul",
        "createdAt": "2026-11-24T02:00:00Z",
        "updatedAt": "2026-11-24T02:05:00Z"
    }
}
```

### API-15 과제의 변경 이력 조회

구현 상태: 설계 · 미구현.

Request URL:

```text
GET /api/v1/tasks/05528382-0f6e-4bf5-bb30-60c038ca577f/history?kind=created&page=0&size=50
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "과제의 변경 이력 조회 처리 완료",
    "data": {
        "items": [
            {
                "id": "0b3f7703-a5c6-48a6-a584-03e375d3d702",
                "taskId": "05528382-0f6e-4bf5-bb30-60c038ca577f",
                "version": 1,
                "snapshotVersion": 1,
                "kind": "created",
                "before": null,
                "after": {
                    "term": "2026-2",
                    "courseId": "2377c5b5-7785-4dc8-a02c-1c14e3869de8",
                    "courseName": "알고리즘",
                    "section": "001",
                    "title": "그래프 탐색 과제",
                    "dueDate": "2026-11-28",
                    "dueTime": null,
                    "status": "todo",
                    "submissionFormat": "소스 코드",
                    "quantity": "",
                    "submissionUrl": null,
                    "description": ""
                },
                "note": "과제를 등록했습니다.",
                "occurredAt": "2026-11-24T02:00:00Z"
            }
        ],
        "page": 0,
        "size": 50,
        "total": 1
    }
}
```

### API-16 메인 목록과 독립적인 주간 미제출 일정 조회

구현 상태: 설계 · 미구현.

Request URL:

```text
GET /api/v1/schedule?term=2026-2&weekStart=2026-11-23
```

Request headers:

```json
{
    "Cookie": "DUELENS_SESSION=<서버 발급 세션>"
}
```

Request body:

```json
null
```

Response 성공 · HTTP 200:

```json
{
    "success": true,
    "code": "SUCCESS",
    "message": "메인 목록과 독립적인 주간 미제출 일정 조회 처리 완료",
    "data": {
        "term": "2026-2",
        "weekStart": "2026-11-23",
        "weekEnd": "2026-11-29",
        "timeZone": "Asia/Seoul",
        "asOf": "2026-11-24T02:00:00Z",
        "days": [
            {
                "date": "2026-11-23",
                "count": 0,
                "tasks": []
            },
            {
                "date": "2026-11-24",
                "count": 0,
                "tasks": []
            },
            {
                "date": "2026-11-25",
                "count": 0,
                "tasks": []
            },
            {
                "date": "2026-11-26",
                "count": 0,
                "tasks": []
            },
            {
                "date": "2026-11-27",
                "count": 0,
                "tasks": []
            },
            {
                "date": "2026-11-28",
                "count": 1,
                "tasks": [
                    {
                        "id": "05528382-0f6e-4bf5-bb30-60c038ca577f",
                        "title": "그래프 탐색 과제",
                        "courseName": "알고리즘",
                        "section": "001",
                        "dueTime": null,
                        "status": "todo"
                    }
                ]
            },
            {
                "date": "2026-11-29",
                "count": 0,
                "tasks": []
            }
        ]
    }
}
```
## 첫 사용의 학기 선택

- POST /workspace/start의 initialTerm은 선택 입력입니다. {}로 요청하면 selectedTerm=null로 시작합니다.
- GET /workspace와 GET /terms는 미선택 상태에서도 성공하며, 학기 기록이 없으면 items=[]입니다.
- 학기 선택은 PATCH /workspace에서 저장합니다. 과목의 소속 term은 필수이며 과제는 필수 courseId로 과목의 학기를 따릅니다.
- iClass 정보 수집은 미구현이며 현재 날짜·연결 예시로 선택 학기를 자동 저장하지 않습니다.
- 이번 주·이번 달은 실제 오늘 기준이며, 일정 카드의 학기별 시작 위치는 프론트의 표시 기준입니다. API는 전달받은 term·weekStart로 조회합니다.

## 조회·표시와 연동 규칙

- 과제 목록과 집계는 같은 학기·기간·검색·과목명·상태 필터와 DB 읽기 스냅샷을 사용합니다. 집계는 페이지 분할 전 결과입니다. 남은 과제에는 작성 완료와 기한 지난 미제출도 포함합니다.
- period는 all/week/month/undated입니다. 주는 한국 날짜 월~일, 월은 1일~말일입니다. 주·월 조회에서 날짜 미정은 제외하며 제출 건수의 기간도 과제 마감 날짜 기준입니다.
- 주간 일정은 term·weekStart만 받는 독립 조회입니다. 메인 목록 필터와 모바일 목록에도 영향을 주지 않습니다. 월요일이 아닌 weekStart는 VALIDATION_FAILED입니다.
- 과제는 날짜·시각 오름차순 NULLS LAST 후 제목(C collation)·ID, 과목은 이름·분반·ID, 이력은 버전 내림차순으로 정렬합니다.
- API data.courseName은 현재 UI의 course, 이력 data.items[].before/after.status는 progress 표시 모델로 변환합니다. 날짜·시각·URL의 null은 폼의 빈 문자열로 변환합니다. 과목 연결은 필수입니다.
- 실패 응답은 과제·이력 저장 완료나 학교 제출 완료를 뜻하지 않습니다. submitted는 사용자 표시이며 학교에 제출하지 않습니다. 예시 데이터를 서버에 자동 저장하지 않습니다.

## 검증 범위

계약 참조·경로·요청 URL과 JSON 예시·성공/실패 구분을 정적으로 검증합니다. DB·상태·세션·현재 사용자/학기·과목 범위는 실제 PostgreSQL·HTTP 통합 검증을 마쳤습니다. 과목 수정·삭제의 이력 보존과 전체 롤백도 검증했습니다. 과제·이력·일정 API의 접근 권한·변경 충돌 검증은 다음 구현 단계에서 수행합니다. 전체 OpenAPI 도구 검증 또는 실제 연동 완료를 의미하지 않습니다.

## 세션 API 사용 순서와 구현 범위 (2026-11-25)

1. GET `/api/v1/session`으로 쿠키와 CSRF 토큰을 준비합니다. 첫 응답은 `state=new`, `userId=null`입니다.
2. POST `/api/v1/workspace/start`에 `{}` 또는 확인한 `initialTerm`을 보냅니다. 최초 성공 시 세션 ID와 CSRF 토큰을 갱신합니다.
3. GET `/api/v1/session`을 다시 조회해 새 토큰을 받은 뒤 쓰기 요청의 `X-CSRF-TOKEN`에 전달합니다.
4. GET/PATCH `/api/v1/workspace`와 GET `/api/v1/terms`는 세션 사용자만 조회·수정합니다. 사용자 ID를 본문·쿼리로 받지 않습니다.

API-00~10은 구현했으며 과제·이력·일정 API는 설계 단계입니다. 개발 쿠키는 로컬 HTTP용으로 Secure=false이고 운영 기본값은 Secure=true입니다. 현재 개발용 비활성 세션 만료는 30분이며 공개 서비스의 게스트 보관·복구 정책은 출시 전에 확정합니다. 상세 구현·검증은 [사용자 세션 기록](user-session.md)에 있습니다.

## 과목 API 구현 범위 (2026-11-25)

과목 생성의 재시도 응답은 최초 성공 결과이며 수정·삭제 이후에도 만료 전에는 원래 결과를 반환합니다. 현재 상태는 상세/목록으로 확인합니다. 수정·삭제의 expectedRevision은 필수이며 같은 값 저장도 오래된 버전이면 실패합니다. DELETE는 본문 없이 요청합니다. 학기·이름·분반 수정의 연결 과제 버전·변경 이력과 실패 시 전체 롤백, 삭제 후 과제·이력 보존을 검증했습니다. 전체 백엔드 테스트 43개가 통과했으며 프론트 API 연결은 아직 미구현입니다. [과목 구현·검증 기록](course-api.md)을 참고해 주세요.

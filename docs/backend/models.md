# API 데이터 모델 정의서

v0.4 · 2026-11-25. API 요청·응답 JSON의 필드 설명입니다. 공통 응답은 success, code, message, data 네 필드입니다.

## 읽는 방법

1. API 명세서에서 확인할 요청·응답을 고릅니다. 과목 생성은 `API-07`의 `CourseInput` 요청과 `SuccessCourse` 응답입니다.
2. 모델 목록의 용도·사용 API를 보고 해당 모델을 찾습니다. 필드 정의에서는 모델 이름으로 필터링합니다.
3. 필드 이름은 JSON 키, 타입은 값의 종류, 필수는 키를 반드시 보내는지, 제약은 허용되는 값의 범위입니다.
4. `string | null`은 문자열 또는 null을 허용합니다. 필수가 표시되어도 값으로 null을 보낼 수 있습니다. 선택 필드는 키를 생략할 수 있습니다.

| 모델 | 의미 | 실제 확인 위치 |
| --- | --- | --- |
| `CourseInput` | 과목 생성 시 보내는 JSON 본문 | API-07 Request Body |
| `Course` | 저장된 과목 한 건 | 성공 응답의 `data` |
| `SuccessCourse` | `success`, `code`, `message`, `data`를 포함한 전체 응답 | API-07 Response |
| `TaskSnapshot` | 변경 이력에 보관한 당시 과제 값 | 이력 응답의 `before`·`after` |

`CourseInput` 요청 예시:

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

처음 시작할 때는 `WorkspaceStart`의 `initialTerm`을 생략한 `{}` 요청이 가능합니다. 응답에는 `selectedTerm: null`이 포함됩니다. 이후 학기를 선택하면 `WorkspaceUpdate`로 문자열 학기를 저장합니다.

DB 테이블·PK·FK·관계는 [ERD](erd.md), 실패 코드·메시지는 [오류코드 정의서](error-codes.md), 실제 URL·요청/응답 예시는 [API 명세서](api.md)에서 확인합니다.






Workspace는 users의 화면 설정 표현입니다. TaskInput·TaskUpdate는 courseId를 필수로 받으며 과목명·분반·학기는 과목에서 조회합니다.

## Health

기동 상태 값
사용: API-00



| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| status | string | 필수 | UP, DOWN, OUT_OF_SERVICE, UNKNOWN | 서버 기동 상태 |

## Session

세션 준비 결과
사용: API-01

state=new이면 userId=null, active이면 users.id UUID.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| state | string | 필수 | new, active | 사용자 세션 상태: new 또는 active |
| userId | string \| null | 필수 | 형식 uuid | 세션에 연결된 DueLens 사용자 ID. 시작 전에는 null입니다. |
| csrfToken | string | 필수 | 최소 1자 / 최대 500자 | 쓰기 요청의 CSRF 헤더 값 |

## WorkspaceStart

작업 공간 시작 요청
사용: API-02

initialTerm은 선택 입력입니다. {}로 시작하면 selectedTerm=null이며 재호출은 기존 선택을 보존합니다.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| initialTerm | string | 선택 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 선택 입력. 처음 사용할 학기를 이미 확인한 경우에만 보냅니다. 생략하면 selectedTerm=null로 시작합니다. |

## WorkspaceUpdate

선택 학기 저장 요청
사용: API-04



| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| selectedTerm | string | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 현재 선택 학기 |
| expectedRevision | integer | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 수정 전 조회한 서버 버전 |

## Workspace

작업 공간 정보
사용: API-02, API-03, API-04

selectedTerm 키는 필수이며 값은 string 또는 null입니다. null은 학기 미선택을 뜻합니다.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| id | string | 필수 | 형식 uuid | DueLens 사용자 ID(users.id). workspace는 개인 화면·설정의 API 표현이며 별도 DB 테이블이 아닙니다. |
| selectedTerm | string \| null | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 현재 선택 학기. 첫 사용에서 아직 선택하지 않았으면 null입니다. 필드는 항상 응답합니다. |
| revision | integer | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 현재 서버 버전 |
| createdAt | string | 필수 | 형식 date-time |  |
| updatedAt | string | 필수 | 형식 date-time |  |

## Terms

학기 목록
사용: API-05

selectedTerm 키는 필수이며 값은 string 또는 null입니다. null은 학기 미선택을 뜻합니다.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| selectedTerm | string \| null | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 현재 선택 학기. 첫 사용에서 아직 선택하지 않았으면 null입니다. 필드는 항상 응답합니다. |
| items | object[] | 필수 |  |  |
| items[].code | string | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 업무 결과 코드 |
| items[].label | string | 필수 | 최소 1자 / 최대 40자 |  |

## CourseInput

과목 생성 요청
사용: API-07

days가 비면 startTime=null, 요일이 있으면 HH:mm 필수.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| term | string | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 명시적 소속 학기 |
| name | string | 필수 | 최소 1자 / 최대 100자 |  |
| section | string | 필수 | 최소 1자 / 최대 30자 | 분반 |
| days | integer[] | 필수 | 중복 불가 / 최대 7개 | ISO 요일 1=월요일~7=일요일 |
| startTime | string \| null | 필수 | 지정 형식 검증 | 수업 시작 시각 |

## CourseUpdate

과목 수정 요청
사용: API-09

days가 비면 startTime=null, 요일이 있으면 HH:mm 필수.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| term | string | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 명시적 소속 학기 |
| name | string | 필수 | 최소 1자 / 최대 100자 |  |
| section | string | 필수 | 최소 1자 / 최대 30자 | 분반 |
| days | integer[] | 필수 | 중복 불가 / 최대 7개 | ISO 요일 1=월요일~7=일요일 |
| startTime | string \| null | 필수 | 지정 형식 검증 | 수업 시작 시각 |
| expectedRevision | integer | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 수정 전 조회한 서버 버전 |

## Course

과목 정보
사용: API-06, API-07, API-08, API-09

days가 비면 startTime=null, 요일이 있으면 HH:mm 필수.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| term | string | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 명시적 소속 학기 |
| name | string | 필수 | 최소 1자 / 최대 100자 |  |
| section | string | 필수 | 최소 1자 / 최대 30자 | 분반 |
| days | integer[] | 필수 | 중복 불가 / 최대 7개 | ISO 요일 1=월요일~7=일요일 |
| startTime | string \| null | 필수 | 지정 형식 검증 | 수업 시작 시각 |
| id | string | 필수 | 형식 uuid |  |
| revision | integer | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 현재 서버 버전 |
| createdAt | string | 필수 | 형식 date-time |  |
| updatedAt | string | 필수 | 형식 date-time |  |

## CourseList

과목 목록과 페이지 정보
사용: API-06



| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| items | Course[] | 필수 |  |  |
| page | integer | 필수 | 최솟값 0 / 기본 0 |  |
| size | integer | 필수 | 최솟값 1 / 최댓값 100 / 기본 50 |  |
| total | integer | 필수 | 최솟값 0 | 페이지 분할 전 결과 수 |

## TaskInput

수동 과제 생성 요청
사용: API-12

courseId 필수. 사용자 → 과목 → 과제의 소유 관계를 검증합니다. 날짜 없이 시각 입력 불가.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| courseId | string | 필수 | 형식 uuid | 필수 과목 ID. 서버 세션 사용자 소유의 등록된 과목이어야 합니다. |
| title | string | 필수 | 최소 1자 / 최대 150자 |  |
| dueDate | string \| null | 필수 | 형식 date | 한국 기준 마감 날짜. 미정이면 null |
| dueTime | string \| null | 필수 | 지정 형식 검증 | HH:mm 마감 시각. 미정이면 null |
| status | string | 필수 | todo, in-progress, written, submitted | 과제 진행 상태 |
| submissionFormat | string | 필수 | 최대 100자 |  |
| quantity | string | 필수 | 최대 100자 |  |
| submissionUrl | string \| null | 필수 | 형식 uri / 최대 2048자 | 선택 HTTP(S) 제출 URL |
| description | string | 필수 | 최대 20000자 |  |
| courseRevision | integer | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 선택한 활성 과목을 조회했을 때의 버전. 과목이 바뀌면 다시 확인합니다. |

## TaskUpdate

과제 수정 요청
사용: API-14

courseId 필수. 사용자 → 과목 → 과제의 소유 관계를 검증합니다. 날짜 없이 시각 입력 불가.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| courseId | string | 필수 | 형식 uuid | 필수 과목 ID. 서버 세션 사용자 소유의 등록된 과목이어야 합니다. |
| title | string | 필수 | 최소 1자 / 최대 150자 |  |
| dueDate | string \| null | 필수 | 형식 date | 한국 기준 마감 날짜. 미정이면 null |
| dueTime | string \| null | 필수 | 지정 형식 검증 | HH:mm 마감 시각. 미정이면 null |
| status | string | 필수 | todo, in-progress, written, submitted | 과제 진행 상태 |
| submissionFormat | string | 필수 | 최대 100자 |  |
| quantity | string | 필수 | 최대 100자 |  |
| submissionUrl | string \| null | 필수 | 형식 uri / 최대 2048자 | 선택 HTTP(S) 제출 URL |
| description | string | 필수 | 최대 20000자 |  |
| courseRevision | integer \| null | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 과목 버전. 이미 삭제된 기존 연결을 그대로 유지하는 수정에서만 null을 허용합니다. |
| expectedRevision | integer | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 수정 전 조회한 서버 버전 |

## Task

과제 정보
사용: API-11, API-12, API-13, API-14

courseId 필수. 사용자 → 과목 → 과제의 소유 관계를 검증합니다. 날짜 없이 시각 입력 불가.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| term | string | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 등록된 과목에서 조회하는 값. 과제 테이블에는 중복 저장하지 않습니다. |
| courseId | string | 필수 | 형식 uuid | 필수 과목 ID. 서버 세션 사용자 소유의 등록된 과목이어야 합니다. |
| courseName | string | 필수 | 최소 1자 / 최대 100자 | 등록된 과목에서 조회하는 값. 과제 테이블에는 중복 저장하지 않습니다. |
| section | string | 필수 | 최소 1자 / 최대 30자 | 등록된 과목에서 조회하는 값. 과제 테이블에는 중복 저장하지 않습니다. |
| title | string | 필수 | 최소 1자 / 최대 150자 |  |
| dueDate | string \| null | 필수 | 형식 date | 한국 기준 마감 날짜. 미정이면 null |
| dueTime | string \| null | 필수 | 지정 형식 검증 | HH:mm 마감 시각. 미정이면 null |
| status | string | 필수 | todo, in-progress, written, submitted | 과제 진행 상태 |
| submissionFormat | string | 필수 | 최대 100자 |  |
| quantity | string | 필수 | 최대 100자 |  |
| submissionUrl | string \| null | 필수 | 형식 uri / 최대 2048자 | 선택 HTTP(S) 제출 URL |
| description | string | 필수 | 최대 20000자 |  |
| courseRevision | integer \| null | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 연결한 과목의 현재 버전. 삭제 표시한 기존 연결이면 null입니다. |
| id | string | 필수 | 형식 uuid |  |
| revision | integer | 필수 | 최솟값 1 / 최댓값 9007199254740991 | 현재 서버 버전 |
| source | string | 필수 | 고정 "manual" | 과제 생성 원천 |
| timeZone | string | 필수 | 고정 "Asia/Seoul" | 마감·조회 시간대 |
| createdAt | string | 필수 | 형식 date-time |  |
| updatedAt | string | 필수 | 형식 date-time |  |

## TaskSnapshot

변경 이력용 과제 값 사본
사용: API-15

courseId 필수. 사용자 → 과목 → 과제의 소유 관계를 검증합니다. 날짜 없이 시각 입력 불가.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| term | string | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 기록 당시 과목의 값 사본. 과목 변경 후에도 당시 이력을 보존합니다. |
| courseId | string | 필수 | 형식 uuid | 필수 과목 ID. 서버 세션 사용자 소유의 등록된 과목이어야 합니다. |
| courseName | string | 필수 | 최소 1자 / 최대 100자 | 기록 당시 과목의 값 사본. 과목 변경 후에도 당시 이력을 보존합니다. |
| section | string | 필수 | 최소 1자 / 최대 30자 | 기록 당시 과목의 값 사본. 과목 변경 후에도 당시 이력을 보존합니다. |
| title | string | 필수 | 최소 1자 / 최대 150자 |  |
| dueDate | string \| null | 필수 | 형식 date | 한국 기준 마감 날짜. 미정이면 null |
| dueTime | string \| null | 필수 | 지정 형식 검증 | HH:mm 마감 시각. 미정이면 null |
| status | string | 필수 | todo, in-progress, written, submitted | 과제 진행 상태 |
| submissionFormat | string | 필수 | 최대 100자 |  |
| quantity | string | 필수 | 최대 100자 |  |
| submissionUrl | string \| null | 필수 | 형식 uri / 최대 2048자 | 선택 HTTP(S) 제출 URL |
| description | string | 필수 | 최대 20000자 |  |

## TaskList

과제 목록·집계·조회 범위
사용: API-11



| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| items | Task[] | 필수 |  |  |
| page | integer | 필수 | 최솟값 0 / 기본 0 |  |
| size | integer | 필수 | 최솟값 1 / 최댓값 100 / 기본 50 |  |
| total | integer | 필수 | 최솟값 0 | 페이지 분할 전 결과 수 |
| summary | object | 필수 |  |  |
| summary.total | integer | 필수 | 최솟값 0 | 페이지 분할 전 결과 수 |
| summary.remaining | integer | 필수 | 최솟값 0 | submitted를 제외한 수 |
| summary.submitted | integer | 필수 | 최솟값 0 | 제출 완료 표시 수 |
| summary.unknown | integer | 필수 | 최솟값 0 | 마감 날짜 미정 수 |
| range | object | 필수 |  |  |
| range.period | string | 필수 | all, week, month, undated |  |
| range.startDate | string \| null | 필수 | 형식 date |  |
| range.endDate | string \| null | 필수 | 형식 date |  |
| range.timeZone | string | 필수 | 고정 "Asia/Seoul" | 마감·조회 시간대 |
| asOf | string | 필수 | 형식 date-time | 계산 기준 시점 |

## ScheduleTask

일정 카드의 간단한 과제 정보
사용: API-16



| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| id | string | 필수 | 형식 uuid |  |
| title | string | 필수 | 최소 1자 / 최대 150자 |  |
| courseName | string | 필수 | 최소 1자 / 최대 100자 | 과목명 |
| section | string | 필수 | 최소 1자 / 최대 30자 | 분반 |
| dueTime | string \| null | 필수 | 지정 형식 검증 | HH:mm 마감 시각. 미정이면 null |
| status | string | 필수 | todo, in-progress, written | 과제 진행 상태 |

## Schedule

독립 주간 일정
사용: API-16



| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| term | string | 필수 | 최소 6자 / 최대 11자 / YYYY-1, YYYY-summer, YYYY-2, YYYY-winter | 명시적 소속 학기 |
| weekStart | string | 필수 | 형식 date |  |
| weekEnd | string | 필수 | 형식 date |  |
| timeZone | string | 필수 | 고정 "Asia/Seoul" | 마감·조회 시간대 |
| asOf | string | 필수 | 형식 date-time | 계산 기준 시점 |
| days | object[] | 필수 | 최소 7개 / 최대 7개 | ISO 요일 1=월요일~7=일요일 |
| days[].date | string | 필수 | 형식 date |  |
| days[].count | integer | 필수 | 최솟값 0 |  |
| days[].tasks | ScheduleTask[] | 필수 |  |  |

## HistoryEntry

과제 변경 이력 한 건
사용: API-15

created는 version=1·before=null, 수정은 version≥2·before 객체.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| id | string | 필수 | 형식 uuid |  |
| taskId | string | 필수 | 형식 uuid |  |
| version | integer | 필수 | 최솟값 1 / 최댓값 9007199254740991 |  |
| snapshotVersion | integer | 필수 | 고정 1 | 이력 값 형식 버전 |
| kind | string | 필수 | created, manual-edit |  |
| before | null \| TaskSnapshot | 필수 |  | 변경 전 값. 최초 등록은 null |
| after | TaskSnapshot | 필수 |  | 변경 후 값 |
| note | string | 필수 | 최대 500자 |  |
| occurredAt | string | 필수 | 형식 date-time |  |

## HistoryList

변경 이력 목록
사용: API-15



| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| items | HistoryEntry[] | 필수 |  |  |
| page | integer | 필수 | 최솟값 0 / 기본 0 |  |
| size | integer | 필수 | 최솟값 1 / 최댓값 100 / 기본 50 |  |
| total | integer | 필수 | 최솟값 0 | 페이지 분할 전 결과 수 |

## ApiFailure

공통 실패 응답 구조
사용: API-00, API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, API-11, API-12, API-13, API-14, API-15, API-16

success=false, data=null. 실패 이유는 message 문장으로 안내. 오류코드의 의미는 별도 오류코드 정의서에서 관리.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 false | 성공 여부 |
| code | string | 필수 | 오류코드 정의서의 code | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | null | 필수 |  | 업무 응답 값 |

## SuccessHealth

공통 성공 응답: Health
사용: API-00

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | Health | 필수 |  | 업무 응답 값 |

## SuccessSession

공통 성공 응답: Session
사용: API-01

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | Session | 필수 |  | 업무 응답 값 |

## SuccessWorkspace

공통 성공 응답: Workspace
사용: API-02, API-03, API-04

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | Workspace | 필수 |  | 업무 응답 값 |

## SuccessTerms

공통 성공 응답: Terms
사용: API-05

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | Terms | 필수 |  | 업무 응답 값 |

## SuccessCourseList

공통 성공 응답: CourseList
사용: API-06

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | CourseList | 필수 |  | 업무 응답 값 |

## SuccessCourse

공통 성공 응답: Course
사용: API-07, API-08, API-09

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | Course | 필수 |  | 업무 응답 값 |

## SuccessEmpty

공통 성공 응답: Empty
사용: API-10

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | null | 필수 |  | 업무 응답 값 |

## SuccessTaskList

공통 성공 응답: TaskList
사용: API-11

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | TaskList | 필수 |  | 업무 응답 값 |

## SuccessTask

공통 성공 응답: Task
사용: API-12, API-13, API-14

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | Task | 필수 |  | 업무 응답 값 |

## SuccessHistoryList

공통 성공 응답: HistoryList
사용: API-15

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | HistoryList | 필수 |  | 업무 응답 값 |

## SuccessSchedule

공통 성공 응답: Schedule
사용: API-16

success=true, code=SUCCESS. data는 해당 응답 모델 또는 null.

| 필드 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| success | boolean | 필수 | 고정 true | 성공 여부 |
| code | string | 필수 | 고정 "SUCCESS" | 업무 결과 코드 |
| message | string | 필수 | 최소 1자 / 최대 500자 | 결과 안내 문장 |
| data | Schedule | 필수 |  | 업무 응답 값 |


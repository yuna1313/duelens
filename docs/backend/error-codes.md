# 오류코드 정의서

v0.4 · 2026-11-25. 서버가 처리한 실패의 HTTP 상태는 200입니다. 응답은 success, code, message, data 네 필드이며 실패 이유와 입력 검증 안내는 message 문자열에 담습니다. 아래 메시지는 예시이며 실제 입력에 맞는 구체적인 이유를 반환합니다.

| code | HTTP | 메시지 예시 | 발생 조건 | 처리 방법 |
| --- | --- | --- | --- | --- |
| MALFORMED_REQUEST | 200 | 잘못된 요청 형식입니다. | JSON 구문, URL 매개변수 형식, 중복된 단일 쿼리 값 또는 알 수 없는 필드가 잘못된 경우 | JSON·URL·필드 형식을 수정합니다. |
| USER_REQUIRED | 200 | 사용자 작업 공간을 먼저 시작해 주세요. | 유효한 세션 또는 세션에 연결된 users 행이 없는 경우 | 세션과 사용자 연결을 다시 확인한 뒤 작업 공간을 시작합니다. |
| CSRF_INVALID | 200 | 요청 인증 정보를 확인해 주세요. | 쓰기 요청의 CSRF 토큰 또는 허용 출처 검증에 실패한 경우 | 세션·CSRF 토큰을 다시 확인합니다. |
| NOT_FOUND | 200 | 요청한 정보를 찾을 수 없습니다. | 현재 사용자 소유 범위에서 리소스를 찾지 못한 경우. 타인 소유 여부는 구분하지 않음 | 존재하지 않거나 다른 소유자의 리소스입니다. 두 경우를 구분하지 않습니다. |
| REVISION_CONFLICT | 200 | 다른 변경이 있습니다. 최신 내용을 확인해 주세요. | 요청 expectedRevision과 현재 저장 버전이 다른 경우 | 최신 값을 다시 조회하고 확인 후 저장합니다. |
| COURSE_CHANGED | 200 | 연결한 과목이 변경되었습니다. | 연결 과목의 버전·활성 상태가 과제 폼을 열었을 때와 달라진 경우 | 과목을 다시 조회하고 선택합니다. |
| COURSE_DUPLICATE | 200 | 같은 학기·이름·분반의 과목이 이미 있습니다. | 활성 과목의 학기·정규화 과목명·분반이 기존 과목과 중복되는 경우 | 기존 과목을 확인합니다. |
| IDEMPOTENCY_CONFLICT | 200 | 이미 사용한 요청 키입니다. | 같은 사용자에서 이미 성공한 생성 키를 다른 요청 내용이나 작업에 사용한 경우 | 다른 내용의 생성에는 새 키를 사용합니다. |
| PAYLOAD_TOO_LARGE | 200 | 입력 크기를 줄여 주세요. | JSON 요청 본문이 256 KiB 제한을 초과한 경우 | 본문 크기를 확인합니다. |
| VALIDATION_FAILED | 200 | 시각을 입력하려면 마감 날짜도 입력해 주세요. | 필수 값·길이·실제 달력 날짜·과목 연결 등 업무 입력 검증에 실패한 경우 | message에 담긴 검증 실패 이유를 사용자에게 안내합니다. |
| RATE_LIMITED | 200 | 요청이 많습니다. 잠시 후 다시 시도해 주세요. | 설정한 요청 빈도 또는 자원 제한을 초과한 경우 | Retry-After를 따르며 생성은 같은 키로만 재시도합니다. |
| INTERNAL_ERROR | 200 | 처리 중 문제가 발생했습니다. | 애플리케이션이 처리 중 내부 오류를 감지한 경우. 상세 예외는 응답에 노출하지 않음 | 내부 상세 정보를 공개하지 않습니다. 재조회 후 재시도 여부를 판단합니다. |
| SERVER_UNHEALTHY | 200 | 서버 상태가 정상적이지 않습니다. | 기동 상태 점검 결과 서버가 정상 상태가 아닌 경우 | 서버 기동 상태를 확인합니다. |

## 코드별 실패 응답 예시

### MALFORMED_REQUEST

```json
{
    "success": false,
    "code": "MALFORMED_REQUEST",
    "message": "잘못된 요청 형식입니다.",
    "data": null
}
```

### USER_REQUIRED

```json
{
    "success": false,
    "code": "USER_REQUIRED",
    "message": "사용자 작업 공간을 먼저 시작해 주세요.",
    "data": null
}
```

### CSRF_INVALID

```json
{
    "success": false,
    "code": "CSRF_INVALID",
    "message": "요청 인증 정보를 확인해 주세요.",
    "data": null
}
```

### NOT_FOUND

```json
{
    "success": false,
    "code": "NOT_FOUND",
    "message": "요청한 정보를 찾을 수 없습니다.",
    "data": null
}
```

### REVISION_CONFLICT

```json
{
    "success": false,
    "code": "REVISION_CONFLICT",
    "message": "다른 변경이 있습니다. 최신 내용을 확인해 주세요.",
    "data": null
}
```

### COURSE_CHANGED

```json
{
    "success": false,
    "code": "COURSE_CHANGED",
    "message": "연결한 과목이 변경되었습니다.",
    "data": null
}
```

### COURSE_DUPLICATE

```json
{
    "success": false,
    "code": "COURSE_DUPLICATE",
    "message": "같은 학기·이름·분반의 과목이 이미 있습니다.",
    "data": null
}
```

### IDEMPOTENCY_CONFLICT

```json
{
    "success": false,
    "code": "IDEMPOTENCY_CONFLICT",
    "message": "이미 사용한 요청 키입니다.",
    "data": null
}
```

### PAYLOAD_TOO_LARGE

```json
{
    "success": false,
    "code": "PAYLOAD_TOO_LARGE",
    "message": "입력 크기를 줄여 주세요.",
    "data": null
}
```

### VALIDATION_FAILED

```json
{
    "success": false,
    "code": "VALIDATION_FAILED",
    "message": "시각을 입력하려면 마감 날짜도 입력해 주세요.",
    "data": null
}
```

### RATE_LIMITED

```json
{
    "success": false,
    "code": "RATE_LIMITED",
    "message": "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
    "data": null
}
```

### INTERNAL_ERROR

```json
{
    "success": false,
    "code": "INTERNAL_ERROR",
    "message": "처리 중 문제가 발생했습니다.",
    "data": null
}
```

### SERVER_UNHEALTHY

```json
{
    "success": false,
    "code": "SERVER_UNHEALTHY",
    "message": "서버 상태가 정상적이지 않습니다.",
    "data": null
}
```

권한·CSRF·검증 실패에도 접근 차단과 롤백을 유지합니다. 네트워크 단절·프록시 오류 등 애플리케이션 응답을 받지 못한 경우는 별도로 처리합니다.

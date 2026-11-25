-- 설계안입니다. 실행 중인 DB 또는 Flyway에 적용하지 않았습니다.
-- 사용자 → 과목 → 과제. 과제의 소유권은 과목의 user_id로 검사합니다.
-- UUID·정규화 키·변경 시각은 서버가 생성합니다. UTF-8 DB를 전제로 합니다.
-- 세션 테이블은 사용할 Spring Session 버전의 공식 스키마로 별도 추가합니다.

CREATE TABLE users (
    id uuid PRIMARY KEY,
    display_name varchar(80) CHECK (display_name IS NULL OR char_length(btrim(display_name)) > 0),
    email varchar(254),
    status varchar(16) NOT NULL DEFAULT 'guest' CHECK (status IN ('guest', 'active', 'withdrawn')),
    selected_term varchar(11) DEFAULT NULL
        CHECK (selected_term IS NULL OR selected_term ~ '^[1-9][0-9]{3}-(1|summer|2|winter)$'),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 9007199254740991),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    deleted_at timestamptz,
    CHECK ((status = 'withdrawn' AND deleted_at IS NOT NULL)
        OR (status IN ('guest', 'active') AND deleted_at IS NULL))
);

CREATE TABLE courses (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id),
    term varchar(11) NOT NULL CHECK (term ~ '^[1-9][0-9]{3}-(1|summer|2|winter)$'),
    name varchar(100) NOT NULL CHECK (char_length(btrim(name)) > 0),
    section varchar(30) NOT NULL CHECK (char_length(btrim(section)) > 0),
    name_key text NOT NULL CHECK (char_length(name_key) BETWEEN 1 AND 300),
    section_key text NOT NULL CHECK (char_length(section_key) BETWEEN 1 AND 90),
    meeting_days smallint NOT NULL DEFAULT 0 CHECK (meeting_days BETWEEN 0 AND 127),
    start_time time without time zone,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 9007199254740991),
    deleted_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CHECK ((meeting_days = 0 AND start_time IS NULL)
        OR (meeting_days > 0 AND start_time IS NOT NULL)),
    CHECK (start_time IS NULL OR (start_time < time '24:00' AND extract(second FROM start_time) = 0))
);

CREATE UNIQUE INDEX courses_active_identity
    ON courses (user_id, term, name_key, section_key)
    WHERE deleted_at IS NULL;

CREATE TABLE tasks (
    id uuid PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES courses(id),
    title varchar(150) NOT NULL CHECK (char_length(btrim(title)) > 0),
    due_date date CHECK (due_date BETWEEN date '1000-01-01' AND date '9999-12-31'),
    due_time time without time zone,
    time_zone varchar(20) NOT NULL DEFAULT 'Asia/Seoul' CHECK (time_zone = 'Asia/Seoul'),
    status varchar(20) NOT NULL CHECK (status IN ('todo', 'in-progress', 'written', 'submitted')),
    submission_format varchar(100) NOT NULL DEFAULT '',
    quantity varchar(100) NOT NULL DEFAULT '',
    submission_url varchar(2048),
    description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 20000),
    source varchar(20) NOT NULL DEFAULT 'manual' CHECK (source = 'manual'),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision BETWEEN 1 AND 9007199254740991),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CHECK (due_time IS NULL OR due_date IS NOT NULL),
    CHECK (due_time IS NULL OR (due_time < time '24:00' AND extract(second FROM due_time) = 0))
);

CREATE INDEX tasks_course_deadline ON tasks (course_id, due_date, due_time, id);
CREATE INDEX courses_user_term ON courses (user_id, term, id);

CREATE TABLE task_history (
    id uuid PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES tasks(id),
    version bigint NOT NULL CHECK (version BETWEEN 1 AND 9007199254740991),
    snapshot_version smallint NOT NULL DEFAULT 1 CHECK (snapshot_version = 1),
    kind varchar(20) NOT NULL CHECK (kind IN ('created', 'manual-edit')),
    before_values jsonb,
    after_values jsonb NOT NULL CHECK (jsonb_typeof(after_values) = 'object'),
    note varchar(500) NOT NULL DEFAULT '',
    occurred_at timestamptz NOT NULL,
    UNIQUE (task_id, version),
    CHECK ((kind = 'created' AND version = 1 AND before_values IS NULL)
        OR (kind = 'manual-edit' AND version > 1 AND before_values IS NOT NULL
            AND jsonb_typeof(before_values) = 'object'))
);

CREATE TABLE idempotency_requests (
    user_id uuid NOT NULL REFERENCES users(id),
    request_key uuid NOT NULL,
    operation varchar(100) NOT NULL,
    request_hash char(64) NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
    response_status smallint NOT NULL CHECK (response_status = 200),
    response_body jsonb NOT NULL CHECK (jsonb_typeof(response_body) = 'object'),
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, request_key),
    CHECK (expires_at > created_at)
);

CREATE INDEX idempotency_requests_expiry ON idempotency_requests (expires_at);

-- DB 제약과 함께 적용할 서버 검증·트랜잭션 규칙은 data-model.md에 정의합니다.

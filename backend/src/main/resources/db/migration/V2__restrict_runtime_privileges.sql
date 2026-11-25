-- 접속 계정은 DB 관리자에게서 duelens_runtime 역할을 부여받습니다.
-- Flyway의 스키마 변경 계정과 애플리케이션 실행 계정을 분리합니다.
GRANT USAGE ON SCHEMA public TO duelens_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, courses, tasks, idempotency_requests TO duelens_runtime;
GRANT SELECT, INSERT ON task_history TO duelens_runtime;

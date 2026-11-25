# 백엔드 의존성 보안 점검

확인일: 2026-11-25. 신규 PostgreSQL·Flyway 연결 구성에 사용한 실제 Gradle `runtimeClasspath` 버전을 확인했습니다.

| 구성 요소 | 실제 버전 | 확인 |
| --- | --- | --- |
| PostgreSQL 서버 | 18.7 | Homebrew 설치 버전·공식 보안 공지 |
| Spring Boot | 4.2.0 | Gradle 해석 결과·공식 공지 |
| Spring Framework / JDBC | 7.1.0 | Gradle 해석 결과·OSV |
| pgJDBC | 42.7.14 | 공식 보안 수정 버전·OSV |
| Flyway core / PostgreSQL 모듈 | 12.11.0 | 실제 PostgreSQL 마이그레이션 검증·OSV |
| HikariCP | 7.1.0 | Gradle 해석 결과·OSV |
| Tomcat | 11.0.27 | Gradle 해석 결과·OSV |
| Jackson core / databind | 3.1.8 | Gradle 해석 결과·OSV |

공개 Maven 패키지명·해석 버전 64개를 OSV `querybatch`로 조회했으며 등록된 취약점 결과는 0개였습니다. 전체 버전·확인 시각은 [점검 기록 JSON](dependency-security-20261125.json)에 있습니다. 테스트 전용 의존성·Homebrew 전체 패키지·OS는 이 Maven 조회 범위에 포함하지 않았으며 미등록 취약점이나 구성 결함이 없다는 보장은 아닙니다.

pgJDBC의 CVE-2026-107314는 42.7.14에서 수정된 것으로 공식 공지를 확인했습니다. 로컬 연결은 SCRAM 인증을 긍정 목록으로 지정하며 비밀번호·연결 설정은 Git에 포함하지 않습니다. DB 설치·연결과 실제 검증은 [PostgreSQL 구성 기록](postgresql-setup.md)에 있습니다.

근거: [PostgreSQL 보안 공지](https://www.postgresql.org/support/security/), [pgJDBC 보안 공지](https://jdbc.postgresql.org/security/), [Spring 보안 공지](https://spring.io/security/), [OSV API](https://google.github.io/osv.dev/api/).

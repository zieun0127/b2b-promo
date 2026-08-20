# b2b-promotion 백엔드 개발을 위한 지침

## 반드시 준수할 사항

- SOLID 원칙은 판단 기준으로 삼되, `5-project-principle.md`의 "오버엔지니어링 금지"와 충돌하면 후자를 우선한다.
- 아키텍처는 `5-project-principle.md` 2절의 `route → controller → service → db` 단순 레이어 구조를 따른다. 계층 간 의존은 위→아래 한 방향만 허용하고, SQL은 db 계층에만 둔다. (정통 Clean Architecture의 엔티티/유스케이스/포트-어댑터·DI 컨테이너는 이 프로젝트 규모(1인 개발, 3일 일정, 엔티티 5개)에서는 채택하지 않는다.)

## 참고 문서 (../docs/)

| 문서 이름 | 파일 | 설명 |
|---|---|---|
| 도메인 정의서 | [`1-domain-definition.md`](../docs/1-domain-definition.md) | 엔티티, 비즈니스 규칙 |
| PRD | [`3-PRD.md`](../docs/3-PRD.md) | 기능 요구사항, 기술 스택 |
| 프로젝트 구조 설계 원칙 | [`5-project-principle.md`](../docs/5-project-principle.md) | 레이어, 네이밍, 백엔드 디렉토리 구조 |
| 기술 아키텍처 다이어그램 | [`6-arch-diagram.md`](../docs/6-arch-diagram.md) | 시스템 구성 |
| ERD / DB 스키마 | [`8-erd.md`](../docs/8-erd.md) / [`8-schema.sql`](../docs/8-schema.sql) | 테이블 구조, DDL |
| 실행 계획 | [`9-plan.md`](../docs/9-plan.md) | 백엔드 Task 목록 및 완료 조건 체크박스 |
| API 스펙 | [`swagger.json`](../docs/swagger.json) | OpenAPI 3.0 |

작업 시작 전 관련 문서를 먼저 확인할 것. 구현이 문서와 달라지면 코드가 아니라 해당 문서를 함께 갱신한다.

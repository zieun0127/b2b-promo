# b2b-promotion 프론트엔드앱 개발을 위한 지침

## 반드시 준수할 사항

- 기술 스택(`3-PRD.md` 6절): React 19, 전역 상태관리는 Zustand, 백엔드 통신은 TanStack Query를 사용한다. 다른 상태관리/데이터 페칭 라이브러리를 임의로 추가하지 않는다.

## 참고 문서 (../docs/)

| 문서 이름 | 파일 | 설명 |
|---|---|---|
| 도메인 정의서 | [`1-domain-definition.md`](../docs/1-domain-definition.md) | 엔티티, 비즈니스 규칙 |
| PRD | [`3-PRD.md`](../docs/3-PRD.md) | 기능 요구사항, 기술 스택 |
| 사용자 시나리오 | [`4-user-scenario.md`](../docs/4-user-scenario.md) | 화면별 사용자 흐름 |
| 프로젝트 구조 설계 원칙 | [`5-project-principle.md`](../docs/5-project-principle.md) | 레이어, 네이밍, 프론트엔드 디렉토리/페이지 구조 |
| 기술 아키텍처 다이어그램 | [`6-arch-diagram.md`](../docs/6-arch-diagram.md) | 시스템 구성 |
| 화면 와이어프레임 | [`7-wireframe.md`](../docs/7-wireframe.md) | 페이지별 레이아웃(모바일/데스크탑) |
| 실행 계획 | [`9-plan.md`](../docs/9-plan.md) | 프론트엔드 Task 목록 및 완료 조건 체크박스 |
| 스타일 가이드 | [`10-style.md`](../docs/10-style.md) | 컬러/타이포/카드·섹션헤더 패턴 |
| API 스펙 | [`swagger.json`](../docs/swagger.json) | OpenAPI 3.0 |

작업 시작 전 관련 문서를 먼저 확인할 것. 구현이 문서와 달라지면 코드가 아니라 해당 문서를 함께 갱신한다.

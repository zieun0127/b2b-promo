# 사장님 MBTI

외식업 사장님을 위한 12문항 MBTI 진단 + 유형별 맞춤 프로모션 추천/신청 서비스. React 19 + Zustand + TanStack Query 프론트엔드와 Express + PostgreSQL 백엔드로 구성된다.

## 문서 (docs/)

| 문서 | 파일 |
|---|---|
| 도메인 정의서 | [`docs/1-domain-definition.md`](docs/1-domain-definition.md) |
| 유스케이스 다이어그램 | [`docs/2-usecase.md`](docs/2-usecase.md) |
| PRD (제품 요구사항 문서) | [`docs/3-PRD.md`](docs/3-PRD.md) |
| 사용자 시나리오 | [`docs/4-user-scenario.md`](docs/4-user-scenario.md) |
| 프로젝트 구조 설계 원칙 | [`docs/5-project-principle.md`](docs/5-project-principle.md) |
| 기술 아키텍처 다이어그램 | [`docs/6-arch-diagram.md`](docs/6-arch-diagram.md) |
| 화면 와이어프레임 | [`docs/7-wireframe.md`](docs/7-wireframe.md) |
| ERD | [`docs/8-erd.md`](docs/8-erd.md) |
| DB 스키마 DDL | [`docs/8-schema.sql`](docs/8-schema.sql) |
| 실행 계획 (Task 목록) | [`docs/9-plan.md`](docs/9-plan.md) |
| 스타일 가이드 | [`docs/10-style.md`](docs/10-style.md) |
| API 스펙 (OpenAPI 3.0) | [`docs/swagger.json`](docs/swagger.json) |

## Demo Site

- 프론트엔드: https://mbti-127-fe.vercel.app
- 백엔드 API: https://mbti-127-be.vercel.app

## 테스트용 사용자 계정

> 아래 계정은 채점/시연 전용으로 별도 생성한 계정이며, 운영 서비스의 실제 사용자 계정과는 무관하다.

| 구분 | 이메일 | 비밀번호 |
|---|---|---|
| 관리자 (ADMIN) | `grader-admin@sajangnim-mbti.local` | `Grader2026!Admin` |
| 일반 사용자 (USER) | `grader-user@sajangnim-mbti.local` | `Grader2026!User` |

일반 사용자 계정은 아직 MBTI 테스트를 진행하지 않은 상태이므로, 아래 시나리오의 테스트 응시부터 그대로 따라 하면 된다.

## 간략한 테스트 시나리오

1. **일반 사용자 흐름**
   1. `grader-user@sajangnim-mbti.local` / `Grader2026!User`로 로그인한다.
   2. MBTI 테스트 12문항에 모두 응답하고 제출하면 판정된 유형·유형 설명·장사 TIP·추천 프로모션이 표시된다.
   3. 상단 "이벤트/프로모션" 메뉴로 이동해 전체 목록을 확인하고, "전체/신규/마감임박/내 MBTI" 필터를 눌러 목록이 바뀌는지 확인한다.
   4. 프로모션 카드의 하트(♡) 버튼으로 북마크를, "신청하기" 버튼으로 신청을 각각 토글한다.
   5. "마이페이지"로 이동해 최근 결과, 유형 뱃지 옆 "MBTI 테스트 다시 하기" 버튼, 추천/참여 이력/북마크/신청 프로모션 섹션이 모두 표시되는지 확인한다.
2. **관리자 흐름**
   1. `grader-admin@sajangnim-mbti.local` / `Grader2026!Admin`로 로그인한다.
   2. "관리자 통계" 화면에서 전체 참여자 수, MBTI 유형별/지표별 비율이 표시되는지 확인한다.
   3. "프로모션 관리" 화면에서 신규 프로모션을 등록(대상 MBTI 유형 1개 이상 선택 필수)하고, 목록에 매칭 수·북마크 수·신청 수가 반영되는지 확인한다.
   4. 신청 수를 클릭해 신청자 이메일/신청일시 목록이 펼쳐지는지 확인한다.
   5. 일반 사용자 계정으로는 `/admin/stats`, `/admin/promotions`에 접근할 수 없음을 확인한다(접근 시 자동 리다이렉트).

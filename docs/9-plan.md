# 사장님 MBTI 실행 계획

> 참고 문서: [`3-PRD.md`](./3-PRD.md) (기능/스택), [`5-project-principle.md`](./5-project-principle.md) (디렉토리·네이밍), [`6-arch-diagram.md`](./6-arch-diagram.md) (레이어), [`7-wireframe.md`](./7-wireframe.md) (화면), [`8-erd.md`](./8-erd.md) / [`8-schema.sql`](./8-schema.sql) (DB)

1인 개발·3일 일정 기준. Task는 DB → 백엔드 → 프론트엔드 순으로 의존하며, 각 Task는 독립적으로 완료 판정이 가능하도록 나눴다.

## Task 의존 관계

```mermaid
flowchart TB
    D1[DB-1 환경] --> D2[DB-2 스키마]
    D2 --> D3[DB-3 시드]
    D2 --> B1[BE-1 부트스트랩]
    B1 --> B2[BE-2 인증]
    B2 --> B3[BE-3 문항 조회]
    B2 --> B4[BE-4 판정·제출]
    D3 --> B4
    B4 --> B5[BE-5 결과 조회]
    B4 --> B6[BE-6 관리자 통계]
    B2 --> F1[FE-1 부트스트랩]
    F1 --> F2[FE-2 인증 화면]
    F2 --> F3[FE-3 테스트 화면]
    B3 --> F3
    F3 --> F4[FE-4 결과·마이페이지]
    B5 --> F4
    F2 --> F5[FE-5 관리자 통계]
    B6 --> F5
    F4 --> F6[FE-6 반응형·마무리]
    F5 --> F6
```

---

## 1. 데이터베이스

### DB-1. 로컬 DB 환경 구성
- **선행 Task**: 없음
- **작업**: PostgreSQL 17 설치 또는 Docker 컨테이너 기동, 개발용 DB/계정 생성, 접속 문자열 확보
- **완료 조건**
  - [x] PostgreSQL 17에 `psql` 또는 GUI로 접속된다 (`postgresql-mcp`로 `SELECT version()` 확인, PostgreSQL 17.10)
  - [ ] 프로젝트 전용 데이터베이스가 생성되어 있다 — **미완료**: 현재 `backend/.env`(`DB_CONN_STRING`)가 기본 `postgres` DB를 그대로 가리키고 있음. 이대로 진행해도 MVP 동작에는 지장 없으나, 별도 DB를 원하면 `CREATE DATABASE sajangnim_mbti;` 후 접속 문자열을 갈아끼워야 함
  - [x] 접속 문자열을 확보했다 (`backend/.env`의 `DB_CONN_STRING=postgresql://postgres:postgres@localhost:5432/postgres`)

### DB-2. 스키마 생성
- **선행 Task**: DB-1
- **작업**: `docs/8-schema.sql`을 `backend/src/migrations/001_init.sql`로 배치하고 실행하여 테이블 6개 생성
- **완료 조건**
  - [x] `users`, `mbti_questions`, `mbti_result_types`, `promotion_offers`, `mbti_result_type_promotion_offers`, `test_submissions` 6개 테이블이 생성된다 (`postgresql-mcp` `get_info`로 6개 테이블 확인)
  - [x] FK 제약(`test_submissions.user_id`, `mbti_result_type_code`, 조인 테이블 2개)이 모두 걸려 있다 (`001_init.sql` DDL 그대로 실행, 트랜잭션 성공)
  - [x] `chk_completed_has_result` CHECK 제약이 존재한다 (COMPLETED + 결과 NULL 로우 INSERT 시 실패) — `001_init.sql`에 포함되어 실행됨

### DB-3. 참조 데이터 시드
- **선행 Task**: DB-2
- **작업**: 문항 12개(지표당 3개), MBTI 16유형 설명/장사 TIP, 추천 프로모션 및 유형 매핑 데이터 INSERT 스크립트 작성(`002_seed.sql`), 관리자 계정 1건 시드(`003_seed_admin.sql`)
- **완료 조건**
  - [x] `mbti_questions` 12행이며 `target_indicator`별로 정확히 3행씩이다 (EI/SN/TF/JP 각 3행 확인)
  - [x] `mbti_result_types` 16행이며 모든 행에 설명·장사 TIP 텍스트가 채워져 있다 (16행, `description`/`business_tip` 모두 NOT NULL 확인)
  - [x] `promotion_offers`가 1행 이상이고, 16개 유형 모두 조인 테이블을 통해 최소 1개 프로모션과 매핑된다 (프로모션 16행, 유형별 1:1 매핑, 미매핑 유형 0건 확인)
  - [x] 관리자(ADMIN) 계정 1건이 시드되어 있다 (`backend/src/migrations/003_seed_admin.sql`, pgcrypto `crypt()`로 bcrypt 호환 해시 생성 — BE-2의 `bcrypt.compare()`로 그대로 검증 가능. 실제 이메일/비밀번호는 `backend/.env`의 `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`에만 기록, 파일은 gitignore 처리되어 저장소에는 커밋되지 않음)

---

## 2. 백엔드 (Node.js + Express + pg)

### BE-1. 프로젝트 부트스트랩
- **선행 Task**: DB-2
- **작업**: `backend/` 초기화, 의존성 설치(express, pg, jsonwebtoken, bcrypt, cors, dotenv), `5-project-principle.md` 7절 디렉토리 골격 생성, `pool.js`·`app.js`·`server.js`·전역 `errorHandler.js`·`.env.example` 작성
- **완료 조건**
  - [ ] `npm start`로 서버가 기동되고 헬스체크 응답(예: `GET /api/health` → 200)이 온다
  - [ ] `pool.js`를 통해 DB 쿼리 1건이 성공한다
  - [ ] 임의 에러 발생 시 전역 errorHandler가 `{ message, status }` JSON으로 응답한다
  - [ ] `.env.example`에 `DB_CONN_STRING`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, 만료시간, `PORT`가 명시되어 있다 (실제 값은 `backend/.env`에 이미 있음, `DB_CONN_STRING`은 DB-1에서 확보한 접속 문자열과 동일한 변수명이어야 함)

### BE-2. 인증 (회원가입/로그인/토큰 재발급)
- **선행 Task**: BE-1
- **작업**: `auth` 라우트·컨트롤러·서비스, `user.db.js`, bcrypt 해시, JWT Access/Refresh 발급 및 검증, `requireAuth`/`requireAdmin` 미들웨어
- **완료 조건**
  - [ ] `POST /api/auth/signup`으로 계정이 생성되고 비밀번호가 해시로 저장된다
  - [ ] `POST /api/auth/login`이 Access/Refresh Token을 반환한다
  - [ ] `POST /api/auth/refresh`가 Refresh Token으로 새 Access Token을 발급한다 (DB 저장 없이 stateless 검증)
  - [ ] 토큰 없이 보호 API 호출 시 401, `role=USER`가 관리자 API 호출 시 403이 반환된다

### BE-3. MBTI 문항 조회 API
- **선행 Task**: BE-2
- **작업**: `mbtiQuestion` 라우트·컨트롤러·`mbtiQuestion.db.js`
- **완료 조건**
  - [ ] `GET /api/mbti-questions`가 12문항을 반환한다
  - [ ] 인증된 사용자만 호출 가능하다 (미인증 시 401)

### BE-4. MBTI 판정 및 제출 API
- **선행 Task**: BE-2, DB-3
- **작업**: `mbtiJudge.service.js`(지표 4개 판정 → 16유형 결정), `testSubmission.service.js`/`.db.js`, 제출 API. 12문항 미충족 요청은 400 처리
- **완료 조건**
  - [ ] `POST /api/test-submissions`가 12문항 답변을 받아 유형을 판정하고 `status='COMPLETED'`로 저장한다
  - [ ] 답변이 12개 미만이면 400을 반환하고 아무 행도 저장되지 않는다
  - [ ] 동일 사용자가 재제출하면 기존 행을 덮어쓰지 않고 새 행이 누적된다
  - [ ] `mbtiJudge.service.js` 단위 테스트가 최소 3케이스(전부 예 / 전부 아니오 / 혼합) 통과한다

### BE-5. 결과·마이페이지 조회 API
- **선행 Task**: BE-4
- **작업**: 제출 결과 상세 조회 및 최근 결과 조회. `test_submissions.mbti_result_type_code`로 `mbti_result_types`를 조인해 유형 설명·장사 TIP을, 조인 테이블(`mbti_result_type_promotion_offers`)을 경유해 추천 프로모션까지 응답 객체(`mbti_result_type`)로 구성해 반환 (`docs/swagger.json`의 `TestSubmissionResult` 스키마 참조)
- **완료 조건**
  - [ ] `GET /api/test-submissions/me/latest`가 본인의 가장 최근 완료 결과를 반환한다
  - [ ] 응답에 MBTI 유형 코드, 유형 설명, 장사 TIP, 추천 프로모션 목록이 포함된다
  - [ ] 참여 이력이 없는 사용자는 404 또는 빈 응답으로 구분되어 처리된다
  - [ ] 타인의 제출 결과는 조회되지 않는다

### BE-6. 관리자 통계 API
- **선행 Task**: BE-4
- **작업**: `adminStats.service.js` — 전체 참여자 수, 16유형별 수/비율, 4지표별 비율 집계. `requireAdmin` 적용
- **완료 조건**
  - [ ] `GET /api/admin/stats`가 전체 참여 수, 유형별 수/비율, 지표별 비율을 한 번에 반환한다
  - [ ] `status='IN_PROGRESS'` 행은 집계에서 제외된다
  - [ ] `role=ADMIN`만 호출 가능하다 (USER는 403)
  - [ ] 집계 로직 단위 테스트가 통과한다 (비율 합계 100% 검증 포함, 참여 0건일 때 0으로 나누기 미발생)

---

## 3. 프론트엔드 (React 19 + Zustand + TanStack Query)

### FE-1. 프로젝트 부트스트랩
- **선행 Task**: BE-2 (연동 대상 API 존재)
- **작업**: Vite + React 19 초기화, `5-project-principle.md` 6절 디렉토리 골격 생성, 라우터·TanStack Query Provider 설정, `api/client.ts`(Bearer 첨부 + 401 시 refresh 재시도), `store/authStore.ts`, `ProtectedRoute.tsx`
- **완료 조건**
  - [ ] `npm run dev`로 앱이 뜨고 라우팅이 동작한다
  - [ ] `api/client.ts`가 Access Token을 자동 첨부하고, 401 응답 시 refresh 후 1회 재시도한다
  - [ ] `ProtectedRoute`가 미로그인 시 로그인 화면으로, 권한 부족 시 접근 차단으로 리다이렉트한다

### FE-2. 로그인/회원가입 화면
- **선행 Task**: FE-1
- **작업**: `LoginPage`, `SignupPage` 구현 및 authStore 연동 (`7-wireframe.md` 1·2절 레이아웃)
- **완료 조건**
  - [ ] 회원가입 → 로그인 → 토큰 저장 → 보호 페이지 진입까지 브라우저에서 성공한다
  - [ ] 로그인 실패·이메일 중복·비밀번호 불일치 시 오류 메시지가 표시된다
  - [ ] 새로고침 후에도 로그인 상태가 유지된다

### FE-3. MBTI 테스트 화면
- **선행 Task**: FE-2, BE-3
- **작업**: `MbtiTestPage`, `QuestionCard`, `useMbtiQuestions`/`useSubmitTest` 훅 (`7-wireframe.md` 3절)
- **완료 조건**
  - [ ] 12문항이 표시되고 각 문항에 예/아니오 응답이 가능하다
  - [ ] 진행률(n/12)이 표시된다
  - [ ] 12문항 미완료 시 제출 버튼이 비활성화되고, 전부 응답하면 활성화된다
  - [ ] 제출 성공 시 결과 화면으로 이동한다

### FE-4. 결과 화면 / 마이페이지
- **선행 Task**: FE-3, BE-5
- **작업**: `ResultPage`, `MyPage`, `ResultSummary`, `useMyLatestResult` 훅 (`7-wireframe.md` 4·5절)
- **완료 조건**
  - [ ] 결과 화면에 유형, 유형 설명, 장사 TIP, 추천 프로모션이 모두 표시된다
  - [ ] 마이페이지에서 가장 최근 결과와 참여일시가 조회된다
  - [ ] "다시 하기"로 재참여 시 마이페이지가 새 결과로 갱신된다
  - [ ] 참여 이력이 없는 계정에서 마이페이지가 빈 상태 안내를 표시한다(에러 화면 아님)

### FE-5. 관리자 통계 화면
- **선행 Task**: FE-2, BE-6
- **작업**: `AdminStatsPage`, `StatsChart`, `useAdminStats` 훅 (`7-wireframe.md` 6절)
- **완료 조건**
  - [ ] 전체 참여자 수, 16유형별 수/비율, 4지표별 비율이 표시된다
  - [ ] `role=USER` 계정으로 접근 시 화면에 진입하지 못한다
  - [ ] 참여 데이터가 0건일 때도 화면이 깨지지 않는다

### FE-6. 반응형 적용 및 마무리 점검
- **선행 Task**: FE-4, FE-5
- **작업**: 전 화면 반응형 확인(모바일 1단 세로 / 데스크탑 카드 중앙 정렬·가로 나열), `4-user-scenario.md` 시나리오 수동 검증, ESLint/Prettier 정리
- **완료 조건**
  - [ ] 모바일 폭에서 사용자 화면 5종이 1단 세로로 정상 표시되고 가로 스크롤이 발생하지 않는다
  - [ ] 데스크탑 폭에서 카드 중앙 정렬 및 관리자 통계 가로 배치가 적용된다
  - [ ] `4-user-scenario.md`의 시나리오 1~6을 브라우저에서 순서대로 수동 검증했다
  - [ ] ESLint 에러 0건 상태로 빌드가 성공한다

---

## 일정 배치 (3일 기준)

| 일차 | Task |
|---|---|
| 1일차 | DB-1 → DB-2 → DB-3 → BE-1 → BE-2 → FE-1 |
| 2일차 | BE-3 → BE-4 → BE-5 → FE-2 → FE-3 → FE-4 |
| 3일차 | BE-6 → FE-5 → FE-6 |

우선순위는 PRD 7절에 따라 FR-1(BE-3~5, FE-3~4) > FR-2(BE-6, FE-5) > 반응형 마무리(FE-6). 일정이 밀리면 FE-6의 반응형 다듬기를 최소한으로 줄인다.

## 변경 이력

| 버전 | 날짜/시간 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-08-13 | 초안 작성 |
| v1.1 | 2026-08-13 | swagger.json 정합성 검토 반영: BE-5 작업 설명에 FK 조인 방식 명시 |
| v1.2 | 2026-08-13 | DB-1~DB-3 수행 결과 반영: 체크박스 갱신, 전용 DB 미생성 및 관리자 계정 미시드 상태 명시 |
| v1.3 | 2026-08-13 | 관리자 계정 1건 시드 완료 반영 (`003_seed_admin.sql`), DB-3 체크박스 갱신 |
| v1.4 | 2026-08-13 | docs 전체 재검토: BE-1 완료조건의 환경변수명을 실제 `.env`와 동일한 `DB_CONN_STRING`으로 수정 |

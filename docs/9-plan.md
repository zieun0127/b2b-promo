# 사장님 MBTI 실행 계획

> 참고 문서: [`3-PRD.md`](./3-PRD.md) (기능/스택), [`5-project-principle.md`](./5-project-principle.md) (디렉토리·네이밍), [`6-arch-diagram.md`](./6-arch-diagram.md) (레이어), [`7-wireframe.md`](./7-wireframe.md) (화면), [`8-erd.md`](./8-erd.md) / [`8-schema.sql`](./8-schema.sql) (DB)

1인 개발 기준. Task는 DB → 백엔드 → 프론트엔드 순으로 의존하며, 각 Task는 독립적으로 완료 판정이 가능하도록 나눴다.

- **1차 MVP (3일 일정, 완료)**: DB-1~3, BE-1~6, FE-1~6 — FR-1(MBTI 테스트/결과) + FR-2(관리자 통계)
- **2차 확장 (별도 일정, 진행 예정)**: DB-4, BE-7~10, FE-7~9 — FR-3(프로모션 목록/북마크) + FR-4(관리자 프로모션 CRUD)

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

    D3 --> D4[DB-4 프로모션·북마크 스키마]
    D4 --> B7[BE-7 프로모션 조회/CRUD]
    B4 --> B7
    B7 --> B8[BE-8 북마크]
    B5 --> B9[BE-9 참여이력 조회]
    B6 --> B10[BE-10 통계 by_promotion 확장]
    B8 --> B10
    F2 --> F7[FE-7 프로모션 목록]
    B7 --> F7
    B8 --> F7
    F4 --> F8[FE-8 마이페이지 확장]
    B9 --> F8
    F7 --> F8
    F5 --> F9[FE-9 관리자 프로모션 관리]
    B7 --> F9
    B10 --> F9
```

> DB-4, BE-7~10, FE-7~9는 v1.6(지속 재방문 강화 기획, FR-3/FR-4)에서 추가된 태스크로 FE-6(1차 MVP 완료) 이후 별도 일정으로 진행한다.
> BE-9(참여 이력 조회)는 북마크/프로모션과 무관하게 BE-5만 선행하므로 DB-4·BE-7을 기다리지 않고 언제든 병행 가능하다.

---

## 1. 데이터베이스

### DB-1. 로컬 DB 환경 구성
- **선행 Task**: 없음
- **작업**: PostgreSQL 17 설치 또는 Docker 컨테이너 기동, 개발용 DB/계정 생성, 접속 문자열 확보
- **완료 조건**
  - [x] PostgreSQL 17에 `psql` 또는 GUI로 접속된다 (`postgresql-mcp`로 `SELECT version()` 확인, PostgreSQL 17.10)
  - [x] 데이터베이스 접속 대상이 결정되어 있다 — **결정**: 별도 전용 DB를 만들지 않고 기본 `postgres` DB를 그대로 사용하기로 확정(1인 개발 MVP 규모상 분리 불필요 판단). `backend/.env`의 `DB_CONN_STRING`이 이 DB를 가리킴
  - [x] 접속 문자열을 확보했다 (`backend/.env`의 `DB_CONN_STRING=postgresql://postgres:postgres@localhost:5432/postgres`)

### DB-2. 스키마 생성
- **선행 Task**: DB-1
- **작업**: `docs/8-schema.sql`을 `backend/src/migrations/001_init.sql`로 배치하고 실행하여 테이블 6개 생성
- **⚠️ 문서 정합성 규칙(v1.19 확정)**: `docs/8-schema.sql`은 **현재 스키마의 전체 스냅샷**(신규 환경을 한 번에 세팅하는 용도)이고, `backend/src/migrations/00N_*.sql`은 **증분 이력**이다. 따라서 DB-4 이후 `8-schema.sql` ≠ `001_init.sql`이 되는 것이 정상이다(001은 당시 상태로 동결, 신규 컬럼/테이블은 004에 추가). 스키마를 변경할 때는 반드시 ①새 마이그레이션 파일 추가와 ②`8-schema.sql` 스냅샷 갱신을 함께 한다.
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

### DB-4. 프로모션 확장 컬럼 및 북마크 테이블 (v1.6 신규)
- **선행 Task**: DB-3
- **작업**: `backend/src/migrations/004_add_promotion_bookmark.sql` 작성·실행 — ①`promotion_offers`에 `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `ends_at TIMESTAMPTZ NULL` 추가, ②`bookmarks` 테이블 신설(복합 PK `(user_id, promotion_offer_id)`), ③`idx_bookmarks_promotion_offer_id` 인덱스 추가, ④**기존 시드 16건의 뱃지 검증용 날짜 보정**. `docs/8-schema.sql` 스냅샷도 함께 갱신(DB-2의 정합성 규칙 참조 — 이미 반영됨).
- **⚠️ 날짜 보정이 필요한 이유**: 실제 DB에 프로모션 16건이 이미 시드되어 있고(확인 완료), 컬럼을 그냥 추가하면 `created_at`이 전부 마이그레이션 시각으로 찍혀 **16건 모두 "신규" 뱃지**가 되고 `ends_at`은 전부 NULL이 되어 **"마감임박" 뱃지를 검증할 데이터가 존재하지 않는다**. FE-7 완료조건(뱃지 정확 표시)을 실제 데이터로 검증하려면 세 가지 상태가 모두 있어야 한다.
- **완료 조건**
  - [x] `promotion_offers`에 `created_at`(NOT NULL, 기본값 now())과 `ends_at`(NULL 허용) 컬럼이 추가된다 (`information_schema.columns` 조회로 타입/nullable/기본값 확인: `created_at timestamptz NOT NULL DEFAULT now()`, `ends_at timestamptz NULL`)
  - [x] `bookmarks` 테이블이 복합 PK `(user_id, promotion_offer_id)`와 두 FK로 생성된다 (동일 조합 중복 INSERT 시 PK 위반으로 실패하는 것까지 확인 — 실제로 1건 삽입 후 동일 조합 재삽입 시도 시 `중복된 키 값이 "bookmarks_pkey" 고유 제약 조건을 위반함` 에러 확인, 테스트 데이터는 정리함)
  - [x] 기존 프로모션 16건의 `created_at`이 과거 시점으로 분산되어, "신규"(최근 7일 내) 해당 건과 미해당 건이 모두 존재한다 (3건: 2/4/6일 전 등록 → 신규, 나머지 13건: 10~90일 전 등록 → 신규 아님, 실측 쿼리로 확인)
  - [x] 기존 프로모션 중 2~3건에 가까운 미래 `ends_at`이 설정되어 "마감임박"(7일 내 마감) 케이스가 존재하고, 나머지는 `ends_at IS NULL`(상시)로 남는다 (3건: 2/4/6일 후 마감 → 마감임박, 나머지 13건: `ends_at IS NULL` → 상시, 실측 쿼리로 확인. 신규 3건과 마감임박 3건은 서로 겹치지 않게 구성해 뱃지 3상태(신규/마감임박/상시)가 모두 독립적으로 존재)
  - [x] `docs/8-schema.sql` 스냅샷과 실제 DB 스키마가 일치한다 (`information_schema.columns`로 `promotion_offers`/`bookmarks` 전체 컬럼 대조 완료, 전날 미리 갱신해둔 스냅샷과 정확히 일치)
  - **작업 파일**: `backend/src/migrations/004_add_promotion_bookmark.sql` (ALTER/CREATE TABLE/CREATE INDEX + 기존 16건 날짜 보정 UPDATE 16건)

---

## 2. 백엔드 (Node.js + Express + pg)

### BE-1. 프로젝트 부트스트랩
- **선행 Task**: DB-2
- **작업**: `backend/` 초기화, 의존성 설치(express, pg, jsonwebtoken, bcrypt, cors, dotenv), `5-project-principle.md` 7절 디렉토리 골격 생성, `pool.js`·`app.js`·`server.js`·전역 `errorHandler.js`·`.env.example` 작성
- **완료 조건**
  - [x] `npm start`로 서버가 기동되고 헬스체크 응답(예: `GET /api/health` → 200)이 온다 (`npm start` 후 `curl /api/health` → 200 `{"status":"ok"}` 확인, `health.test.js`로도 자동 검증)
  - [x] `pool.js`를 통해 DB 쿼리 1건이 성공한다 (헬스체크가 `pool.query('SELECT 1')` 실행, 실제 로컬 PostgreSQL 연결로 테스트 통과)
  - [x] 임의 에러 발생 시 전역 errorHandler가 `{ message, status }` JSON으로 응답한다 (`errorHandler.test.js`: AppError 400 / 일반 Error 500 각각 검증, `health.test.js`의 DB 장애 모킹 케이스로도 확인)
  - [x] `.env.example`에 `DB_CONN_STRING`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, 만료시간, `PORT`가 명시되어 있다
  - **테스트**: `backend/src/__tests__/health.test.js`, `errorHandler.test.js` — Jest+Supertest, 2 suites 5 tests 전부 통과, 커버리지(서버 진입점 `server.js` 제외) `app.js`/`pool.js`/`errorHandler.js` 문장 커버리지 100%

### BE-2. 인증 (회원가입/로그인/토큰 재발급)
- **선행 Task**: BE-1
- **작업**: `auth` 라우트·컨트롤러·서비스, `user.db.js`, bcrypt 해시, JWT Access/Refresh 발급 및 검증, `requireAuth`/`requireAdmin` 미들웨어
- **완료 조건**
  - [x] `POST /api/auth/signup`으로 계정이 생성되고 비밀번호가 해시로 저장된다 (`auth.test.js`: 201 응답에 password/password_hash 미노출 확인, 이메일 중복 409, 형식오류/누락 400)
  - [x] `POST /api/auth/login`이 Access/Refresh Token을 반환한다 (`access_token`/`refresh_token`/`user` 확인, 시드된 관리자 계정으로도 로그인 검증)
  - [x] `POST /api/auth/refresh`가 Refresh Token으로 새 Access Token을 발급한다 (DB 저장 없이 stateless 검증) (위조/만료 토큰 401 확인)
  - [x] 토큰 없이 보호 API 호출 시 401, `role=USER`가 관리자 API 호출 시 403이 반환된다 (`requireAuth`/`requireAdmin` 미들웨어 단위 테스트로 검증 — 통합 레벨 403은 BE-6에서 실제 보호 라우트로 재확인 예정, 지금 더미 라우트는 만들지 않음)
  - **테스트**: `backend/src/__tests__/auth.test.js`, `requireAuth.test.js`, `requireAdmin.test.js` — 5 suites 21 tests 전부 통과, 커버리지 전체 98.26% stmts(목표 90% 초과), `auth.service.js`만 94.28%(edge case 2줄 미커버, 완료조건에는 영향 없음)

### BE-3. MBTI 문항 조회 API
- **선행 Task**: BE-2
- **작업**: `mbtiQuestion` 라우트·컨트롤러·서비스·`mbtiQuestion.db.js` (레이어 원칙 준수를 위해 얇은 service 포함)
- **완료 조건**
  - [x] `GET /api/mbti-questions`가 12문항을 반환한다 (`mbtiQuestion.test.js`: 200 응답 배열 길이 12, `id`/`content`/`target_indicator`/`yes_trait_value` 필드·enum 검증, `ORDER BY id`로 재호출 시 순서 동일함까지 확인)
  - [x] 인증된 사용자만 호출 가능하다 (미인증 시 401) (헤더 없음/위조 토큰 각각 401 확인, 기존 `requireAuth` 미들웨어 재사용)
  - **테스트**: `backend/src/__tests__/mbtiQuestion.test.js` — 전체 6 suites 26 tests 통과, 커버리지 97.14% (목표 90% 초과)

### BE-4. MBTI 판정 및 제출 API
- **선행 Task**: BE-2, DB-3
- **작업**: `mbtiJudge.service.js`(지표 4개 판정 → 16유형 결정), `testSubmission.service.js`/`.db.js`, 제출 API. 12문항 미충족 요청은 400 처리
- **완료 조건**
  - [x] `POST /api/test-submissions`가 12문항 답변을 받아 유형을 판정하고 `status='COMPLETED'`로 저장한다 (201 응답에 `mbti_result_type`/`promotion_offers`까지 조립되어 포함됨, swagger `TestSubmissionResult`와 일치)
  - [x] 답변이 12개 미만이면 400을 반환하고 아무 행도 저장되지 않는다 (11개 제출 → 400 확인 후 `test_submissions` count 0 확인)
  - [x] 동일 사용자가 재제출하면 기존 행을 덮어쓰지 않고 새 행이 누적된다 (2회 제출 후 count 2 확인)
  - [x] `mbtiJudge.service.js` 단위 테스트가 최소 3케이스(전부 예 / 전부 아니오 / 혼합) 통과한다 (ESTJ/INFP/ENTP 3케이스)
  - **테스트**: `mbtiJudge.service.test.js`, `testSubmission.test.js` — 전체 8 suites 33 tests 통과, 커버리지 97.08% (목표 90% 초과)
  - **참고**: 결과 조립 로직(`testSubmission.service.js`의 `buildResultDetail`)과 `mbtiResultType.db.js`/`promotionOffer.db.js`를 BE-5에서 그대로 재사용하도록 설계해둠

### BE-5. 결과·마이페이지 조회 API
- **선행 Task**: BE-4
- **작업**: 제출 결과 상세 조회 및 최근 결과 조회. `test_submissions.mbti_result_type_code`로 `mbti_result_types`를 조인해 유형 설명·장사 TIP을, 조인 테이블(`mbti_result_type_promotion_offers`)을 경유해 추천 프로모션까지 응답 객체(`mbti_result_type`)로 구성해 반환 (`docs/swagger.json`의 `TestSubmissionResult` 스키마 참조)
- **완료 조건**
  - [x] `GET /api/test-submissions/me/latest`가 본인의 가장 최근 완료 결과를 반환한다 (`ORDER BY submitted_at DESC LIMIT 1`, 2회 제출 후 마지막 건 반환 확인)
  - [x] 응답에 MBTI 유형 코드, 유형 설명, 장사 TIP, 추천 프로모션 목록이 포함된다 (BE-4의 `buildResultDetail` 재사용)
  - [x] 참여 이력이 없는 사용자는 404 또는 빈 응답으로 구분되어 처리된다 (404 확정, swagger 스펙과 일치: `완료된 테스트 참여 이력이 없습니다.`)
  - [x] 타인의 제출 결과는 조회되지 않는다 (`WHERE user_id=$1`을 항상 `req.user.id`로만 바인딩, A/B 두 사용자로 교차 검증)
  - **테스트**: `testSubmission.test.js`에 신규 describe 블록 5케이스 추가 — 전체 8 suites 38 tests 통과, 커버리지 97.23% (목표 90% 초과)

### BE-6. 관리자 통계 API
- **선행 Task**: BE-4
- **작업**: `adminStats.service.js` — 전체 참여자 수, 16유형별 수/비율, 4지표별 비율 집계. `requireAdmin` 적용
- **완료 조건**
  - [x] `GET /api/admin/stats`가 전체 참여 수, 유형별 수/비율, 지표별 비율을 한 번에 반환한다 (`total_completed_submissions`, `by_result_type` 16개, `by_indicator` 4개×traits 2개 확인)
  - [x] `status='IN_PROGRESS'` 행은 집계에서 제외된다 (모든 집계 쿼리 `WHERE`/`ON` 절에 `status='COMPLETED'` 조건 적용)
  - [x] `role=ADMIN`만 호출 가능하다 (USER는 403) (`requireAuth` → `requireAdmin` 순서로 체이닝, 미인증 401·권한부족 403 분리 확인)
  - [x] 집계 로직 단위 테스트가 통과한다 (비율 합계 100% 검증 포함, 참여 0건일 때 0으로 나누기 미발생) (`computeStats` 순수 함수, 0건 픽스처+임의 분포 픽스처 각각 검증)
  - **테스트**: `adminStats.service.test.js`, `admin.test.js` — 전체 10 suites 43 tests 통과, 커버리지 97.22% (목표 90% 초과)

### BE-7. 프로모션 조회/등록/수정/삭제 API (v1.6 신규)
- **선행 Task**: BE-4, **DB-4**(스키마 없이는 진행 불가)
- **작업**: `promotionOffer` 라우트·컨트롤러·서비스·db.js 확장 — `GET /api/promotion-offers`(목록+추천정렬), `POST`/`PUT /api/promotion-offers/:id`(관리자 전용, 대상 유형 1개 이상 검증), `DELETE /api/promotion-offers/:id`(연관 매핑/북마크 함께 삭제). 기존 조회 전용이던 `promotionOffer.db.js`에 쓰기 함수를 추가한다.
- **책임 경계(구현 시 혼동 주의)**:
  - `GET /api/promotion-offers` 응답은 swagger `PromotionOfferListItem` 스키마 **전체 필드를 이 태스크에서 모두 구현**한다 — `bookmark_count`(`bookmarks` LEFT JOIN + COUNT)와 `is_bookmarked`(요청자 기준 EXISTS)도 포함. DB-4에서 테이블이 이미 만들어져 있으므로 조인 자체는 가능하며, 북마크 API(BE-8)가 없는 시점에는 값이 항상 `0`/`false`로 나오는 것이 정상이다. **BE-8은 이 필드를 새로 만드는 것이 아니라 실제 값이 맞게 채워지는지 검증한다.**
  - "인기 프로모션 TOP3"는 서버가 별도 엔드포인트/정렬로 제공하지 않는다. 목록 응답의 `bookmark_count`를 **프론트엔드(FE-7)가 정렬**해 상위 3개를 뽑는다(`docs/1-domain-definition.md` 8절 정렬 규칙 — 서버 기본 정렬은 추천 우선 → 등록일 내림차순).
- **완료 조건**
  - [x] `GET /api/promotion-offers`가 전체 프로모션을 반환하고, 완료된 TestSubmission 보유 사용자는 매핑된 프로모션이 `recommended: true`로 목록 상단에 정렬된다 (`promotionOffer.test.js`: 실제 문항 제출로 판정받은 유형에 매핑된 프로모션을 관리자가 등록 후 목록 조회 시 `recommended: true` 및 최상단 확인)
  - [x] 응답 각 항목이 swagger `PromotionOfferListItem`의 필수 필드를 모두 포함한다 (`created_at`, `ends_at`, `mbti_type_codes`, `recommended`, `bookmark_count`, `is_bookmarked`) (목록 조회 응답 `toMatchObject`로 필드 존재·타입 확인)
  - [x] MBTI 검사 이력이 없는 사용자도 목록을 조회할 수 있고, 이 경우 모든 항목의 `recommended`가 `false`다 (에러 아님) (신규 가입 사용자로 목록 조회 시 200 및 전체 `recommended: false` 확인)
  - [x] `POST`/`PUT /api/promotion-offers`가 대상 MBTI 유형 미지정 시 400을 반환하고, 정상 요청 시 즉시 목록에 반영된다 (`mbti_type_codes: []` 400 확인, 등록/수정 직후 목록 재조회로 반영 확인)
  - [x] `role=USER`가 등록/수정/삭제를 시도하면 403이 반환된다 (`requireAuth`+`requireAdmin` 재사용) (POST/PUT/DELETE 각각 일반 사용자 토큰으로 403 확인)
  - [x] 삭제 시 해당 프로모션의 `mbti_result_type_promotion_offers` 매핑과 `bookmarks` 행이 함께 삭제되고, 과거 `test_submissions` 결과는 영향받지 않는다 (삭제 대상에 북마크 1건을 직접 심어두고 삭제 후 매핑/북마크/프로모션 3개 테이블 모두 0행, 사용자의 `test_submissions` count는 삭제 전후 동일함을 확인)
  - **테스트**: `promotionOffer.service.test.js`(추천 정렬/유형 검증 순수 로직), `promotionOffer.test.js`(라우트 통합) — 전체 12 suites 62 tests 통과, `promotionOffer.service.js`/`.routes.js` 100%, `promotionOffer.controller.js` 95%, `promotionOffer.db.js` 88.23%(트랜잭션 ROLLBACK 분기만 미커버) — 목표 90% 충족

### BE-8. 프로모션 북마크 API (v1.6 신규)
- **선행 Task**: BE-7
- **작업**: `bookmark` 라우트·컨트롤러·서비스·db.js 신규 — `POST /api/bookmarks`(멱등 등록), `DELETE /api/bookmarks/:promotionOfferId`(멱등 해제), `GET /api/bookmarks`(본인 북마크 목록). BE-7이 이미 구현한 `bookmark_count`/`is_bookmarked` 필드는 여기서 값이 실제로 반영되는지만 검증한다.
- **완료 조건**
  - [x] 동일 프로모션을 두 번 북마크해도 중복 저장되지 않는다(`ON CONFLICT DO NOTHING` 등으로 멱등 처리, PK 위반 500이 나지 않을 것) (`bookmark.test.js`: 동일 사용자·동일 프로모션 2회 POST 모두 201, `bookmarks` count 1건 확인)
  - [x] 북마크되지 않은 상태에서 해제를 요청해도 에러 없이 204를 반환한다(멱등) (미북마크 상태 DELETE 204, 북마크 후 2회 연속 DELETE 모두 204 및 count 0 확인)
  - [x] `GET /api/bookmarks`가 본인이 북마크한 프로모션만 반환한다(A/B 두 사용자 교차 검증, 타인 북마크 미노출) (사용자 A만 북마크한 프로모션이 A 목록엔 포함, B 목록엔 미포함 확인)
  - [x] 북마크 등록/해제 후 `GET /api/promotion-offers`의 `bookmark_count`/`is_bookmarked`가 실제 상태와 일치한다(BE-7이 만든 필드의 값 검증) (등록 전 0/false → 등록 후 1/true → 해제 후 0/false 순서로 실측)
  - [x] 존재하지 않는 프로모션 ID로 북마크를 시도하면 404를 반환한다 (임의 UUID로 POST 시 404 확인)
  - **테스트**: `bookmark.test.js` — 멱등성/교차검증 케이스 포함, 전체 13 suites 71 tests 통과, 신규 파일 `bookmark.db.js`/`.service.js`/`.routes.js` 100%, `.controller.js` 85.71%(에러 콜백 분기만 미커버) — 목표 90% 충족

### BE-9. 참여 이력 전체 조회 API (v1.6 신규)
- **선행 Task**: BE-5 (프로모션·북마크와 무관 — DB-4/BE-7을 기다리지 않고 병행 가능)
- **작업**: `GET /api/test-submissions/me` 추가 — 본인의 완료 이력 전체를 참여일시 내림차순으로 반환. `testSubmission.db.js`에 `findAllByUserId(userId)` 추가하고 BE-4의 `buildResultDetail`을 각 행에 재사용한다.
- **완료 조건**
  - [x] `GET /api/test-submissions/me`가 본인의 완료(COMPLETED) 이력 전체를 `submitted_at` 내림차순으로 반환한다 (2회 제출 후 최신 건이 먼저 오는지 확인)
  - [x] 이력이 없으면 빈 배열 `[]`을 반환한다 (404 아님 — 기존 `/me/latest`는 404를 반환하므로 두 엔드포인트의 처리 방식이 다른 점에 주의) (신규 계정으로 조회 시 `[]` 확인, `/me/latest`는 여전히 404인 것과 대비)
  - [x] 라우트 등록 순서상 `/me`와 `/me/latest`가 서로를 가로채지 않는다 (두 경로 모두 정상 응답 확인) (동일 계정으로 `/me`(배열)와 `/me/latest`(단일 최신 건)를 함께 호출해 둘 다 200 및 기대한 형태로 응답함을 확인)
  - [x] 타인의 이력은 조회되지 않는다 (`req.user.id`만 바인딩, A/B 교차 검증) (A만 제출 후 B로 조회 시 `[]` 확인)
  - **테스트**: `testSubmission.test.js`에 `GET /api/test-submissions/me` describe 블록 추가 — 전체 13 suites 77 tests 통과, `testSubmission.db.js`/`.service.js` 100% — 목표 90% 충족

### BE-10. 관리자 통계 by_promotion 확장 (v1.6 신규)
- **선행 Task**: BE-6, BE-8
- **작업**: `adminStats.service.js`/`adminStats.db.js`에 `by_promotion`(프로모션별 추천 매칭 수·북마크 수) 집계 추가. 순수 함수 `computeStats`의 입출력 구조를 확장하되 기존 `by_result_type`/`by_indicator` 계산은 건드리지 않는다.
- **완료 조건**
  - [x] `GET /api/admin/stats` 응답에 `by_promotion` 배열이 포함되고, 각 항목이 swagger `PromotionStat` 스키마(`id`, `name`, `recommended_match_count`, `bookmark_count`)를 만족한다 (`admin.test.js`에서 실제 응답 배열 각 항목 `toMatchObject`로 필드/타입 확인)
  - [x] `recommended_match_count`가 해당 프로모션에 매핑된 MBTI 유형으로 판정된 완료 TestSubmission 수와 일치한다 (`adminStats.db.js`의 서브쿼리가 `mbti_result_type_promotion_offers` 매핑을 경유해 `test_submissions.status='COMPLETED'`만 집계하도록 구현)
  - [x] `bookmark_count`가 BE-8의 실제 북마크 수와 일치한다 (BE-8과 동일하게 `bookmarks` 테이블을 `promotion_offer_id`로 COUNT하는 서브쿼리 재사용)
  - [x] 프로모션 0건 또는 참여 0건 상태에서도 0으로 나누기/NaN 없이 정상 응답한다 (기존 BE-6의 0건 방어 원칙 유지) (`adminStats.service.test.js`: `promotionStats` 미전달/빈 배열 시 `by_promotion: []`로 안전하게 반환 확인)
  - [x] 기존 `by_result_type`/`by_indicator` 응답이 회귀 없이 그대로 동작한다 (BE-6 테스트 전부 통과 유지) (`computeStats` 기존 로직 미변경, 기존 admin.test.js/adminStats.service.test.js 케이스 전부 통과)
  - **테스트**: `adminStats.service.test.js`에 `by_promotion` 집계 케이스 추가(0건 픽스처 포함), `admin.test.js`에 `by_promotion` 필드 검증 추가 — 전체 13 suites 77 tests 통과, `adminStats.db.js`/`.service.js` 100% — 목표 90% 충족

### BE-11. 프로모션 신청 API (v1.10 신규, 서비스 활용성 강화)
- **선행 Task**: BE-7, BE-8(bookmark 패턴 재사용)
- **작업**: DB-5(`005_add_promotion_applications.sql`, `promotion_applications` 테이블, bookmarks와 동일 구조) + `promotionApplication` 라우트·컨트롤러·서비스·db.js 신규(BE-8 bookmark 구현을 그대로 미러링) — `POST /api/applications`(멱등 등록), `DELETE /api/applications/:promotionOfferId`(멱등 해제). `promotionOffer.db.js`의 `LIST_COLUMNS`에 `application_count`/`is_applied` 추가(bookmark_count/is_bookmarked와 동일 패턴). 관리자 전용 `GET /api/promotion-offers/:id/applicants`(email+applied_at 목록, 신청일 내림차순) 추가 — 별도 연락처 입력 폼 없이 `users.email`을 그대로 반환해 관리자가 직접 연락하게 한다. `promotionOffer.db.js`의 `deleteById`에 `promotion_applications` 정리도 추가.
- **완료 조건**
  - [x] 동일 프로모션을 두 번 신청해도 중복 저장되지 않는다(멱등) (`promotionApplication.test.js`: 동일 사용자·동일 프로모션 2회 POST 모두 201, count 1건 확인)
  - [x] 신청되지 않은 상태에서 취소를 요청해도 에러 없이 204를 반환한다(멱등) (신청 후 2회 연속 DELETE 모두 204 및 count 0 확인)
  - [x] 신청/취소 후 `GET /api/promotion-offers`의 `application_count`/`is_applied`가 실제 상태와 일치한다 (등록 전 0/false → 등록 후 1/true → 해제 후 0/false 순서로 실측)
  - [x] 존재하지 않는 프로모션 ID로 신청을 시도하면 404를 반환한다
  - [x] `GET /api/promotion-offers/:id/applicants`는 관리자만 호출 가능하고(일반 사용자 403, 미인증 401), 신청자의 email/applied_at을 신청일 내림차순으로 반환한다(A/B 두 사용자 교차 검증) (`promotionApplication.test.js`)
  - [x] 관리자가 프로모션을 삭제하면 연관된 Application도 함께 제거된다(FK 위반 없이 삭제 성공)
  - **테스트**: `promotionApplication.test.js` 신규(bookmark.test.js 미러링 + 관리자 신청자 조회 케이스) — 전체 14 suites 86 tests 통과, 신규 파일 `promotionApplication.db.js`/`.service.js`/`.routes.js` 100%, `.controller.js` 90%(에러 콜백 분기만 미커버) — 목표 90% 충족

---

## 3. 프론트엔드 (React 19 + Zustand + TanStack Query)

### FE-1. 프로젝트 부트스트랩
- **선행 Task**: BE-2 (연동 대상 API 존재)
- **작업**: Vite + React 19 초기화, `5-project-principle.md` 6절 디렉토리 골격 생성, 라우터·TanStack Query Provider 설정, `api/client.ts`(Bearer 첨부 + 401 시 refresh 재시도), `store/authStore.ts`, `ProtectedRoute.tsx`
- **완료 조건**
  - [x] `npm run dev`로 앱이 뜨고 라우팅이 동작한다 (`npm run build` 및 `npm run dev` 후 `/`, `/login` curl 200 확인, `react-router-dom` `createBrowserRouter`로 6개 페이지 placeholder 라우팅 구성)
  - [x] `api/client.ts`가 Access Token을 자동 첨부하고, 401 응답 시 refresh 후 1회 재시도한다 (`client.test.ts` 4케이스: 헤더 첨부/401→refresh 성공 후 재시도/refresh 실패 시 로그아웃 정리/`_retry` 재요청 방지)
  - [x] `ProtectedRoute`가 미로그인 시 로그인 화면으로, 권한 부족 시 접근 차단으로 리다이렉트한다 (`ProtectedRoute.test.tsx`: 비로그인 `/login` 리다이렉트, role 불일치 `/` 리다이렉트, 정상 접근 시 `Outlet` 렌더)
  - **테스트**: `authStore.test.ts`, `client.test.ts`, `ProtectedRoute.test.tsx` — Vitest+React Testing Library, 3 suites 11 tests 전부 통과, 대상 3개 파일(`authStore.ts` 100%, `ProtectedRoute.tsx` 100%, `client.ts` 89.65%) 합산 문장 커버리지 93.02%(목표 90% 초과)

### FE-2. 로그인/회원가입 화면
- **선행 Task**: FE-1
- **작업**: `LoginPage`, `SignupPage` 구현 및 authStore 연동 (`7-wireframe.md` 1·2절 레이아웃)
- **완료 조건**
  - [x] 회원가입 → 로그인 → 토큰 저장 → 보호 페이지 진입까지 브라우저에서 성공한다 (Playwright로 실제 dev 서버(5173)+백엔드(3000) 대상 회원가입→로그인→`/`(MbtiTestPage) 진입 확인)
  - [x] 로그인 실패·이메일 중복·비밀번호 불일치 시 오류 메시지가 표시된다 (브라우저에서 잘못된 비밀번호로 로그인 시 "이메일 또는 비밀번호가 올바르지 않습니다." 표시 확인, `LoginPage.test.tsx`/`SignupPage.test.tsx`에 401/409/클라이언트측 비밀번호 불일치 케이스 포함)
  - [x] 새로고침 후에도 로그인 상태가 유지된다 (zustand `persist`(localStorage) 기반, 브라우저에서 로그인 후 전체 페이지 새로고침해도 `/`에 유지됨을 확인)
  - [x] (v1.2 추가) 로그인 성공 시 완료된 MBTI 결과 유무로 목적지가 분기된다 — 결과가 있으면 `/promotions`, 없으면 `/`(테스트 화면) (`LoginPage.tsx`에서 `setAuth` 후 `getMyLatestResult()` 조회 결과로 분기, 조회 실패 시에도 로그인 자체는 성공하고 `/`로 안전하게 폴백. `LoginPage.test.tsx`에 두 분기+조회 실패 폴백 케이스 추가. Playwright로 신규 계정(→`/`)과 테스트 완료 후 재로그인(→`/promotions`) 두 경로 모두 실측 확인, 테스트 데이터는 정리함)
  - **테스트**: `authApi.test.ts`, `LoginPage.test.tsx`, `SignupPage.test.tsx` — 전체 20 suites 117 tests 통과(v1.2 기준), 대상 파일(`authApi.ts` 92.3%, `LoginPage.tsx`/`SignupPage.tsx` 100%, `client.ts` 89.65%) 목표 90% 충족

### FE-3. MBTI 테스트 화면
- **선행 Task**: FE-2, BE-3
- **작업**: `MbtiTestPage`, `QuestionCard`, `useMbtiQuestions`/`useSubmitTest` 훅 (`7-wireframe.md` 3절)
- **완료 조건**
  - [x] 12문항이 표시되고 각 문항에 예/아니오 응답이 가능하다 (Playwright로 실제 dev 서버 대상 12문항 렌더 및 예/아니오 클릭 확인)
  - [x] 진행률(n/12)이 표시된다 (브라우저에서 0/12 → 응답할수록 갱신 → 12/12까지 확인)
  - [x] 12문항 미완료 시 제출 버튼이 비활성화되고, 전부 응답하면 활성화된다 (0/12일 때 disabled, 12/12에서 활성화 확인)
  - [x] 제출 성공 시 결과 화면으로 이동한다 (제출하기 클릭 후 `/result`로 실제 이동 확인)
  - **테스트**: `testApi.test.ts`, `MbtiTestPage.test.tsx` 추가 — 전체 8 suites 34 tests 통과, 대상 파일(`testApi.ts` 92%, `MbtiTestPage.tsx` 100%) 포함 전체 문장 커버리지 94.95%(목표 90% 초과)

### FE-4. 결과 화면 / 마이페이지
- **선행 Task**: FE-3, BE-5
- **작업**: `ResultPage`, `MyPage`, `ResultSummary`, `useMyLatestResult` 훅 (`7-wireframe.md` 4·5절)
- **완료 조건**
  - [x] 결과 화면에 유형, 유형 설명, 장사 TIP, 추천 프로모션이 모두 표시된다 (Playwright로 제출 직후 `/result`에서 ESTJ 유형/설명/TIP/프로모션 전부 렌더 확인)
  - [x] 마이페이지에서 가장 최근 결과와 참여일시가 조회된다 (`/mypage`에서 참여일시+결과 상세 확인)
  - [x] "다시 하기"로 재참여 시 마이페이지가 새 결과로 갱신된다 (재제출 후 마이페이지가 ESTJ→INFP, 참여일시도 최신으로 갱신됨을 실제 확인 — TanStack Query 기본 refetch-on-mount로 별도 invalidate 없이 해결)
  - [x] 참여 이력이 없는 계정에서 마이페이지가 빈 상태 안내를 표시한다(에러 화면 아님) (신규 계정으로 `/mypage` 접근 시 "아직 참여한 테스트가 없습니다." 안내+링크 확인, 에러 텍스트 아님)
  - **테스트**: `testSubmissionApi.test.ts`, `ResultSummary.test.tsx`, `ResultPage.test.tsx`, `MyPage.test.tsx` 추가 — 전체 12 suites 50 tests 통과, 대상 4개 파일 모두 100% 문장 커버리지 포함 전체 94.96%(목표 90% 초과)

### FE-5. 관리자 통계 화면
- **선행 Task**: FE-2, BE-6
- **작업**: `AdminStatsPage`, `StatsChart`, `useAdminStats` 훅 (`7-wireframe.md` 6절)
- **완료 조건**
  - [x] 전체 참여자 수, 16유형별 수/비율, 4지표별 비율이 표시된다 (Playwright로 실제 관리자 계정 로그인 후 `/admin/stats`에서 전체 참여자 수+16유형+8개 trait 전부 렌더 확인)
  - [x] `role=USER` 계정으로 접근 시 화면에 진입하지 못한다 (일반 사용자로 `/admin/stats` 직접 접근 시 즉시 `/`로 리다이렉트됨을 실제 확인, `ProtectedRoute`가 FE-1부터 검증된 로직을 그대로 재사용)
  - [x] 참여 데이터가 0건일 때도 화면이 깨지지 않는다 (실제 DB가 0건인 상태에서 확인 — "전체 참여자 수: 0명", 16유형 모두 0%로 정상 렌더, 크래시 없음)
  - **테스트**: `adminApi.test.ts`, `AdminStatsPage.test.tsx` 추가(0건 케이스 포함) — 전체 14 suites 56 tests 통과, 대상 파일(`adminApi.ts`/`AdminStatsPage.tsx`/`StatsChart.tsx` 100%) 포함 전체 문장 커버리지 94.83%(목표 90% 초과)

### FE-6. 반응형 적용 및 마무리 점검
- **선행 Task**: FE-4, FE-5
- **작업**: 전 화면 반응형 확인(모바일 1단 세로 / 데스크탑 카드 중앙 정렬·가로 나열), `4-user-scenario.md` 시나리오 수동 검증, ESLint/Prettier 정리
- **완료 조건**
  - [x] 모바일 폭에서 사용자 화면 5종이 1단 세로로 정상 표시되고 가로 스크롤이 발생하지 않는다 (Playwright 375px 뷰포트로 로그인/회원가입/테스트/결과/마이페이지 5개 화면 `scrollWidth === clientWidth` 확인, 전역 `box-sizing: border-box` 추가)
  - [x] 데스크탑 폭에서 카드 중앙 정렬 및 관리자 통계 가로 배치가 적용된다 (1280px 뷰포트 스크린샷으로 로그인 카드 중앙정렬, 관리자 통계 지표별 4그룹(E/I·S/N·T/F·J/P) 가로 나열 확인. `.admin-stats-page`에 폭 제한(960px)+중앙정렬 신규 추가, `.stats-grid` 자식에 `@media(min-width:768px)` 최소폭 지정)
  - [x] `4-user-scenario.md`의 시나리오 1~6을 브라우저에서 순서대로 수동 검증했다 (Playwright로 실제 브라우저 흐름 재현: 1-회원가입→로그인→제출→결과, 2-마이페이지 최근결과, 3-다시하기 재참여 후 마이페이지 갱신(ESTJ→INFP), 4-미완료 제출 버튼 비활성, 5-관리자 통계 표시, 6-1 비로그인 접근 시 `/login` 리다이렉트·6-2 일반사용자 관리자화면 접근 시 `/` 리다이렉트, 순서대로 전부 확인)
  - [x] oxlint 에러 0건 상태로 빌드가 성공한다 (`package.json`이 ESLint가 아닌 Vite 8 기본 린터 oxlint를 채택하고 있어 완료조건 문구를 실제 도구명으로 수정 — ESLint 신규 설치는 중복 도구 추가라 오버엔지니어링으로 판단. `npm run lint` 0건, `npm run build` 성공 확인)
  - **테스트**: 신규 JS/TS 로직 없이 `index.css` 미디어쿼리만 추가(CSS는 커버리지 계산 범위 밖) — 기존 14 suites 56 tests 그대로 통과, 회귀 없음 확인

### FE-7. 이벤트/프로모션 목록 화면 (v1.6 신규)
- **선행 Task**: FE-2, BE-7, BE-8
- **작업**: `PromotionListPage`, `PromotionCard`, `usePromotions`/`useBookmarks` 훅, `promotionApi.ts`/`bookmarkApi.ts` (`7-wireframe.md` 7절 + `10-style.md` 4절 뱃지 스타일). 라우터에 `/promotions` 경로를 `ProtectedRoute` 하위로 추가하고 네비게이션 진입점을 만든다.
- **참고**: "인기 프로모션 TOP3"와 "신규/마감임박" 뱃지는 **모두 프론트엔드에서 계산**한다(BE-7 책임 경계 참조). 서버는 `bookmark_count`/`created_at`/`ends_at` 원본 값만 내려주므로, 정렬(`bookmark_count` 내림차순 상위 3개)과 뱃지 판정(신규: 최근 7일 내 등록 / 마감임박: 7일 내 마감)의 기준값을 상수로 한 곳에 모아 테스트 가능한 순수 함수로 분리한다.
- **완료 조건**
  - [x] 등록된 전체 프로모션이 목록에 표시되고, MBTI 검사 완료 사용자는 매핑된 프로모션이 상단에 "추천" 뱃지로 정렬된다 (`PromotionListPage.test.tsx`: `sortByRecommendedThenDate` 적용 결과 추천 항목이 상단에 오는지 확인)
  - [x] 북마크 수 상위 3개가 "인기 프로모션" 섹션에 노출된다 (`pickTopByBookmarks` 순수 함수 + `PromotionListPage.test.tsx`로 상위 3개만 TOP3 섹션에 중복 노출됨을 확인)
  - [x] 등록일/마감일 기준 "신규"/"마감임박" 뱃지가 정확히 표시된다 (DB-4에서 보정한 실제 데이터로 세 상태 모두 확인) (`promotionBadges.ts`의 `isNew`/`isEndingSoon`/`daysUntil` 순수 함수 단위 테스트로 경계값 검증, `PromotionCard.test.tsx`로 렌더 분기 확인)
  - [x] (v1.8 추가) 각 프로모션에 매핑된 MBTI 유형이 뱃지로 함께 표시된다 (`PromotionCard.tsx`: `mbti_type_codes` 배열을 순회해 유형별 뱃지 렌더, 0개면 미노출. `PromotionCard.test.tsx`에 케이스 추가)
  - [x] 북마크 버튼 클릭 시 즉시 토글되고(낙관적 갱신 또는 재조회), 재방문 시에도 상태가 유지된다 (`useToggleBookmark`가 성공 시 `['promotions']`/`['bookmarks']` 쿼리를 무효화해 재조회하도록 구현, `PromotionListPage.test.tsx`에서 버튼 클릭 시 `toggle(id, is_bookmarked)` 호출 확인)
  - [x] MBTI 검사 이력이 없는 계정에서도 목록이 정상 표시된다(추천 뱃지 없이, 에러 아님) (`PromotionListPage.test.tsx`: 전부 `recommended:false`인 케이스에서 정상 렌더 및 "추천" 뱃지 미노출 확인)
  - [x] (v1.7, v1.9로 대체) 목록을 상태 기준으로 필터링할 수 있다 — 최초 "전체" 및 16개 MBTI 유형 버튼(v1.7)으로 구현했으나, "인기 프로모션 TOP3"가 이미 본인 MBTI로 개인화되어 있어 목록 필터와 기능이 중복 판단, v1.9에서 "전체"/"신규"/"마감임박"/"상시" 4개 상태 버튼으로 교체(기본값 "전체", `filterByStatus` 순수 함수). `PromotionListPage.test.tsx`: 4개 버튼 렌더, 각 상태 클릭 시 필터링, "전체" 복귀, 0건 시 안내 문구 포함. Playwright로 실제 관리자 계정에서 "마감임박" 클릭 시 해당 3건만 남고 TOP3는 그대로인 것을 확인
  - [x] (v1.8 추가) "인기 프로모션 TOP3"는 완료된 결과가 있으면 본인 MBTI 유형에 매핑된 프로모션 내에서만 집계하고(결과 없으면 전체 기준), 목록 필터를 다른 값으로 바꿔도 TOP3는 본인 유형 기준을 그대로 유지한다 (`PromotionListPage.tsx`: TOP3는 목록 필터 상태가 아닌 `latestResult`에서 직접 도출한 `ownTypeCode`로 계산. `PromotionListPage.test.tsx`에 본인 유형 스코핑+필터 변경에도 불변 케이스 추가. Playwright로 실제 ESTJ 판정 계정에서 TOP3가 ESTJ 매핑 프로모션 1건만 표시되고 "전체" 데이터 대비 축소됨을 확인, 테스트 계정 정리함)
  - [x] (v1.9, v1.10에서 "마감"/"상시" 제거) "인기 프로모션 TOP3"에 포함된 프로모션은 목록에서도 "인기" 뱃지가 표시된다 (`PromotionListPage.tsx`가 TOP3와 동일한 id 집합을 `isPopular` prop으로 전달. `PromotionCard.test.tsx`/`PromotionListPage.test.tsx`에 케이스 추가)
  - [x] (v1.10 추가) "인기 프로모션 TOP3" 각 카드에 순위 뱃지("1위"/"2위"/"3위")가 표시된다 (`PromotionCard.tsx`에 `rank` prop 추가, `PromotionListPage.tsx`가 TOP3 순회 시 `index + 1`을 전달. `PromotionCard.test.tsx`/`PromotionListPage.test.tsx`에 케이스 추가. Playwright로 실제 데이터에서 1위/2위/3위 렌더 확인)
  - **테스트**: `promotionBadges.test.ts`(뱃지·정렬·인기 TOP3·상태 필터 순수 함수), `promotionApi.test.ts`, `bookmarkApi.test.ts`, `PromotionCard.test.tsx`, `PromotionListPage.test.tsx` — 전체 138 tests 통과, 대상 파일(`promotionBadges.ts`/`PromotionCard.tsx` 100%) 목표 90% 충족

### FE-8. 마이페이지 확장: 참여 이력 및 북마크 목록 (v1.6 신규)
- **선행 Task**: FE-4, FE-7(`PromotionCard` 재사용), BE-9
- **작업**: `MyPage`에 참여 이력 전체 섹션(`useMyHistory`)과 북마크 목록 섹션(`useBookmarks` 재사용) 추가 (`7-wireframe.md` 5절)
- **완료 조건**
  - [x] 완료된 참여 이력 전체가 최신순으로 표시된다(이력 없으면 빈 상태 안내, 기존 FE-4 패턴 재사용) (`MyPage.test.tsx`: 2건 이력을 `submitted_at` 내림차순으로 표시하는지 `<li>` 순서로 확인)
  - [x] 북마크한 프로모션 목록이 표시되고, 마감임박 뱃지가 함께 노출된다(`PromotionCard` 재사용) (`MyPage.test.tsx`: 마감 2일 전 북마크 프로모션이 "마감임박(D-n)" 뱃지와 함께 렌더됨을 확인)
  - [x] 참여 이력이나 북마크가 0건이어도 화면이 깨지지 않는다(빈 상태 안내, 에러 아님) (각각 "참여 이력이 없습니다."/"북마크한 프로모션이 없습니다." 안내 확인, 에러 텍스트와 별도 분기)
  - [x] 기존 FE-4의 "최근 결과" 표시와 "다시 하기" 동작이 회귀 없이 그대로 유지된다 (기존 4개 테스트 케이스 수정 없이 그대로 통과)
  - **테스트**: `MyPage.test.tsx`에 참여 이력/북마크 섹션 케이스(0건·에러 포함) 추가, `testSubmissionApi.test.ts`에 `getMyHistory` 케이스 추가 — 전체 115 tests 통과, `MyPage.tsx` 90% — 목표 90% 충족

### FE-9. 관리자 프로모션 관리 화면 (v1.6 신규)
- **선행 Task**: FE-5, BE-7, BE-10(행별 매칭수·북마크수 표시에 `by_promotion` 필요)
- **작업**: `AdminPromotionManagePage`, `useAdminPromotions` 훅 (`7-wireframe.md` 8절 + `10-style.md` 4절). 라우터에 `/admin/promotions`를 `ProtectedRoute requiredRole="ADMIN"` 하위로 추가.
- **완료 조건**
  - [x] 등록된 프로모션 목록이 표시되고, 각 행에 추천 매칭 수·북마크 수가 함께 표시된다 (`GET /api/admin/stats`의 `by_promotion`과 프로모션 목록을 조합) (`AdminPromotionManagePage.test.tsx`: `usePromotions`+`useAdminStats`를 `id` 기준으로 조합해 행별 매칭수/북마크수 렌더 확인)
  - [x] 신규 등록/수정 폼에서 대상 MBTI 유형을 1개 이상 선택하지 않으면 저장이 차단된다 (클라이언트 검증 + 서버 400 응답 메시지 표시 둘 다) (클라이언트: 0개 선택 시 저장 클릭해도 `create.mutate` 미호출+오류문구 표시 확인, 서버: `onError` 콜백에 `ApiError`를 주입해 서버 400 메시지도 동일하게 표시됨을 확인)
  - [x] 등록/수정/삭제 후 목록이 즉시 갱신된다 (`invalidateQueries`로 프로모션 목록·통계 캐시 무효화 — FE-4와 달리 같은 화면에 머무르므로 자동 refetch가 일어나지 않는 점에 주의) (`useAdminPromotions`의 create/update/remove 모두 성공 시 `['promotions']`+`['admin-stats']` invalidate하도록 구현)
  - [x] `role=USER` 계정으로 접근 시 화면에 진입하지 못한다 (라우터에서 `/admin/promotions`를 `ProtectedRoute requiredRole="ADMIN"` 하위로 등록, 기존 `ProtectedRoute` 로직 그대로 재사용 — FE-5/FE-1부터 검증된 리다이렉트 동작과 동일)
  - **테스트**: `AdminPromotionManagePage.test.tsx`(목록 렌더/유형 미선택 저장 차단/서버 오류 표시/등록·수정·삭제 후 mutate 호출) — 전체 115 tests 통과, `AdminPromotionManagePage.tsx` 96.42% — 목표 90% 충족

### FE-10. 프로모션 신청 UI (v1.10 신규, 서비스 활용성 강화)
- **선행 Task**: FE-7, FE-9, BE-11
- **작업**: `applicationApi.ts`/`useApplications.ts`(bookmark 훅 패턴 그대로 미러링), `PromotionCard.tsx`에 `onToggleApplication` prop 및 "신청하기"/"신청완료" 버튼 추가(북마크 버튼 옆). `PromotionListPage.tsx`/`MyPage.tsx`가 `useToggleApplication`을 연결. `AdminPromotionManagePage.tsx`에 "신청" 컬럼 추가 — `<details>`/`<summary>`(네이티브 HTML, 별도 모달 라이브러리 도입 안 함)로 펼치면 `useApplicants`(신규 훅)가 그 프로모션의 신청자 email/신청일시 목록을 지연 조회(펼치기 전에는 요청 안 함).
- **완료 조건**
  - [x] 프로모션 카드에 "신청하기"/"신청완료" 버튼이 `is_applied` 값에 따라 토글되어 표시된다 (`PromotionCard.test.tsx`)
  - [x] 신청 버튼 클릭 시 `useToggleApplication`이 프로모션 id/현재 상태와 함께 호출되고, TOP3·프로모션 목록·마이페이지 북마크 목록 어디서든 동일하게 동작한다 (`PromotionListPage.test.tsx`)
  - [x] 관리자 화면 프로모션 행에 신청 수가 표시되고, 클릭해 펼치면 신청자 email 목록이 지연 조회되어 표시된다(신청자 0명이면 안내 문구) (`AdminPromotionManagePage.test.tsx`)
  - **테스트**: `applicationApi.test.ts`(신규), `PromotionCard.test.tsx`/`PromotionListPage.test.tsx`/`AdminPromotionManagePage.test.tsx`에 케이스 추가 — 전체 151 tests 통과, `applicationApi.ts`/`PromotionCard.tsx` 100%, `PromotionListPage.tsx` 91.66%, `AdminPromotionManagePage.tsx` 96.72% — 목표 90% 충족(`useApplications.ts`/`useAdminPromotions.ts`의 `useApplicants`는 기존 `useBookmarks.ts`와 동일하게 소비 페이지 테스트에서 모킹되어 실행되므로 커버리지 도구상 0%로 집계됨 — 기존 훅 계층과 동일한 패턴)

---

## 일정 배치 (1차 MVP: 3일 기준)

| 일차 | Task |
|---|---|
| 1일차 | DB-1 → DB-2 → DB-3 → BE-1 → BE-2 → FE-1 |
| 2일차 | BE-3 → BE-4 → BE-5 → FE-2 → FE-3 → FE-4 |
| 3일차 | BE-6 → FE-5 → FE-6 |

우선순위는 PRD 7절에 따라 FR-1(BE-3~5, FE-3~4) > FR-2(BE-6, FE-5) > 반응형 마무리(FE-6). 일정이 밀리면 FE-6의 반응형 다듬기를 최소한으로 줄인다.

## 2차 확장 일정 (v1.6, 지속 재방문 강화 — FR-3/FR-4)

1차 MVP(FE-6까지) 완료 후 별도로 진행. **DB-4(스키마 마이그레이션)가 BE-7~8·FE-7~9 전체의 선행 조건**이므로 가장 먼저 처리한다.

| 순서 | Task | 비고 |
|---|---|---|
| 1 | **DB-4** (프로모션 확장 컬럼 + 북마크 테이블 + 시드 날짜 보정) | 이후 모든 태스크의 선행 |
| 2 | BE-7 (프로모션 조회/CRUD) | `PromotionOfferListItem` 전체 필드 구현 포함 |
| 3 | BE-8 (북마크) | BE-7이 만든 북마크 필드의 값 검증 |
| 4 | BE-10 (통계 `by_promotion` 확장) | FE-9의 선행 |
| 5 | FE-7 (프로모션 목록) → FE-8 (마이페이지 확장) → FE-9 (관리자 프로모션 관리) | |

**병행 가능**: BE-9(참여 이력 조회)는 선행이 BE-5뿐이라 DB-4와 무관하게 언제든 처리할 수 있다 — 위 순서에 얽매이지 않고 먼저 끝내두면 FE-8의 병목이 사라진다.

우선순위는 PRD 7절에 따라 FR-3(DB-4, BE-7~9, FE-7~8) > FR-4(BE-7의 CRUD 부분, BE-10, FE-9).

## 변경 이력

| 버전 | 날짜/시간 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-08-13 | 초안 작성 |
| v1.1 | 2026-08-13 | swagger.json 정합성 검토 반영: BE-5 작업 설명에 FK 조인 방식 명시 |
| v1.2 | 2026-08-13 | DB-1~DB-3 수행 결과 반영: 체크박스 갱신, 전용 DB 미생성 및 관리자 계정 미시드 상태 명시 |
| v1.3 | 2026-08-13 | 관리자 계정 1건 시드 완료 반영 (`003_seed_admin.sql`), DB-3 체크박스 갱신 |
| v1.4 | 2026-08-13 | docs 전체 재검토: BE-1 완료조건의 환경변수명을 실제 `.env`와 동일한 `DB_CONN_STRING`으로 수정 |
| v1.5 | 2026-08-13 | DB-1: 전용 DB 미생성 항목을 "기본 postgres DB 사용 확정"으로 변경, DB-1 전체 완료 |
| v1.6 | 2026-08-13 | BE-1 완료: app.js/server.js/pool.js/errorHandler.js/package.json/.env.example 구현, Jest+Supertest 테스트 5건 통과(핵심 파일 커버리지 100%), 체크박스 전체 반영 |
| v1.7 | 2026-08-15 | BE-2 완료: auth 라우트/컨트롤러/서비스/user.db.js, requireAuth/requireAdmin 미들웨어 구현, 테스트 21건 통과(커버리지 98.26%), 체크박스 전체 반영 |
| v1.8 | 2026-08-15 | BE-3 완료: mbtiQuestion 라우트/컨트롤러/서비스/db.js 구현, 테스트 26건 통과(커버리지 97.14%), 체크박스 전체 반영 |
| v1.9 | 2026-08-15 | BE-4 완료: mbtiJudge.service.js(판정 로직), testSubmission 라우트/컨트롤러/서비스/db.js, mbtiResultType.db.js, promotionOffer.db.js 구현, 테스트 33건 통과(커버리지 97.08%), 체크박스 전체 반영 |
| v1.10 | 2026-08-15 | BE-5 완료: testSubmission.db/service/controller/routes에 findLatestByUserId/getLatestForUser/getLatest/GET me/latest 추가(buildResultDetail 재사용), 테스트 38건 통과(커버리지 97.23%), 체크박스 전체 반영 |
| v1.11 | 2026-08-15 | BE-6 완료: adminStats.db/service.js(순수 computeStats 함수), admin.controller/routes.js(requireAuth+requireAdmin 체이닝) 구현, 테스트 43건 통과(커버리지 97.22%), 체크박스 전체 반영 |
| v1.12 | 2026-08-20 | FE-1 완료: Vite+React19+TS 스캐폴딩, react-router-dom/zustand/@tanstack/react-query 도입, api/client.ts·authStore.ts·ProtectedRoute.tsx·router.tsx·6개 페이지 placeholder 구현, Vitest+RTL 테스트 11건 통과(커버리지 93.02%), 체크박스 전체 반영 |
| v1.13 | 2026-08-20 | FE-2 완료: authApi.ts(signup/login), LoginPage/SignupPage 구현(useMutation 연동, 오류 메시지 표시), 실제 브라우저(Playwright)로 회원가입→로그인→보호페이지 진입/새로고침 유지/오류 메시지 확인, 테스트 23건 통과(커버리지 95.45%), 체크박스 전체 반영 |
| v1.14 | 2026-08-20 | FE-3 완료: testApi.ts(getMbtiQuestions/submitTest), useMbtiTest.ts 훅, QuestionCard 컴포넌트, MbtiTestPage 구현(12문항 전체 렌더, 진행률, 제출 버튼 활성화 조건, 제출 성공 시 /result 이동), 실제 브라우저(Playwright)로 골든패스 확인, 테스트 34건 통과(커버리지 94.95%), 체크박스 전체 반영 |
| v1.15 | 2026-08-20 | FE-4 완료: testSubmissionApi.ts(getMyLatestResult, 404를 null로 처리), useMyLatestResult 훅, ResultSummary 공용 컴포넌트, ResultPage(state 우선+폴백 조회)/MyPage(로딩/빈상태/데이터 3분기) 구현, 실제 브라우저(Playwright)로 결과표시/마이페이지조회/재참여갱신/빈상태 4개 완료조건 전부 확인, 테스트 50건 통과(커버리지 94.96%), 체크박스 전체 반영 |
| v1.16 | 2026-08-20 | FE-5 완료: domain.ts에 AdminStats 등 타입 추가, adminApi.ts(getAdminStats), useAdminStats 훅, StatsChart(순수 CSS 막대, 신규 차트 라이브러리 미도입), AdminStatsPage 구현, 실제 관리자 계정으로 통계 표시/일반사용자 접근차단/0건 방어 3개 완료조건 전부 브라우저 확인, 테스트 56건 통과(커버리지 94.83%), 체크박스 전체 반영 |
| v1.17 | 2026-08-20 | FE-6 완료: index.css에 전역 box-sizing, 관리자 통계 페이지 반응형 스타일(768px 브레이크포인트) 추가, 완료조건 4번 문구를 실제 도구(oxlint)에 맞게 수정, Playwright로 모바일/데스크탑 반응형 및 4-user-scenario.md 시나리오 1~6 전체 검증, 체크박스 전체 반영. 프론트엔드 실행계획(FE-1~FE-6) 전체 완료 |
| v1.18 | 2026-08-20 | 지속 재방문 강화 기획(v1.6 도메인 정의서, FR-3/FR-4) 반영: Task 의존 관계 다이어그램에 BE-7~9/FE-7~9 추가, BE-7(프로모션 조회/CRUD)·BE-8(북마크)·BE-9(참여이력·통계 확장)·FE-7(프로모션 목록)·FE-8(마이페이지 확장)·FE-9(관리자 프로모션 관리) 신규 Task 추가, 2차 확장 일정 섹션 신설 |
| v1.19 | 2026-08-20 | 개발 착수 전 실측 기반 정합성 점검 반영: ①DB 마이그레이션을 BE-7에서 분리해 **DB-4** 신규 태스크로 독립(기존 시드 16건 날짜 보정 조건 포함 — 실제 DB에 프로모션 16건/컬럼 미추가 상태 확인), ②DB-2에 `8-schema.sql`(전체 스냅샷) ↔ `00N_*.sql`(증분 이력) 정합성 규칙 명시, ③기존 BE-9를 **BE-9**(참여 이력 조회, 선행 BE-5)와 **BE-10**(통계 `by_promotion` 확장, 선행 BE-6·BE-8)으로 분할해 불필요한 의존 제거, ④BE-7/BE-8 사이 `bookmark_count`/`is_bookmarked` 구현 책임과 인기 TOP3 정렬 주체(프론트) 명시, ⑤FE-7~9에 테스트 항목·커버리지 90% 목표 추가, ⑥서두 일정 문구를 1차/2차로 분리 |
| v1.20 | 2026-08-20 | DB-4 완료: `004_add_promotion_bookmark.sql` 작성·실행 — `promotion_offers`에 `created_at`/`ends_at` 추가, `bookmarks` 테이블(복합 PK) 및 인덱스 생성, 기존 프로모션 16건을 신규 3건/마감임박 3건/상시 10건으로 날짜 보정. PK 위반 실측 확인, `8-schema.sql` 스냅샷과 실제 DB 일치 확인. 체크박스 전체 반영 |
| v1.21 | 2026-08-20 | BE-7 완료: `promotionOffer.db.js`에 목록/단건 조회(서브쿼리 기반 `mbti_type_codes`/`bookmark_count`/`is_bookmarked`)·등록·수정·삭제(트랜잭션) 함수 추가, `promotionOffer.service.js`(추천 판정·정렬 순수 함수 `annotateAndSort`, 유형 검증 `validateMbtiTypeCodes`), `promotionOffer.controller/routes.js` 신규, `app.js`에 `/api/promotion-offers` 등록. 테스트 62건 통과(신규 파일 `service.js`/`routes.js` 100%, `controller.js` 95%, `db.js` 88.23%), 체크박스 전체 반영 |
| v1.22 | 2026-08-20 | BE-8 완료: `bookmark.db.js`(`ON CONFLICT DO NOTHING` 멱등 등록/해제), `bookmark.service.js`(존재 검증 후 등록, `promotionOffer.service.listForUser` 재사용해 `is_bookmarked`만 필터링해 목록 구성), `bookmark.controller/routes.js` 신규, `app.js`에 `/api/bookmarks` 등록. 테스트 71건 통과(신규 파일 `db.js`/`service.js`/`routes.js` 100%, `controller.js` 85.71%), 체크박스 전체 반영 |
| v1.23 | 2026-08-20 | BE-9·BE-10 완료: (BE-9) `testSubmission.db.js`에 `findAllByUserId` 추가, `testSubmission.service.js`에 `getAllForUser`(BE-4의 `buildResultDetail` 재사용) 추가, `GET /api/test-submissions/me` 라우트 등록(`/me/latest`와 상호 간섭 없음 실측). (BE-10) `adminStats.db.js`에 `getPromotionStats`(프로모션별 추천 매칭 수·북마크 수 서브쿼리) 추가, `computeStats`에 `by_promotion` 파라미터·응답 필드 확장(기존 `by_result_type`/`by_indicator` 로직 미변경). 테스트 77건 통과(`testSubmission.db/service.js`, `adminStats.db/service.js` 모두 100%), 체크박스 전체 반영 |
| v1.24 | 2026-08-20 | FE-7·FE-8·FE-9 완료: 뱃지/정렬/인기 TOP3 판정을 `utils/promotionBadges.ts` 순수 함수로 분리(`isNew`/`isEndingSoon`/`daysUntil`/`sortByRecommendedThenDate`/`pickTopByBookmarks`), `promotionApi.ts`/`bookmarkApi.ts`/`testSubmissionApi.getMyHistory` 및 대응 훅(`usePromotions`/`useBookmarks`+`useToggleBookmark`/`useMyHistory`/`useAdminPromotions`) 신규, `PromotionCard`/`PromotionListPage`(FE-7) 신규, `MyPage`에 참여 이력·북마크 섹션 확장(FE-8), `AdminPromotionManagePage`(목록+등록/수정/삭제 폼, FE-9) 신규. `ProtectedRoute`에 공용 네비게이션(`/promotions`, `/mypage`, role=ADMIN 시 `/admin/*`) 추가해 진입점 확보, `router.tsx`에 `/promotions`·`/admin/promotions` 등록. `AdminStats`/`PromotionOfferListItem` 등 타입 추가. 테스트 115건 통과(신규/확장 파일 대부분 90%대 이상: `promotionBadges.ts` 100%, `PromotionCard.tsx` 100%, `PromotionListPage.tsx` 92.3%, `AdminPromotionManagePage.tsx` 96.42%, `MyPage.tsx` 90%), oxlint 0건·`tsc -b`·`vite build` 모두 성공, 체크박스 전체 반영. 이어서 Playwright로 회원가입→북마크 토글→마이페이지→관리자 CRUD 골든패스를 실제 브라우저에서 재검증(4개 항목 모두 통과, feature 코드 관련 콘솔 에러 없음) |
| v1.25 | 2026-08-20 | FE-2 로그인 목적지 분기 추가(사용자 요청, 재방문 동기 강화): `LoginPage.tsx`가 로그인 성공 후 `getMyLatestResult()`로 완료 이력을 확인해 있으면 `/promotions`, 없으면 `/`로 이동(조회 실패 시 `/`로 안전 폴백). `docs/4-user-scenario.md` 시나리오 2에 반영. `LoginPage.test.tsx`에 분기 2건+폴백 1건 추가, 전체 20 suites 117 tests 통과, Playwright로 신규 계정→`/`·MBTI 완료 후 재로그인→`/promotions` 양쪽 경로 실제 확인(테스트 데이터 정리 완료) |
| v1.26 | 2026-08-20 | FE-7 PromotionListPage에 "전체/MBTI 유형별" 필터 버튼 추가(사용자 요청, TOP3는 그대로 유지하기로 결정): `promotionBadges.ts`에 `filterByMbtiType`/`ALL_MBTI_FILTER` 순수 함수 추가, 완료된 결과 보유 시 자신의 유형이 기본 선택되도록 `useMyLatestResult` 연동, 필터 결과 0건 시 안내 문구 추가. `docs/1-domain-definition.md`(v1.7, UC-3 5단계·프로모션 유형 필터 규칙), `7-wireframe.md`(v1.3), `10-style.md`(v1.3) 함께 갱신. 전체 127 tests 통과, `promotionBadges.ts` 100%·`PromotionListPage.tsx` 94.73%, Playwright로 실제 필터 클릭→목록 필터링·TOP3 불변 확인 |
| v1.27 | 2026-08-20 | 사용자 요청(TOP3 두 줄로 보이는 문제, 필터 버튼 줄바꿈 문제) 반영: TOP3 래퍼를 flex에서 `.promotion-top3-grid`(768px+ 3열 고정 grid)로 교체 — 기존엔 `.promotion-rank-card`에 flex-basis가 없어 내용 길이에 따라 불균등하게 2개씩 묶여 보이는 버그였음. 필터 바(`.promotion-filter-bar`)는 `flex-wrap: nowrap` + `overflow-x: auto`로 변경해 항상 한 줄을 유지하고 넘치면 그 줄만 가로 스크롤. `docs/7-wireframe.md`(v1.4), `10-style.md`(v1.4) 갱신. 기존 127 tests 그대로 통과(테스트는 DOM 구조 기준이라 CSS 변경 영향 없음), Playwright로 1400px/1280px에서 TOP3 3카드 동일 y좌표·필터 버튼 17개 동일 y좌표(스크롤 없이 한 줄에 들어감) 확인, 375px 모바일에서도 페이지 가로 스크롤 없이 필터 바만 내부 스크롤됨을 확인 |
| v1.28 | 2026-08-20 | docs 정합성 감사(2-usecase/3-PRD/5-project-principle/6-arch-diagram/swagger.json/8-erd.md) 반영: UC-3 요약에 유형 필터 언급 추가, FR-1에 로그인 목적지 분기·FR-3에 유형 필터 문구 추가, 5절 훅 목록을 실제 파일(`useMbtiTest.ts`)에 맞게 정정하고 `utils/`·`constants/` 디렉토리 추가, 6절 다이어그램에 `useToggleBookmark`·`LoginPage→useMyLatestResult` 엣지 추가. swagger.json/8-erd.md는 감사 결과 이미 정합하여 수정 없음 |
| v1.29 | 2026-08-20 | 사용자 요청 2건 반영: ①`PromotionCard.tsx`에 매핑된 MBTI 유형 뱃지 추가("신규" 뱃지와 동일한 위치), ②`.promotion-grid`(프로모션 목록)를 flex에서 CSS grid(`auto-fill`, minmax 260px)로 전환해 마지막 줄에 카드가 1개만 남아도 전체 폭으로 늘어나지 않고 다른 카드와 동일한 1칸만 차지하도록 수정. 대화 중 추가 요청으로 ③"인기 프로모션 TOP3"를 본인 MBTI 유형 기준으로 개인화(완료 결과 있으면 해당 유형 내에서만 집계, 목록 필터 버튼 변경과는 무관하게 유지)도 함께 반영. `docs/1-domain-definition.md`(v1.8), `3-PRD.md`(v1.7), `7-wireframe.md`(v1.5), `10-style.md`(v1.5) 갱신. 전체 130 tests 통과, `promotionBadges.ts` 100%·`PromotionCard.tsx` 100%·`PromotionListPage.tsx` 95%. Playwright로 실제 ESTJ 판정 계정에서 TOP3/목록 모두 ESTJ 뱃지 프로모션만 남는 것과 마지막 줄 단독 카드가 그리드 1칸(309px, 960px 3열 중 1칸)만 차지함을 확인, 테스트 계정 정리함 |
| v1.30 | 2026-08-21 | 사용자 요청 반영: "프로모션 목록" 필터를 16개 MBTI 유형별(v1.7)에서 "전체/신규/마감임박/상시" 4개 상태 버튼으로 교체(TOP3가 이미 MBTI로 개인화되어 있어 목록 필터와 기능 중복 판단, `filterByStatus` 순수 함수 신규, 기존 `filterByMbtiType`은 TOP3 개인화 계산에 계속 사용). 뱃지 3종 추가: "마감"(만료, `isEnded`, 도메인 정의서에 이미 문서화됐던 미구현 규칙을 채움)·"상시"(마감일 없음, `isAlwaysOpen`)·"인기"(TOP3 포함 항목, 목록 필터와 무관하게 항상 본인 유형 기준의 TOP3 id로 계산). `docs/1-domain-definition.md`(v1.9), `3-PRD.md`(v1.8), `7-wireframe.md`(v1.6), `10-style.md`(v1.6) 갱신. 전체 146 tests 통과, `promotionBadges.ts` 100%·`PromotionCard.tsx` 100%·`PromotionListPage.tsx` 95.23%. Playwright로 실제 DB 프로모션 1건의 마감일을 임시로 과거로 변경해 "마감" 뱃지 렌더 확인 후 원복, 상태 필터 4개 버튼 동작과 TOP3 불변 확인 |
| v1.31 | 2026-08-21 | 사용자 요청 반영(v1.30 일부 롤백): 인기 프로모션 TOP3 각 카드에 순위 뱃지("1위"/"2위"/"3위") 추가(`PromotionCard.tsx`에 `rank` prop, `PromotionListPage.tsx`가 `index+1` 전달). "마감"/"상시" 뱃지(`isEnded`/`isAlwaysOpen`)와 "상시" 상태 필터 버튼 제거 — 사장님이 직접 등록·관리하는 정보라 마감 여부를 별도 표시할 실익이 낮다는 판단(상태 필터는 "전체"/"신규"/"마감임박" 3개로 축소). `docs/1-domain-definition.md`(v1.10), `3-PRD.md`(v1.9), `7-wireframe.md`(v1.7), `10-style.md`(v1.7) 갱신. 전체 138 tests 통과, `promotionBadges.ts`/`PromotionCard.tsx` 100%·`PromotionListPage.tsx` 95.23%, `tsc -b`·`oxlint` 통과. Playwright로 실제 데이터에서 TOP3 순위 뱃지(1위/2위/3위) 및 목록의 마감임박/신규/인기 뱃지 정상 표시, 마감/상시 뱃지 미노출 확인 |
| v1.32 | 2026-08-21 | 사용자 요청 반영(서비스 활용성 강화): BE-11(프로모션 신청 API)·FE-10(신청 UI) 신규 Task 추가·완료. DB-5(`005_add_promotion_applications.sql`, bookmarks와 동일 구조의 `promotion_applications` 테이블) 신설, `POST/DELETE /api/applications`(멱등 토글)·관리자 전용 `GET /api/promotion-offers/:id/applicants`(email+applied_at) 추가, `promotion_offers` 목록 응답에 `application_count`/`is_applied` 추가. 프론트 `PromotionCard`에 "신청하기"/"신청완료" 버튼, `AdminPromotionManagePage`에 신청 수+`<details>` 기반 신청자 목록(지연 조회) 추가. 별도 연락처 입력 폼 없이 계정 email을 재사용해 관리자가 직접 연락하는 흐름 — 북마크(관심 표시)만 있던 "표시 전용" 구조를 관리자가 실제로 연락해 진행할 수 있는 액션으로 보강. `docs/1-domain-definition.md`(v1.11), `3-PRD.md`(v1.10), `8-erd.md`(v1.2), `8-schema.sql`, `swagger.json` 갱신. 백엔드 전체 14 suites 86 tests 통과(신규 파일 100%·컨트롤러 90%), 프론트 전체 21 files 151 tests 통과(`applicationApi.ts`/`PromotionCard.tsx` 100%), `tsc -b`·`oxlint` 통과 |

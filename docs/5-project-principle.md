# 사장님 MBTI 프로젝트 구조 설계 원칙

> 참고 문서: [`docs/1-domain-definition.md`](./1-domain-definition.md) (도메인 정의서 v1.6), [`docs/2-usecase.md`](./2-usecase.md) (유스케이스 다이어그램), [`docs/3-PRD.md`](./3-PRD.md) (PRD v1.5), [`docs/4-user-scenario.md`](./4-user-scenario.md) (사용자 시나리오)

본 문서는 위 문서들(엔티티 6개: User, MbtiQuestion, MbtiResultType, PromotionOffer, TestSubmission, Bookmark / 기능 4개: FR-1~FR-4)을 기반으로, **교육용 MVP·1인 개발**이라는 제약에 맞는 프로젝트 구조와 코딩 원칙을 정의한다. 대규모 상용 서비스용 클린 아키텍처/DDD/마이크로서비스 패턴은 채택하지 않는다.

## 1. 모든 스택에 공통인 최상위 원칙

- **오버엔지니어링 금지(YAGNI)**: 엔티티 6개, 기능 4개짜리 서비스에 레이어를 더 쪼개거나 확장성을 미리 설계하지 않는다. "나중에 필요할 수도 있는 구조"가 아니라 "지금 필요한 구조"만 만든다.
- **단순성 우선**: 같은 문제를 푸는 방법이 여러 개면 가장 적은 코드/파일로 끝나는 쪽을 택한다. 1인 개발이라 팀 컨벤션 충돌은 없지만, 그만큼 스스로 일관성을 지키지 않으면 시간을 낭비하기 쉽다.
- **도메인 용어 일관성**: 코드, DB, API, 문서 어디서든 도메인 정의서의 엔티티명(User, MbtiQuestion, MbtiResultType, PromotionOffer, TestSubmission, Bookmark)과 지표명(E/I, S/N, T/F, J/P)을 그대로 사용한다. 이름을 새로 짓지 않으면 문서-코드 간 매핑을 매번 다시 생각할 필요가 없다.
- **우선순위**: PRD 7절 우선순위(FR-1 → FR-2 → 반응형 다듬기 → FR-3 → FR-4) 그대로 구조에도 반영한다. 공통 모듈(인증, DB 연결)부터 만들고, 각 기능은 서로 거의 겹치지 않으므로 독립적으로 얇게 쌓는다.
- **표시 전용 참조 데이터는 단순 조회로 취급**: MbtiResultType은 쓰기 로직이 없는 순수 참조 데이터이므로 조회 전용 코드로만 구현한다. **PromotionOffer는 v1.6부터 관리자 CRUD 대상**이므로 이 원칙에서 제외한다(FR-4, 6절 참조) — 다만 CRUD라 해도 리소스가 1개뿐이므로 범용 admin 리소스 프레임워크(제네릭 CRUD 컨트롤러 등)는 만들지 않고, 다른 리소스와 동일하게 route→controller→service→db 그대로 얇게 구현한다.

## 2. 의존성/레이어 원칙

1인 개발·3일 일정에서는 레이어를 많이 두는 것 자체가 리스크(레이어 간 매핑 코드만 늘어남)이므로, 딱 "역할이 섞이면 안 되는 최소 단위"로만 나눈다.

### 프론트엔드
```
페이지(Route) → 컴포넌트 → (Zustand 스토어 | TanStack Query 훅) → API 클라이언트 → 백엔드
```
- 페이지/컴포넌트는 화면만 그린다. 서버 상태(질문 목록, 결과, 통계 등)는 TanStack Query, 클라이언트 전역 상태(로그인 여부, Access Token)는 Zustand로 분리한다. 둘을 섞어 쓰지 않는다 — 섞으면 캐시 무효화 타이밍 버그가 생기기 쉽고, 이걸 디버깅할 시간이 3일 일정엔 없다.
- 컴포넌트가 API 클라이언트(axios/fetch)를 직접 호출하지 않는다. 항상 TanStack Query 훅을 통해서만 호출한다 → 나중에 API 응답 구조가 바뀌어도 훅 한 곳만 고치면 됨.

### 백엔드
```
route → controller → service → db(pg 쿼리)
```
- route: URL/HTTP 메서드 정의 + 인증 미들웨어 부착만 담당.
- controller: req/res 파싱, service 호출, 응답 포맷팅만 담당(비즈니스 로직 없음).
- service: MBTI 판정 로직, 통계 집계 로직 등 실제 비즈니스 규칙.
- db: pg 쿼리 실행 함수 모음. SQL은 여기에만 존재.
- 의존 방향은 항상 위→아래 한 방향이며, service가 controller를, db가 service를 참조하지 않는다. repository 인터페이스나 DI 컨테이너는 두지 않는다(구현체가 1개뿐이므로 추상화 비용만 늘어남).

## 3. 코드/네이밍 원칙

- **엔티티명은 도메인 정의서와 동일하게**: 파일명·클래스명·API 응답 키 모두 `User`, `MbtiQuestion`, `MbtiResultType`, `PromotionOffer`, `TestSubmission`, `Bookmark`를 그대로 사용(축약/의역 금지). 예: `testSubmissionService.js`, `mbtiResultTypeRepo` 대신 `mbtiResultType.db.js`.
- **DB 테이블/컬럼**: 테이블명은 엔티티명의 snake_case 복수형(`users`, `mbti_questions`, `mbti_result_types`, `promotion_offers`, `test_submissions`, `bookmarks`). 컬럼명은 snake_case (`user_id`, `mbti_result_type_code`, `created_at`, `ends_at`). PRD/도메인 정의서에 등장하는 속성명(예: `role`)을 그대로 컬럼명으로 사용해 매핑 고민을 없애며, FK는 참조 대상의 PK 컬럼명에 맞춰 명명한다(`mbti_result_types.type_code` → `test_submissions.mbti_result_type_code`, `docs/8-erd.md` 참조).
- **JS/TS 변수·함수**: camelCase. DB 로우(snake_case) ↔ JS 객체(camelCase) 변환은 매핑 라이브러리 없이 db 계층 함수 안에서 필요한 필드만 그때그때 변환한다(전역 자동 변환기 도입 금지, 엔티티 6개뿐이라 이득이 없음).
- **파일명**: 프론트엔드는 컴포넌트 `PascalCase.tsx`, 훅/유틸은 `camelCase.ts`. 백엔드는 전부 `camelCase.js` (또는 `.controller.js`/`.service.js`/`.db.js` 접미사로 레이어 구분).
- **라우트 경로**: REST 리소스명은 엔티티의 kebab-case 복수형과 일치 (`/api/test-submissions`, `/api/promotion-offers`, `/api/bookmarks`).

## 4. 테스트/품질 원칙

3일·1인 일정에서 테스트 피라미드(유닛/통합/E2E 전 층위)를 요구하는 것 자체가 오버엔지니어링이다. 핵심 로직만 최소한으로 검증한다.

- **꼭 테스트할 것**: MBTI 판정 로직(4개 지표 계산 → 16유형 결정)과 관리자 통계 집계 로직. 이 둘은 버그가 나면 결과 화면/통계 화면이 통째로 틀어지므로, 입출력 예시 기반 단위 테스트를 각각 몇 케이스만 작성한다.
- **테스트 안 해도 되는 것**: 단순 조회 컨트롤러, 화면 렌더링, 참조 데이터(MbtiResultType) 조회 API. 수동으로 한 번 눌러보는 것으로 충분하다. **PromotionOffer CRUD(v1.6)는 예외**로, 대상 MBTI 유형 검증·삭제 시 연관 데이터 정리 로직에 버그가 있으면 FR-1/FR-3 추천이 조용히 틀어지므로 서비스 계층 최소 테스트를 둔다(`docs/9-plan.md` BE-7 참조).
- **품질 검증 방식**: 자동화된 CI 파이프라인/커버리지 목표는 설정하지 않는다. 매 기능(FR-1, FR-2) 완성 시 유스케이스 시나리오(`docs/4-user-scenario.md`)의 골든 패스를 수동으로 한 번씩 따라가 보는 것을 완료 기준으로 삼는다.
- **린트/포맷터**: ESLint + Prettier 기본 설정 정도만 적용(규칙 커스터마이징에 시간 쓰지 않음).

## 5. 설정/보안/운영 원칙

- **환경변수**: `.env` 파일(gitignore 처리)로 관리. 필수 항목: `DB_CONN_STRING`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `PORT`, `FRONTEND_ORIGIN`, `NODE_ENV`. 개발용 관리자 계정 시드에 쓰인 `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`(`backend/src/migrations/003_seed_admin.sql` 참조)도 이미 `backend/.env`에 있다. `.env.example`을 함께 커밋해 실행 방법을 문서화한다(비밀값은 빈 문자열/예시로만 채움).
- **API 문서(Swagger UI)**: `NODE_ENV !== 'production'`일 때만 `/api-docs` 경로에 `docs/swagger.json` 기반 Swagger UI를 노출한다(`NODE_ENV=production`이면 라우트 자체가 등록되지 않음).
- **JWT 인증(PRD 5절 반영)**:
  - Access Token(짧은 만료)은 매 요청 `Authorization: Bearer` 헤더로 전달, 인증 미들웨어에서 검증 후 `req.user`에 `{ id, role }` 주입.
  - Refresh Token(긴 만료)은 서버 DB에 저장하지 않고 stateless로만 검증(도메인 정의서/PRD 확정 사항). 재발급 전용 엔드포인트(`POST /api/auth/refresh`) 하나만 둔다.
  - 비밀번호는 bcrypt로 해시 저장. 평문 비교/자체 해시 구현 금지.
- **역할 기반 접근 제어**: `requireAuth`, `requireAdmin` 두 개의 미들웨어만 둔다(권한 체계를 세분화하지 않음 — role은 USER/ADMIN 2종뿐).
- **CORS**: `FRONTEND_ORIGIN` 환경변수 값만 허용(개발 중엔 `http://localhost:5173`, 배포 시 프론트엔드 실제 origin으로 교체).
- **에러 핸들링**: Express 전역 에러 핸들러 1개로 통일. 컨트롤러에서 발생한 에러는 `next(err)`로 넘기고, 전역 핸들러가 `{ message, status }` 형태 JSON으로 응답. 커스텀 에러 클래스는 `AppError` 1종만 두고(에러 코드 체계 세분화 금지), HTTP status로 구분한다.
- **비밀정보 관리**: JWT 시크릿/DB 접속정보는 코드에 하드코딩하지 않고 환경변수로만 주입. 저장소에 커밋 금지.

## 6. 프론트엔드 디렉토리 구조 (React 19 + Zustand + TanStack Query)

```
frontend/
├─ src/
│  ├─ pages/                     # 라우트 단위 화면 (컴포넌트 조합만 담당)
│  │  ├─ LoginPage.tsx
│  │  ├─ SignupPage.tsx
│  │  ├─ MbtiTestPage.tsx        # FR-1: 12문항 응답 화면
│  │  ├─ ResultPage.tsx          # FR-1: 결과/장사TIP/추천 프로모션
│  │  ├─ MyPage.tsx              # FR-1: 최근 결과 / FR-3: 참여 이력 전체·북마크 목록
│  │  ├─ PromotionListPage.tsx   # FR-3: 프로모션 목록/추천정렬/인기TOP3/북마크 (v1.6)
│  │  ├─ AdminStatsPage.tsx      # FR-2: 참여 현황 통계(+프로모션별 통계)
│  │  └─ AdminPromotionManagePage.tsx  # FR-4: 프로모션 등록/수정/삭제 (v1.6)
│  ├─ components/                # 여러 페이지에서 재사용하는 UI 조각
│  │  ├─ QuestionCard.tsx
│  │  ├─ ResultSummary.tsx
│  │  ├─ StatsChart.tsx
│  │  └─ PromotionCard.tsx       # 목록/북마크 화면에서 공용으로 쓰는 프로모션 카드 (뱃지+북마크 버튼, v1.6)
│  ├─ hooks/                     # TanStack Query 훅 (서버 상태 전용)
│  │  ├─ useMbtiTest.ts          # useMbtiQuestions/useSubmitTest 훅 모음
│  │  ├─ useMyLatestResult.ts
│  │  ├─ useMyHistory.ts         # FR-3: 참여 이력 전체 조회 (v1.6)
│  │  ├─ usePromotions.ts        # FR-3: 프로모션 목록 조회 (v1.6)
│  │  ├─ useBookmarks.ts         # FR-3: 북마크 목록 조회/토글 (v1.6)
│  │  ├─ useAdminStats.ts
│  │  └─ useAdminPromotions.ts   # FR-4: 관리자 프로모션 CRUD (v1.6)
│  ├─ store/                     # Zustand 스토어 (클라이언트 상태 전용)
│  │  └─ authStore.ts            # accessToken, user role 등
│  ├─ api/                       # API 클라이언트 (fetch 래퍼, 엔드포인트 함수)
│  │  ├─ client.ts               # axios/fetch 인스턴스, 토큰 첨부, refresh 처리
│  │  ├─ authApi.ts
│  │  ├─ testSubmissionApi.ts
│  │  ├─ promotionApi.ts         # 목록 조회 + 관리자 CRUD 공용 (v1.6)
│  │  ├─ bookmarkApi.ts          # (v1.6)
│  │  └─ adminApi.ts
│  ├─ routes/                    # 라우팅 정의 + 인증/역할 가드
│  │  ├─ router.tsx
│  │  └─ ProtectedRoute.tsx      # 미로그인/권한없음 리다이렉트 (시나리오 6)
│  ├─ types/                     # 도메인 엔티티 타입 (도메인 정의서 그대로)
│  │  └─ domain.ts               # User, MbtiQuestion, MbtiResultType, PromotionOffer, TestSubmission, Bookmark
│  ├─ utils/                     # 순수 함수 (컴포넌트/훅에서 재사용, 단위 테스트 대상)
│  │  └─ promotionBadges.ts      # 신규/마감임박 판정, 추천정렬, 인기TOP3, MBTI 유형 필터 (v1.7)
│  ├─ constants/
│  │  └─ mbtiTypes.ts            # MBTI_TYPE_CODES(16개), 필터 버튼/체크박스에서 공용 사용 (v1.6)
│  └─ main.tsx
├─ index.html
└─ package.json
```
- `pages`/`components`는 화면만, `hooks`는 서버 상태만, `store`는 클라이언트 상태만, `api`는 HTTP 통신만 — 각 폴더가 2절의 레이어 원칙과 1:1 대응된다.
- 반응형 UI는 별도 breakpoint 컴포넌트를 만들지 않고 CSS(미디어쿼리 또는 Tailwind 등 기본 유틸리티)로 처리한다.

## 7. 백엔드 디렉토리 구조 (Node.js + Express + pg)

```
backend/
├─ src/
│  ├─ routes/                    # URL ↔ controller 연결 + 미들웨어 부착
│  │  ├─ auth.routes.js
│  │  ├─ mbtiQuestion.routes.js
│  │  ├─ testSubmission.routes.js   # FR-1, FR-3(참여 이력 전체 조회)
│  │  ├─ promotionOffer.routes.js   # FR-3(목록 조회, requireAuth) + FR-4(등록/수정/삭제, requireAuth+requireAdmin) (v1.6)
│  │  ├─ bookmark.routes.js         # FR-3: 북마크 등록/해제/목록 조회 (v1.6)
│  │  └─ admin.routes.js            # FR-2
│  ├─ controllers/                  # req/res 처리, service 호출
│  │  ├─ auth.controller.js
│  │  ├─ mbtiQuestion.controller.js
│  │  ├─ testSubmission.controller.js
│  │  ├─ promotionOffer.controller.js  # (v1.6)
│  │  ├─ bookmark.controller.js        # (v1.6)
│  │  └─ admin.controller.js
│  ├─ services/                     # 비즈니스 로직
│  │  ├─ auth.service.js            # JWT 발급/검증, bcrypt
│  │  ├─ mbtiQuestion.service.js    # 문항 목록 조회 (얇은 통과 계층)
│  │  ├─ mbtiJudge.service.js       # 4개 지표 판정 → 16유형 결정 (핵심 로직, 테스트 필수)
│  │  ├─ testSubmission.service.js  # 제출 저장, 완료여부 판단, 참여 이력 전체 조회
│  │  ├─ promotionOffer.service.js  # 목록 조회 시 추천 정렬(로그인 사용자 최신 유형 기준)·인기 TOP3·CRUD 검증(대상 유형 1개 이상) (v1.6)
│  │  ├─ bookmark.service.js        # 토글(멱등 처리) (v1.6)
│  │  └─ adminStats.service.js      # 참여자 수/유형별·지표별 비율 + 프로모션별 추천매칭수·북마크수 집계 (테스트 필수)
│  ├─ db/                           # pg 쿼리 (SQL은 여기에만)
│  │  ├─ pool.js                    # pg Pool 인스턴스
│  │  ├─ user.db.js
│  │  ├─ mbtiQuestion.db.js
│  │  ├─ mbtiResultType.db.js
│  │  ├─ promotionOffer.db.js       # 조회 + CRUD, mbti_result_type_promotion_offers 조인 테이블 처리도 여기서 (docs/8-erd.md 참조, v1.6부터 쓰기 포함)
│  │  ├─ bookmark.db.js             # (v1.6)
│  │  ├─ testSubmission.db.js
│  │  └─ adminStats.db.js           # 전체/유형별/지표별/프로모션별 집계 쿼리
│  ├─ middlewares/
│  │  ├─ requireAuth.js             # Access Token 검증
│  │  ├─ requireAdmin.js            # role=ADMIN 체크
│  │  └─ errorHandler.js            # 전역 에러 핸들러 (AppError는 ../errors에서 재노출)
│  ├─ errors.js                     # AppError 커스텀 에러 클래스 (서비스 계층이 미들웨어 계층을 참조하지 않도록 분리)
│  ├─ migrations/                   # DB 스키마/시드 SQL (docs/8-erd.md 기준 테이블 7개, 조인 테이블 포함)
│  │  ├─ 001_init.sql               # 테이블 6개 생성 (docs/8-schema.sql과 동일)
│  │  ├─ 002_seed.sql               # 문항 12개, 유형 16개, 프로모션 16개 참조 데이터
│  │  ├─ 003_seed_admin.sql         # 관리자 계정 1건 시드 (비밀번호는 psql 변수로 주입, backend/.env 참조)
│  │  └─ 004_add_promotion_bookmark.sql  # promotion_offers에 created_at/ends_at 추가, bookmarks 테이블 신설 (v1.6)
│  ├─ app.js                        # Express 앱 설정 (미들웨어, 라우트, /api-docs Swagger UI 등록)
│  └─ server.js                     # 서버 기동 진입점
├─ .env.example
└─ package.json
```
- 컨트롤러 1개당 라우트 파일 1개, service 1개로 1:1 대응시켜 파일을 찾기 쉽게 한다. 별도 리포지토리 인터페이스/DI 컨테이너는 두지 않는다(2절 참조).
- `mbtiJudge.service.js`, `adminStats.service.js`는 4절에서 명시한 "꼭 테스트할 로직"이 위치하는 파일이다.

## 8. 변경 이력

| 버전 | 날짜/시간 | 변경 내용 |
|---|---|---|
| v1.0 | 2026-08-13 | 초안 작성 |
| v1.1 | 2026-08-13 | ERD/스키마와 정합성 검토 반영: 3절 컬럼명 예시를 `mbti_result_type_code`로 수정, 7절 `promotionOffer.db.js`에 조인 테이블 처리 주석 추가 |
| v1.2 | 2026-08-13 | 실제 DB 작업 결과와 정합성 검토 반영: 5절 환경변수명을 실제 `.env`와 동일한 `DB_CONN_STRING`으로 수정 및 관리자 시드 변수 언급 추가, 7절 migrations 디렉토리 트리에 002/003 시드 파일 반영 |
| v1.3 | 2026-08-15 | CORS를 `cors()` 전체 허용에서 `FRONTEND_ORIGIN` 환경변수 기반 제한으로 변경, 5절 필수 환경변수 목록에 `FRONTEND_ORIGIN` 추가 |
| v1.4 | 2026-08-20 | `/api-docs`에 Swagger UI 적용(개발 환경 전용, `NODE_ENV=production`에서 비활성화), 5절 필수 환경변수 목록에 `NODE_ENV` 추가 |
| v1.5 | 2026-08-20 | 실제 백엔드 구현(BE-2~BE-6)과 정합성 검토 반영: 7절 디렉토리 트리에 누락되어 있던 `errors.js`, `services/mbtiQuestion.service.js`, `db/adminStats.db.js` 추가 |
| v1.6 | 2026-08-20 | 지속 재방문 강화 기획(FR-3/FR-4) 반영: 1절 엔티티/기능 수 갱신, PromotionOffer를 CRUD 대상으로 재정의(1절 원칙 수정), 3절 Bookmark 엔티티/라우트 경로 추가, 6·7절 프론트/백엔드 디렉토리 트리에 프로모션·북마크 관련 페이지/훅/API/라우트/서비스/db/마이그레이션 파일 추가 |
| v1.7 | 2026-08-20 | 실제 구현과 정합성 검토 반영: 6절 훅 목록의 `useMbtiQuestions.ts`/`useSubmitTest.ts`를 실제 파일 `useMbtiTest.ts` 1개로 정정, 신규 `utils/`(`promotionBadges.ts`)·`constants/`(`mbtiTypes.ts`) 디렉토리 추가 |

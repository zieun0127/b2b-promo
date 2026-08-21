# 사장님 MBTI — E2E 테스트 리포트

- **테스트 일시**: 2026-08-21
- **대상 서버**: 프론트엔드 `http://localhost:5173`(Vite dev server), 백엔드 `http://localhost:3000`(Express dev server) — 둘 다 이미 실행 중인 개발 서버를 그대로 사용
- **도구**: Playwright MCP (브라우저 자동화, 실제 크로미움 인스턴스로 UI를 조작하고 스크린샷 캡처)
- **기준 문서**: `docs/4-user-scenario.md`의 시나리오 1~9
- **방식**: 블랙박스 테스트 — 애플리케이션 소스 코드는 수정하지 않고, 실행 중인 앱을 사용자처럼 조작하며 검증

---

## 시나리오별 결과

### 시나리오 1. 신규 회원가입 → 로그인 → MBTI 테스트 → 결과 확인 (골든 패스)
- **절차**: `e2e-s1-7001@example.com` 계정으로 회원가입 → 로그인(MBTI 이력 없어 `/`로 진입 확인) → 12문항 전부 "예"로 응답 → 제출 → 결과 화면 확인
- **결과**: **PASS**. ESTJ로 판정, 유형 설명/장사 TIP/추천 프로모션 모두 정상 표시
- **스크린샷**: [`screenshots/01-signup-page.png`](screenshots/01-signup-page.png), [`screenshots/01-result-page.png`](screenshots/01-result-page.png)

### 시나리오 2. 기존 회원의 로그인 후 목적지 분기 및 마이페이지 최근 결과 조회
- **절차**: 시나리오 1 계정으로 재로그인(이번엔 완료된 결과 보유) → 자동 이동 경로 확인 → `/mypage` 진입
- **결과**: **PASS**. 로그인 성공 시 `/`가 아닌 `/promotions`로 자동 진입(FE-2 v1.2 분기 로직 정상 동작). 마이페이지에 최근 결과(ESTJ)와 참여일시 정상 표시
- **스크린샷**: [`screenshots/02-login-redirect-promotions.png`](screenshots/02-login-redirect-promotions.png), [`screenshots/02-mypage-latest-result.png`](screenshots/02-mypage-latest-result.png)

### 시나리오 3. 동일 사용자 재참여 (이력 누적)
- **절차**: 마이페이지에서 "MBTI 테스트 다시 하기" → 이번엔 12문항 전부 "아니오"로 응답 → 제출 → 마이페이지 재진입
- **결과**: **PASS**. 새 유형(INFP)이 판정되어 결과 화면에 표시되고, 기존 결과(ESTJ)를 덮어쓰지 않음. 마이페이지 "참여 이력" 섹션에 최신순으로 2건("INFP", "ESTJ") 모두 확인됨
- **스크린샷**: [`screenshots/03-retest-result.png`](screenshots/03-retest-result.png), [`screenshots/03-mypage-history-2-entries.png`](screenshots/03-mypage-history-2-entries.png)

### 시나리오 4. 테스트 미완료 상태에서 제출 시도 (예외)
- **절차**: 테스트 화면에서 12문항 중 8문항만 응답
- **결과**: **PASS**. 진행률 "8/12" 표시, 제출 버튼이 `disabled` 상태(DOM 속성으로 직접 확인)로 유지되어 제출 자체가 불가능함을 확인. 이후 나머지 4문항을 마저 응답하자 정상적으로 제출 가능해짐(시나리오 1 완료 과정에서 확인됨)
- **스크린샷**: [`screenshots/04-exception-incomplete-submit.png`](screenshots/04-exception-incomplete-submit.png)

### 시나리오 5. 관리자의 참여 현황 및 성향 통계 조회
- **절차**: 관리자 계정(`admin@sajangnim-mbti.local`)으로 로그인 → `/admin/stats` 진입
- **결과**: **PASS**. 전체 참여자 수, 16개 유형별 참여자 수/비율, E/I·S/N·T/F·J/P 4개 지표별 비율이 한 화면에 정상 표시됨
- **스크린샷**: [`screenshots/05-admin-stats.png`](screenshots/05-admin-stats.png)

### 시나리오 6. 접근 제어 예외
- **6-1 (비로그인 접근)**: `localStorage` 클리어(비로그인 상태 재현) 후 `/mypage` 직접 접근 시도 → **PASS**, `/login`으로 즉시 리다이렉트됨
- **6-2 (일반 사용자의 관리자 화면 접근)**: `role=USER` 계정으로 로그인 후 `/admin/stats` 직접 접근 시도 → **PASS**, 관리자 화면에 진입하지 못하고 `/`로 리다이렉트됨(클라이언트 라우트 가드가 API 호출 자체를 막아 403 응답도 발생하지 않음 — 콘솔에 불필요한 에러 없이 깔끔하게 차단)
- **스크린샷**: [`screenshots/06-1-exception-unauth-redirect.png`](screenshots/06-1-exception-unauth-redirect.png), [`screenshots/06-2-exception-admin-access-denied.png`](screenshots/06-2-exception-admin-access-denied.png)

### 시나리오 7. 프로모션 목록 조회 및 관심 표시(북마크)
- **절차**: `/promotions` 진입 → 인기 TOP3/전체 목록/뱃지/상태 필터 확인 → 북마크 버튼 클릭(토글) → 재클릭(해제) 확인 → "마감임박" 상태 필터 클릭
- **결과**: **PASS**. 완료된 결과(ESTJ) 보유 계정 기준으로 TOP3에 "추천"+"ESTJ" 뱃지가 붙은 프로모션이 노출되고, 목록에는 "전체/신규/마감임박/상시" 4개 상태 필터 버튼과 신규/상시/마감임박(D-n)/MBTI 유형/인기 뱃지가 함께 표시됨. 북마크 버튼 클릭 시 하트가 `♡ → ♥`로 즉시 전환되고(`aria-label`도 "북마크 등록" → "북마크 해제"로 갱신), 같은 프로모션이 노출되는 TOP3/목록 두 곳 모두 동시에 반영됨. "마감임박" 필터 클릭 시 해당 3건만 남고 TOP3는 영향받지 않음(별도 확인)
- **스크린샷**: [`screenshots/07-promotions-bookmark-toggled.png`](screenshots/07-promotions-bookmark-toggled.png), [`screenshots/07-filter-ending-soon.png`](screenshots/07-filter-ending-soon.png)

### 시나리오 8. 마이페이지에서 참여 이력 전체 및 북마크 목록 확인
- **절차**: 시나리오 7에서 북마크한 계정으로 `/mypage` 진입 → "북마크한 프로모션" 섹션 확인
- **결과**: **PASS**. 북마크한 프로모션("직원 교육 매뉴얼 제작 지원")이 마이페이지 북마크 섹션에 정상 노출됨
- **스크린샷**: [`screenshots/08-mypage-bookmarks-section.png`](screenshots/08-mypage-bookmarks-section.png)

### 시나리오 9. 관리자의 프로모션 등록/수정/삭제
- **절차**: 관리자로 `/admin/promotions` 진입(등록된 16건 확인) → "+ 신규 등록" → 이름/설명 입력 후 MBTI 유형 미선택 상태로 저장 시도(예외) → ENFP 체크 후 재저장 → 목록 즉시 반영 확인 → 삭제(확인창) → 목록에서 사라짐 확인
- **결과**: **PASS**. 유형 미선택 시 "대상 MBTI 유형을 1개 이상 선택해야 합니다." 오류가 표시되고 저장되지 않음. 유형 선택 후 저장하면 새로고침 없이 표에 즉시 반영됨. 삭제도 확인 다이얼로그 승인 후 즉시 목록에서 제거됨
- **스크린샷**: [`screenshots/09-admin-promotions-table.png`](screenshots/09-admin-promotions-table.png), [`screenshots/09-exception-mbti-required.png`](screenshots/09-exception-mbti-required.png), [`screenshots/09-admin-promotion-created.png`](screenshots/09-admin-promotion-created.png)

---

## 예외/엣지 케이스

| 케이스 | 절차 | 결과 | 스크린샷 |
|---|---|---|---|
| 중복 회원가입 | 이미 가입된 이메일로 재가입 시도 | **PASS** — "이미 가입된 이메일입니다." 오류 표시, 계정 미생성 | [`screenshots/edge-duplicate-signup.png`](screenshots/edge-duplicate-signup.png) |
| 잘못된 비밀번호 로그인 | 존재하는 계정에 오답 비밀번호로 로그인 시도 | **PASS** — "이메일 또는 비밀번호가 올바르지 않습니다." 오류 표시 | [`screenshots/edge-wrong-password.png`](screenshots/edge-wrong-password.png) |
| 마이페이지 빈 상태 | MBTI 미완료 신규 계정으로 `/mypage` 접근 | **PASS** — "아직 참여한 테스트가 없습니다." 안내와 참여 이력/북마크 섹션 빈 상태 안내가 에러 없이 표시됨 | [`screenshots/edge-mypage-empty-state.png`](screenshots/edge-mypage-empty-state.png) |
| 프로모션 목록 0건 필터 | "신규"/"마감임박"/"상시" 필터를 순회 확인 | **테스트 시점 기준 해당 없음** — 현재 시드 데이터 기준으로는 4개 상태 필터 모두 1건 이상 존재해 "해당 상태에 맞는 프로모션이 없습니다." 문구가 자연 발생하지 않았음. 해당 안내 문구 자체는 `PromotionListPage.test.tsx`의 자동화 테스트에서 이미 별도로 검증되어 있음(코드 경로는 존재, 이번 E2E에서는 실데이터로 재현되지 않았을 뿐) | 해당 없음 |
| 모바일 반응형 | 뷰포트 375×800으로 `/promotions` 확인 | **PASS** — `document.documentElement.scrollWidth === clientWidth`로 가로 스크롤 없음을 확인, 카드 1단 세로 배치 | [`screenshots/edge-mobile-responsive-promotions.png`](screenshots/edge-mobile-responsive-promotions.png) |

---

## 발견된 이슈

**애플리케이션 버그는 발견되지 않았습니다.** 테스트 중 관찰된 콘솔 에러는 모두 다음 두 범주에 속하며, 실제 결함이 아닙니다.

1. **의도적으로 유발한 예상된 HTTP 에러** — `401`(비로그인/오답 로그인/권한없음 통계 조회 시도), `404`(`/test-submissions/me/latest`, MBTI 미완료 계정 조회 시), `409`(중복 가입 시도). 모두 해당 시나리오의 정상적인 예외 처리 경로이며 화면에는 적절한 안내 문구로 흡수됨
2. **Vite 개발 서버 환경 노이즈** — 브라우저 자동화 도구가 장시간 세션 중 백그라운드로 전환될 때 발생하는 `ERR_NETWORK_IO_SUSPENDED`(리소스 요청 일시 중단) 및 Vite HMR용 WebSocket 재연결 실패 로그. 이는 개발 서버의 Hot Module Replacement 연결과 관련된 것으로 프로덕션 빌드에는 존재하지 않는 개발 환경 전용 현상이며, 실제 페이지 동작(스크린샷상 정상 렌더링)에는 영향이 없었음

---

## 정리(클린업)

이번 테스트에서 생성한 데이터:
- 사용자 계정 1개: `e2e-s1-7001@example.com` (테스트 완료 이력 2건, 북마크 1건 포함)
- 프로모션 1건: "E2E 테스트 프로모션" (시나리오 9에서 UI를 통해 이미 삭제 완료)

**클린업 방법**: `backend/.env`의 `DB_CONN_STRING`을 사용해 Node 스크립트로 직접 DB에서 `bookmarks` → `test_submissions` → `users` 순서로 해당 계정의 데이터를 삭제. 관리자 계정(`admin@sajangnim-mbti.local`)과 시드 프로모션 16건, 그리고 이 테스트와 무관한 기존 계정(`geeeun@example.com`, `a@gmail.com`)은 건드리지 않음.

**검증**: 클린업 후 재조회 결과
- `users` 테이블: `admin@sajangnim-mbti.local`(ADMIN), `geeeun@example.com`(USER), `a@gmail.com`(USER) 3건만 남음 — E2E 테스트 계정 삭제 확인
- `promotion_offers` 테이블: 16건 — 테스트 시작 전 원래 개수와 일치, "E2E 테스트 프로모션" 잔존 없음 확인

테스트로 인한 잔여 데이터 없음.

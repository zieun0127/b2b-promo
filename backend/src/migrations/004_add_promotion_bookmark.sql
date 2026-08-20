-- 사장님 MBTI DB-4: 프로모션 확장 컬럼 + 북마크 테이블 (docs/9-plan.md DB-4, docs/1-domain-definition.md v1.6)
-- 이 파일은 001_init.sql 이후의 증분 마이그레이션이다. docs/8-schema.sql(전체 스냅샷)과 함께 갱신할 것.

BEGIN;

ALTER TABLE promotion_offers
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN ends_at    TIMESTAMPTZ;  -- NULL이면 상시 프로모션(마감 없음)

CREATE TABLE bookmarks (
    user_id             UUID NOT NULL REFERENCES users(id),
    promotion_offer_id  UUID NOT NULL REFERENCES promotion_offers(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, promotion_offer_id)
);

CREATE INDEX idx_bookmarks_promotion_offer_id ON bookmarks(promotion_offer_id);

-- 기존 시드 16건은 컬럼 추가 시점(now())이 created_at으로 찍혀 전부 "신규"가 되고
-- ends_at은 전부 NULL이라 "마감임박"을 검증할 데이터가 없다. FE-7 뱃지 로직(신규/마감임박/상시)을
-- 실제 데이터로 검증할 수 있도록 등록일/마감일을 세 그룹으로 분산한다 (docs/9-plan.md DB-4 참조).

-- 그룹 A: 신규(최근 7일 내 등록) — 3건, 상시(ends_at NULL)
UPDATE promotion_offers SET created_at = now() - INTERVAL '2 days' WHERE id = '6fc77d47-3e16-44a6-860e-c2f5ab2ab548'; -- SNS 라이브 이벤트 홍보 지원
UPDATE promotion_offers SET created_at = now() - INTERVAL '4 days' WHERE id = '550fdaa4-d026-451e-8713-c08c2a6d2d2e'; -- SNS 인증샷 할인 쿠폰
UPDATE promotion_offers SET created_at = now() - INTERVAL '6 days' WHERE id = '2e459ee5-cbb9-49f9-a315-e9c7ff09af76'; -- 단골 손님 감사 세트 할인

-- 그룹 B: 마감임박(7일 내 마감) — 3건, 등록일은 과거(신규 아님)
UPDATE promotion_offers SET created_at = now() - INTERVAL '60 days', ends_at = now() + INTERVAL '2 days' WHERE id = 'ee06493c-2bbe-471f-8c24-ad85b5fc0947'; -- 단골 커뮤니티 이벤트 패키지
UPDATE promotion_offers SET created_at = now() - INTERVAL '45 days', ends_at = now() + INTERVAL '4 days' WHERE id = '4058e444-0fb3-4735-8aa0-6b664cdbf31d'; -- 매장 확장 컨설팅 할인
UPDATE promotion_offers SET created_at = now() - INTERVAL '90 days', ends_at = now() + INTERVAL '6 days' WHERE id = '1facb33d-d4c1-4a91-af0a-41c6f89e873d'; -- 매출 데이터 분석 리포트 무료 체험

-- 그룹 C: 상시(등록일 과거, 마감 없음) — 나머지 10건
UPDATE promotion_offers SET created_at = now() - INTERVAL '10 days'  WHERE id = 'c103d9c2-972d-48f8-9762-07e6707d0318'; -- 브랜드 스토리 콘텐츠 제작 지원
UPDATE promotion_offers SET created_at = now() - INTERVAL '15 days'  WHERE id = '4976e6d0-44a3-4f9a-858e-910e8b7ac11c'; -- 신메뉴 테스트 마케팅 패키지
UPDATE promotion_offers SET created_at = now() - INTERVAL '20 days'  WHERE id = 'ea95113c-610f-47e0-bf40-272ec79958f9'; -- 인테리어 소품 할인 프로모션
UPDATE promotion_offers SET created_at = now() - INTERVAL '25 days'  WHERE id = '78dc27a2-49dd-4f3d-a0c6-98f133348b3a'; -- 정기 재고관리 컨설팅 할인
UPDATE promotion_offers SET created_at = now() - INTERVAL '30 days'  WHERE id = '2b83d8f6-29a0-4c73-99f9-0d68ad32752f'; -- 주방 설비 효율화 장비 할인
UPDATE promotion_offers SET created_at = now() - INTERVAL '35 days'  WHERE id = '63da71f8-092c-4ba1-89af-c89fa285b356'; -- 직원 교육 매뉴얼 제작 지원
UPDATE promotion_offers SET created_at = now() - INTERVAL '40 days'  WHERE id = '7ba68d58-cebe-43c4-a263-529166d0f1b8'; -- 친환경 식자재 구독 할인
UPDATE promotion_offers SET created_at = now() - INTERVAL '50 days'  WHERE id = 'd4006f1d-f3ca-4f8a-bb62-462d519bb84d'; -- 타임세일 프로모션 툴 이용권
UPDATE promotion_offers SET created_at = now() - INTERVAL '70 days'  WHERE id = '35908c9b-4dfe-4876-a5f1-680ffb656ec0'; -- 팀 워크숍 지원 프로모션
UPDATE promotion_offers SET created_at = now() - INTERVAL '80 days'  WHERE id = '1f5d4c35-9da0-41d1-95e9-48e3d7f19e58'; -- 팝업 콜라보 이벤트 지원

COMMIT;

-- 사장님 MBTI DB-5: 프로모션 신청 테이블 (docs/9-plan.md BE-11, docs/1-domain-definition.md v1.11)
-- 이 파일은 004_add_promotion_bookmark.sql 이후의 증분 마이그레이션이다. docs/8-schema.sql(전체 스냅샷)과 함께 갱신할 것.
--
-- 북마크(관심 표시)와 별개로, 사장님이 실제로 프로모션 진행을 원할 때 누르는 "신청하기" 액션을 저장한다.
-- 별도 연락처 입력 폼 없이 계정 email을 그대로 연락처로 재사용한다(관리자가 users.email로 연락).

CREATE TABLE promotion_applications (
    user_id             UUID NOT NULL REFERENCES users(id),
    promotion_offer_id  UUID NOT NULL REFERENCES promotion_offers(id),
    applied_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, promotion_offer_id)
);

CREATE INDEX idx_promotion_applications_promotion_offer_id ON promotion_applications(promotion_offer_id);

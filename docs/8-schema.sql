-- 사장님 MBTI DB 스키마 (PostgreSQL 17)
-- 근거: docs/8-erd.md, docs/1-domain-definition.md
--
-- [성격] 이 파일은 "현재 스키마의 전체 스냅샷"이다 — 신규 환경을 한 번에 세팅하는 용도.
--        실제 적용 이력은 backend/src/migrations/00N_*.sql 증분 파일이 담당하며,
--        001_init.sql은 최초 생성 당시 상태로 동결되어 있어 이 파일과 일치하지 않는다(정상).
--        예: promotion_offers.created_at/ends_at과 bookmarks 테이블은 004_add_promotion_bookmark.sql에서 추가됨.
--        스키마 변경 시 반드시 ①새 마이그레이션 파일 추가 + ②이 스냅샷 갱신을 함께 할 것 (docs/9-plan.md DB-2 참조)

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(10) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mbti_questions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content          TEXT NOT NULL,
    target_indicator VARCHAR(2) NOT NULL CHECK (target_indicator IN ('EI', 'SN', 'TF', 'JP')),
    yes_trait_value  VARCHAR(1) NOT NULL CHECK (yes_trait_value IN ('E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'))
);

CREATE TABLE mbti_result_types (
    type_code    VARCHAR(4) PRIMARY KEY CHECK (type_code ~ '^[EI][SN][TF][JP]$'),
    description  TEXT NOT NULL,
    business_tip TEXT NOT NULL
);

CREATE TABLE promotion_offers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at     TIMESTAMPTZ  -- NULL이면 상시 프로모션(마감 없음)
);

CREATE TABLE mbti_result_type_promotion_offers (
    mbti_result_type_code VARCHAR(4) NOT NULL REFERENCES mbti_result_types(type_code),
    promotion_offer_id    UUID NOT NULL REFERENCES promotion_offers(id),
    PRIMARY KEY (mbti_result_type_code, promotion_offer_id)
);

CREATE TABLE test_submissions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID NOT NULL REFERENCES users(id),
    submitted_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    ei_value               VARCHAR(1) CHECK (ei_value IN ('E', 'I')),
    sn_value               VARCHAR(1) CHECK (sn_value IN ('S', 'N')),
    tf_value               VARCHAR(1) CHECK (tf_value IN ('T', 'F')),
    jp_value               VARCHAR(1) CHECK (jp_value IN ('J', 'P')),
    mbti_result_type_code  VARCHAR(4) REFERENCES mbti_result_types(type_code),
    status                 VARCHAR(12) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('COMPLETED', 'IN_PROGRESS')),
    -- 완료 상태인데 결과값이 비어있는 데이터가 저장되면 관리자 통계(FR-2)가 조용히 틀어지므로 DB 레벨에서 차단
    CONSTRAINT chk_completed_has_result CHECK (
        status <> 'COMPLETED' OR (
            ei_value IS NOT NULL AND sn_value IS NOT NULL AND
            tf_value IS NOT NULL AND jp_value IS NOT NULL AND
            mbti_result_type_code IS NOT NULL
        )
    )
);

-- 관리자 통계 집계(전체/유형별/지표별)가 완료 건 기준으로 자주 조회되므로 최소 인덱스만 추가
CREATE INDEX idx_test_submissions_user_id ON test_submissions(user_id);
CREATE INDEX idx_test_submissions_status ON test_submissions(status);

-- 프로모션 관심 표시(북마크). 이력이 아닌 현재 상태만 저장하므로 복합 PK로 (user_id, promotion_offer_id) 유일성을 보장
CREATE TABLE bookmarks (
    user_id             UUID NOT NULL REFERENCES users(id),
    promotion_offer_id  UUID NOT NULL REFERENCES promotion_offers(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, promotion_offer_id)
);

-- 프로모션별 북마크 수 집계(인기 TOP3, 관리자 통계)가 자주 조회되므로 인덱스 추가
CREATE INDEX idx_bookmarks_promotion_offer_id ON bookmarks(promotion_offer_id);

-- 프로모션 신청(실제 진행 요청). 북마크(관심 표시)와 별개 액션이며, 별도 연락처 입력 없이
-- 신청자 계정의 email을 그대로 연락처로 사용한다(관리자가 이 email로 직접 연락).
CREATE TABLE promotion_applications (
    user_id             UUID NOT NULL REFERENCES users(id),
    promotion_offer_id  UUID NOT NULL REFERENCES promotion_offers(id),
    applied_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, promotion_offer_id)
);

CREATE INDEX idx_promotion_applications_promotion_offer_id ON promotion_applications(promotion_offer_id);

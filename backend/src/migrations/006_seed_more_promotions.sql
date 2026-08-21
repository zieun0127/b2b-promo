-- 사장님 MBTI DB-6: 프로모션 데이터 추가 시드 (유형당 2번째 프로모션, docs/9-plan.md DB-6)
-- 기존 16개(유형:프로모션 1:1, 002_seed.sql)에 유형당 1건씩 추가해 총 32개로 확장한다.
-- 뱃지 검증용으로 신규 3건/마감임박 3건/상시 10건 분포를 그대로 재현한다(004_add_promotion_bookmark.sql과 동일 패턴).

WITH promo_data (type_code, name, description, created_days_ago, ends_days_from_now) AS (
    VALUES
    ('ISTJ', '월간 정산 자동화 툴 할인', '매달 반복되는 정산 업무를 자동화해주는 툴을 할인가로 이용할 수 있는 프로모션입니다.', 10, NULL),
    ('ISFJ', '생일 축하 쿠폰 자동발송 서비스', '단골 손님 생일에 맞춰 축하 쿠폰을 자동으로 발송해주는 서비스입니다.', 15, NULL),
    ('INFJ', '매장 철학 다큐 영상 제작 지원', '매장의 철학과 이야기를 담은 짧은 다큐 영상 제작을 지원하는 프로모션입니다.', 20, NULL),
    ('INTJ', '경쟁사 벤치마킹 리포트 제공', '동일 상권 경쟁 매장의 운영 데이터를 분석한 벤치마킹 리포트를 제공합니다.', 2, 2),
    ('ISTP', '포스(POS) 유지보수 패키지 할인', '포스 장비 유지보수 및 점검 패키지를 할인가로 제공하는 프로모션입니다.', 30, NULL),
    ('ISFP', '시즌 한정 플레이팅 소품 세트', '계절별 감성 플레이팅에 활용할 수 있는 한정판 소품 세트입니다.', 35, NULL),
    ('INFP', '제로웨이스트 포장재 할인', '환경을 생각하는 제로웨이스트 포장재를 할인가로 제공하는 프로모션입니다.', 4, 4),
    ('INTP', 'AI 메뉴 추천 베타 테스트 참여', '신메뉴 조합을 AI로 추천받는 베타 테스트에 참여할 수 있는 프로모션입니다.', 40, NULL),
    ('ESTP', '깜짝 반짝세일 알림 배너 무료 제공', '즉흥적인 반짝세일을 알릴 수 있는 홍보 배너를 무료로 제공합니다.', 6, 6),
    ('ESFP', '인플루언서 협업 매칭 지원', '매장과 어울리는 인플루언서와의 협업을 매칭해주는 프로모션입니다.', 50, NULL),
    ('ENFP', '고객 후기 이벤트 진행 키트', 'SNS 후기 이벤트를 손쉽게 진행할 수 있는 키트를 제공하는 프로모션입니다.', 60, 2),
    ('ENTP', '이색 콜라보 메뉴 개발 컨설팅', '다른 브랜드와의 이색 콜라보 메뉴 개발을 지원하는 컨설팅 프로모션입니다.', 70, NULL),
    ('ESTJ', '매장 안전점검 체크리스트 패키지', '위생/안전 점검을 표준화할 수 있는 체크리스트 패키지를 제공합니다.', 45, 4),
    ('ESFJ', '명절 선물세트 공동구매 지원', '단골 손님 대상 명절 선물세트 공동구매를 지원하는 프로모션입니다.', 80, NULL),
    ('ENFJ', '리더십 워크숍 강사 매칭 지원', '직원 리더십 워크숍을 진행할 강사 매칭을 지원하는 프로모션입니다.', 90, 6),
    ('ENTJ', '프랜차이즈 확장 법률 상담 할인', '매장 확장/가맹 관련 법률 상담을 할인가로 이용할 수 있는 프로모션입니다.', 25, NULL)
),
inserted_promos AS (
    INSERT INTO promotion_offers (name, description, created_at, ends_at)
    SELECT
        name,
        description,
        now() - (created_days_ago || ' days')::interval,
        CASE WHEN ends_days_from_now IS NULL THEN NULL ELSE now() + (ends_days_from_now || ' days')::interval END
    FROM promo_data
    RETURNING id, name
)
INSERT INTO mbti_result_type_promotion_offers (mbti_result_type_code, promotion_offer_id)
SELECT pd.type_code, ip.id
FROM promo_data pd
JOIN inserted_promos ip ON ip.name = pd.name;

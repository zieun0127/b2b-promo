-- 관리자 계정 시드 (docs/9-plan.md DB-3 참고 메모)
-- pgcrypto의 crypt()/gen_salt('bf')는 bcrypt와 동일한 알고리즘이라
-- 백엔드(BE-2)의 bcrypt.compare()로 그대로 검증 가능하다.
--
-- 실제 비밀번호는 이 파일에 하드코딩하지 않는다(공개 저장소에 커밋되는 파일이므로).
-- psql 변수로 주입해서 실행할 것. 값은 backend/.env(ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD,
-- gitignore 처리됨)에만 보관한다.
--
-- 실행 예:
--   psql "$DB_CONN_STRING" \
--     -v admin_email="'admin@sajangnim-mbti.local'" \
--     -v admin_password="'<backend/.env의 ADMIN_SEED_PASSWORD 값>'" \
--     -f 003_seed_admin.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (email, password_hash, role)
VALUES (:admin_email, crypt(:admin_password, gen_salt('bf')), 'ADMIN')
ON CONFLICT (email) DO NOTHING;

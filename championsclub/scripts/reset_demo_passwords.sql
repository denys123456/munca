\set ON_ERROR_STOP on
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE users
SET password_hash = crypt(:'demo_password', gen_salt('bf', 12)),
    token_version = token_version + 1,
    updated_at = now();
COMMIT;
SELECT email, role, status FROM users ORDER BY role, email;

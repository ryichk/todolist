CREATE SCHEMA IF NOT EXISTS app;

-- アプリユーザー
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN ENCRYPTED PASSWORD 'password';
    GRANT CONNECT ON DATABASE app_db TO app_user;
    GRANT USAGE ON SCHEMA app TO app_user;
  END IF;
END;
$$;

-- テストユーザー
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_user') THEN
    CREATE ROLE test_user WITH LOGIN ENCRYPTED PASSWORD 'password';
    GRANT CONNECT ON DATABASE app_db TO test_user;
    GRANT USAGE ON SCHEMA app TO test_user;
  END IF;
END;
$$;

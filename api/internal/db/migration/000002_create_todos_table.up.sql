CREATE TABLE IF NOT EXISTS app.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- AWS CognitoのユーザーID(Sub)を格納
  title TEXT NOT NULL,
  note TEXT,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT, INSERT, UPDATE ON app.todos TO app_user, test_user;
GRANT TRUNCATE ON app.todos TO test_user;

ALTER TABLE app.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY todo_policy ON app.todos TO app_user, test_user
USING (user_id = current_setting('app.current_user_id', true)::UUID);

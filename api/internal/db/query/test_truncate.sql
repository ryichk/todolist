-- name: TruncateAllTables :exec
TRUNCATE TABLE
  app.todos
CASCADE;

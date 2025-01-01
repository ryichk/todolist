-- name: ListTodos :many
SELECT
  id,
  title,
  note,
  done,
  created_at,
  updated_at
FROM app.todos
ORDER BY updated_at DESC;

-- name: CreateTodo :one
INSERT INTO app.todos (
  user_id,
  title,
  note
) VALUES (
  $1, $2, $3
)
RETURNING id, title, note;

-- name: UpdateTodo :exec
UPDATE app.todos SET
  title = $2,
  note = $3,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- name: DoneTodo :exec
UPDATE app.todos SET
  done = TRUE,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

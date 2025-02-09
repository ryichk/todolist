// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0
// source: todo.sql

package model

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const createTodo = `-- name: CreateTodo :one
INSERT INTO app.todos (
  user_id,
  title,
  note
) VALUES (
  $1, $2, $3
)
RETURNING id, title, note
`

type CreateTodoParams struct {
	UserID pgtype.UUID `json:"user_id"`
	Title  string      `json:"title"`
	Note   pgtype.Text `json:"note"`
}

type CreateTodoRow struct {
	ID    pgtype.UUID `json:"id"`
	Title string      `json:"title"`
	Note  pgtype.Text `json:"note"`
}

func (q *Queries) CreateTodo(ctx context.Context, db DBTX, arg CreateTodoParams) (*CreateTodoRow, error) {
	row := db.QueryRow(ctx, createTodo, arg.UserID, arg.Title, arg.Note)
	var i CreateTodoRow
	err := row.Scan(&i.ID, &i.Title, &i.Note)
	return &i, err
}

const doneTodo = `-- name: DoneTodo :exec
UPDATE app.todos SET
  done = TRUE,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $1
`

func (q *Queries) DoneTodo(ctx context.Context, db DBTX, id pgtype.UUID) error {
	_, err := db.Exec(ctx, doneTodo, id)
	return err
}

const listTodos = `-- name: ListTodos :many
SELECT
  id,
  title,
  note,
  done,
  created_at,
  updated_at
FROM app.todos
ORDER BY updated_at DESC
`

type ListTodosRow struct {
	ID        pgtype.UUID        `json:"id"`
	Title     string             `json:"title"`
	Note      pgtype.Text        `json:"note"`
	Done      bool               `json:"done"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
	UpdatedAt pgtype.Timestamptz `json:"updated_at"`
}

func (q *Queries) ListTodos(ctx context.Context, db DBTX) ([]*ListTodosRow, error) {
	rows, err := db.Query(ctx, listTodos)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []*ListTodosRow{}
	for rows.Next() {
		var i ListTodosRow
		if err := rows.Scan(
			&i.ID,
			&i.Title,
			&i.Note,
			&i.Done,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, &i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateTodo = `-- name: UpdateTodo :exec
UPDATE app.todos SET
  title = $2,
  note = $3,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $1
`

type UpdateTodoParams struct {
	ID    pgtype.UUID `json:"id"`
	Title string      `json:"title"`
	Note  pgtype.Text `json:"note"`
}

func (q *Queries) UpdateTodo(ctx context.Context, db DBTX, arg UpdateTodoParams) error {
	_, err := db.Exec(ctx, updateTodo, arg.ID, arg.Title, arg.Note)
	return err
}

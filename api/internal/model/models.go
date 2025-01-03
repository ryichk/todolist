// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0

package model

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type Todo struct {
	ID        pgtype.UUID        `json:"id"`
	UserID    pgtype.UUID        `json:"user_id"`
	Title     string             `json:"title"`
	Note      pgtype.Text        `json:"note"`
	Done      bool               `json:"done"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
	UpdatedAt pgtype.Timestamptz `json:"updated_at"`
}

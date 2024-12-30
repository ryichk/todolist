package handler

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ryichk/todolist/api/internal/model"
)

type Handler struct {
	pool    *pgxpool.Pool
	queries *model.Queries
}

func NewHandler(pool *pgxpool.Pool, queries *model.Queries) *Handler {
	return &Handler{pool: pool, queries: queries}
}

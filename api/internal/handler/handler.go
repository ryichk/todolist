package handler

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/ryichk/todolist/api/internal/model"
)

type Handler struct {
	pool    *pgxpool.Pool
	queries *model.Queries
}

func NewHandler(pool *pgxpool.Pool, queries *model.Queries) *Handler {
	return &Handler{pool: pool, queries: queries}
}

func (h *Handler) Hello(c echo.Context) error {
	return c.String(http.StatusOK, "Hello!")
}

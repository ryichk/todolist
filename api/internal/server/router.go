package server

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"github.com/ryichk/todolist/api/internal/handler"
	"github.com/ryichk/todolist/api/internal/model"
)

func PublicRoutes(e *echo.Echo, h *handler.Handler, db *pgxpool.Pool, queries *model.Queries) {
	e.GET("/", h.Hello)
}

func PrivateRoutes(e *echo.Echo, h *handler.Handler, db *pgxpool.Pool, queries *model.Queries) {
	e.Use(AuthMiddleware())

	e.GET("/todos", h.ListTodos)
	e.POST("/todos", h.CreateTodo)
}

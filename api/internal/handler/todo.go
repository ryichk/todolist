package handler

import (
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"github.com/ryichk/todolist/api/internal/model"
)

func (h *Handler) ListTodos(c echo.Context) error {
	ctx := c.Request().Context()

	userInfo, err := h.AcquireConnection(ctx, c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer userInfo.Conn.Release()

	todos, err := h.queries.ListTodos(ctx, userInfo.Conn)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, todos)
}

type CreateTodoRequestBody struct {
	Title string      `json:"title" validate:"required,min=1"`
	Note  pgtype.Text `json:"note"`
}

func (h *Handler) CreateTodo(c echo.Context) error {
	ctx := c.Request().Context()

	var body CreateTodoRequestBody
	if err := c.Bind(&body); err != nil {
		log.Printf("invalid request payload: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request payload")
	}
	if err := c.Validate(body); err != nil {
		log.Printf("validation failed: %v", err)
		return echo.NewHTTPError(http.StatusBadRequest, "Validation failed")
	}

	userInfo, err := h.AcquireConnection(ctx, c)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer userInfo.Conn.Release()

	createTodoParams := model.NewCreateTodoParams(
		userInfo.UserID,
		body.Title,
		body.Note,
	)
	todo, err := h.queries.CreateTodo(ctx, userInfo.Conn, *createTodoParams)
	if err != nil {
		log.Printf("failed to create todo: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create todo")
	}

	return c.JSON(http.StatusCreated, todo)
}

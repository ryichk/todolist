package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
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

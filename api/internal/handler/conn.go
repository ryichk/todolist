package handler

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

type UserInfo struct {
	Conn   *pgxpool.Conn
	UserID pgtype.UUID
}

func (h *Handler) AcquireConnection(ctx context.Context, c echo.Context) (*UserInfo, error) {
	userID, err := UserIDByContext(c)
	if err != nil {
		return nil, err
	}

	conn, err := h.queries.AcquireConnection(ctx, h.pool)
	if err != nil {
		return nil, err
	}

	return &UserInfo{
		Conn:   conn,
		UserID: userID,
	}, nil
}

package handler

import (
	"errors"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

func UserIDByContext(c echo.Context) (pgtype.UUID, error) {
	userIDStr, ok := c.Get("userID").(string)
	if !ok {
		return pgtype.UUID{}, errors.New("user ID is not a string")
	}

	var userID pgtype.UUID
	if err := userID.Scan(userIDStr); err != nil {
		return pgtype.UUID{}, err
	}

	return userID, nil
}

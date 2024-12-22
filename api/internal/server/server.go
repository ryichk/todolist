package server

import (
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"

	"github.com/ryichk/todolist/api/internal/handler"
	"github.com/ryichk/todolist/api/internal/model"
)

func NewServer(db *pgxpool.Pool) (*echo.Echo, error) {
	e := echo.New()
	e.HideBanner = true

	if os.Getenv("ENVIRONMENT") == "development" {
		e.Logger.SetLevel(log.DEBUG)
	} else {
		e.Logger.SetLevel(log.INFO)
	}

	e.Server.ReadTimeout = 10 * time.Second
	e.Server.ReadHeaderTimeout = 10 * time.Second
	e.Server.WriteTimeout = 10 * time.Second

	queries := model.New()
	h := handler.NewHandler(db, queries)

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))

	PrivateRoutes(e, h, db, queries)

	return e, nil
}

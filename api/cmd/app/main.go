package main

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ryichk/todolist/api/internal/server"
)

func main() {
	password := url.QueryEscape(os.Getenv("POSTGRES_APP_PASSWORD"))
	dbURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		os.Getenv("POSTGRES_APP_USER"),
		password,
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_DB"),
	)
	dbConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatal(err)
	}

	dbConfig.MaxConns = 30
	dbConfig.MaxConnLifetime = 5 * time.Minute
	dbConfig.MaxConnIdleTime = 2 * time.Minute

	dbPool, err := pgxpool.NewWithConfig(context.Background(), dbConfig)
	if err != nil {
		log.Fatal(err)
	}
	defer dbPool.Close()

	e, err := server.NewServer(dbPool)
	if err != nil {
		log.Fatal(err)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}

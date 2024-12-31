package testutil

import (
	"context"
	"log"

	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/ory/dockertest/v3"

	"github.com/ryichk/todolist/api/internal/model"
	"github.com/ryichk/todolist/api/internal/testdb"
)

func SetupTestDB() (*dockertest.Pool, *dockertest.Resource, *pgxpool.Pool) {
	adminUser := "admin_user"
	testUser := "test_user"
	dbPassword := "password"
	dbName := "app_db"

	dockerPool, dockerResource := testdb.CreateTestContainer(adminUser, dbPassword, dbName)

	_ = testdb.ConnectTestDB(dockerPool, dockerResource, adminUser, dbPassword, dbName)
	testdb.MigrateTestDB(dockerResource, adminUser, dbPassword, dbName)

	dbPool := testdb.ConnectTestDB(dockerPool, dockerResource, testUser, dbPassword, dbName)

	return dockerPool, dockerResource, dbPool
}

func SetupEcho() *echo.Echo {
	e := echo.New()
	e.Validator = &model.CustomValidator{Validator: validator.New(validator.WithRequiredStructEnabled())}
	return e
}

func SetAuthContext(c echo.Context) {
	c.Set("userID", SeedTestUserIDStr())
}

func Teardown(ctx context.Context, q *model.Queries, conn *pgxpool.Conn) {
	defer conn.Release()
	if err := q.TruncateAllTables(ctx, conn); err != nil {
		log.Fatalf("failed to truncate all tables: %v", err)
	}
}

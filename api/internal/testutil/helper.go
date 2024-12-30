package testutil

import (
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

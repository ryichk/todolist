package handler

import (
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ory/dockertest/v3"

	"github.com/ryichk/todolist/api/internal/testdb"
	"github.com/ryichk/todolist/api/internal/testutil"
)

var testDBPool *pgxpool.Pool

func TestMain(m *testing.M) {
	var dockerPool *dockertest.Pool
	var dockerResource *dockertest.Resource
	dockerPool, dockerResource, testDBPool = testutil.SetupTestDB()

	code := m.Run()

	testdb.CloseTestContainer(dockerPool, dockerResource)

	os.Exit(code)
}

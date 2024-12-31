package testdb

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
)

func CreateTestContainer(postgresUser, postgresPassword, postgresDB string) (*dockertest.Pool, *dockertest.Resource) {
	dockerPool, err := dockertest.NewPool("")
	if err != nil {
		log.Fatalf("Could not construct pool: %v", err)
	}
	dockerPool.MaxWait = 5 * time.Second

	runOptions := &dockertest.RunOptions{
		Repository: "postgres",
		Tag:        "17",
		Env: []string{
			fmt.Sprintf("POSTGRES_USER=%s", postgresUser),
			fmt.Sprintf("POSTGRES_PASSWORD=%s", postgresPassword),
			fmt.Sprintf("POSTGRES_DB=%s", postgresDB),
			"listen_addresses='*'",
		},
	}

	resource, err := dockerPool.RunWithOptions(runOptions,
		func(config *docker.HostConfig) {
			config.AutoRemove = true
			config.RestartPolicy = docker.RestartPolicy{
				Name: "no",
			}
		},
	)
	if err != nil {
		log.Fatalf("Could not start resource: %v", err)
	}

	return dockerPool, resource
}

func ConnectTestDB(dockerPool *dockertest.Pool, resource *dockertest.Resource, postgresUser, postgresPassword, postgresDB string) *pgxpool.Pool {
	databaseURL := getDatabaseURL(resource, postgresUser, postgresPassword, postgresDB)

	var pool *pgxpool.Pool

	if retryErr := dockerPool.Retry(func() error {
		var err error
		pool, err = pgxpool.New(context.Background(), databaseURL)
		if err != nil {
			return err
		}
		if err := pool.Ping(context.Background()); err != nil {
			return err
		}
		return nil
	}); retryErr != nil {
		log.Fatalf("Could not connect to Docker: %v", retryErr)
	}

	return pool
}

func MigrateTestDB(resource *dockertest.Resource, postgresUser, postgresPassword, postgresDB string) {
	databaseURL := getDatabaseURL(resource, postgresUser, postgresPassword, postgresDB)
	mig, err := migrate.New("file://../db/migration", databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	if err := mig.Up(); err != nil {
		if err.Error() == "no change" {
			log.Println("No change")
		} else {
			log.Fatal(err)
		}
	}
}

func CloseTestContainer(dockerPool *dockertest.Pool, resource *dockertest.Resource) {
	if err := dockerPool.Purge(resource); err != nil {
		log.Fatalf("Could not purge resource: %v", err)
	}
}

func getDatabaseURL(resource *dockertest.Resource, postgresUser, postgresPassword, postgresDB string) string {
	hostname := os.Getenv("DOCKER_HOSTNAME")
	if hostname == "" {
		hostname = "localhost"
	}
	port := resource.GetPort("5432/tcp")
	databaseURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		postgresUser,
		postgresPassword,
		hostname,
		port,
		postgresDB,
	)

	return databaseURL
}

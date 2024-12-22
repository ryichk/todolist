include .env

DOCKER_RUN_CLIENT=docker compose run --rm client
DOCKER_RUN_API=docker compose run --rm api
POSTGRESQL_ADMIN_URL=postgres://$(POSTGRES_ADMIN_USER):$(POSTGRES_ADMIN_PASSWORD)@db:$(POSTGRES_PORT)/$(POSTGRES_DB)?sslmode=disable

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

down_all:
	docker compose down --rmi all --volumes --remove-orphans

ps:
	docker compose ps

psql:
	docker compose exec db psql -U $(POSTGRES_ADMIN_USER) -d $(POSTGRES_DB)

migrate_create:
	$(DOCKER_RUN_API) migrate create -ext sql -dir internal/db/migration -seq $(NAME)

migrate_up:
	$(DOCKER_RUN_API) migrate -path internal/db/migration -database $(POSTGRESQL_ADMIN_URL) -verbose up

migrate_down:
	$(DOCKER_RUN_API) migrate -path internal/db/migration -database $(POSTGRESQL_ADMIN_URL) -verbose down $(STEP)

migrate_drop:
	$(DOCKER_RUN_API) migrate -path internal/db/migration -database $(POSTGRESQL_ADMIN_URL) -verbose drop

migrate_version:
	$(DOCKER_RUN_API) migrate -path internal/db/migration -database $(POSTGRESQL_ADMIN_URL) version

sqlc_gen:
	$(DOCKER_RUN_API) sqlc generate

sqlc_vet:
	$(DOCKER_RUN_API) sqlc vet

tidy:
	$(DOCKER_RUN_API) go mod tidy

fmt:
	$(DOCKER_RUN_API) go fmt ./...

lint:
	$(DOCKER_RUN_CLIENT) npm run lint:fix
	$(DOCKER_RUN_API) golangci-lint run

lint_v:
	$(DOCKER_RUN_API) golangci-lint run -v

test:
	$(DOCKER_RUN_API) go test -cover ./...

test_v:
	$(DOCKER_RUN_API) go test -v -cover ./...

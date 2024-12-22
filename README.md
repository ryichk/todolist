# todolist

## Summary

### Frontend

#### Programming Language

- TypeScript

#### Frameworks

- [Remix](https://remix.run/)
  - [SPA Mode](https://remix.run/docs/en/main/guides/spa-mode)

### Backend

#### Programming Language

- Go

#### Frameworks

- [Echo](https://github.com/labstack/echo)
  - Utilizes [air](https://github.com/air-verse/air) for Live Reload

#### DB

- PostgreSQL

## Environment Construction

### 1. Install Docker

### 2. Set environment variables

```sh
cp .env.sample .env
```

```sh
cp client/.env.sample client/.env
```

Set the Amazon Cognito User Pool ID and Client ID to be handled in the development environment in the environment variables of the `.env` and `client/.env` files.

```.env
COGNITO_USER_POOL_ID=
```

```client/.env
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
```

### 3. Start the Docker Containers

```sh
make up
```

### 4. Execute DB migration

```sh
make migrate_up
```

## Development Procedure

### Organize Dependencies of Go modules

```sh
make tidy
```

### Code Formatting

```sh
make fmt
```

### Static Analysis

```sh
make lint
```

### Test Code Execution

```sh
make test
```

### Create Migration File

To make changes to the DB schema, create a file in `api/internal/db/migration` and run migration.

#### Steps

1. Generate migration file (you can do it manually)
2. Implement DDL
3. Execute migration

#### Migration File Creation Command

```sh
make migrate_create NAME="file name"
```

### Migration Execution Command

```sh
make migrate_up
```

### Rollback Command for Migration

If STEP is not passed as an argument, everything will be rolled back.

```sh
make migrate_down STEP=1
```

### DML Implementation

Implement the query in the file `api/internal/db/query`.

Reference: https://docs.sqlc.dev/en/latest/howto/select.html

When adding a new model, add it to rename in `api/sqlc.yml` so that the App prefix is not attached to the model name.

After implementing the query, run the `splc generate` command.

```sh
make sqlc_gen
```

### Model Implementation

the model generated by the `sqlc generate` command is placed in `api/internal/model`.

The model implements business logic, etc.

### Request Handler Implementation

The request handler implementation is placed in `api/internal/handler`.

The request handler implements request validation, etc.

### Implement Request Routing

Implement request routing in `api/internal/server/router.go`.
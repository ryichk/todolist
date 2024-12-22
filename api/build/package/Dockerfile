FROM golang:1.23.3-alpine

WORKDIR /api

RUN go install github.com/air-verse/air@latest && \
    go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest && \
    go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest && \
    go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.62.2

COPY . .

CMD ["air", "-c", ".air.toml"]

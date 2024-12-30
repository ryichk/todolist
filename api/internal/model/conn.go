package model

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func (q *Queries) AcquireConnection(ctx context.Context, pool *pgxpool.Pool) (*pgxpool.Conn, error) {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return nil, err
	}

	return conn, nil
}

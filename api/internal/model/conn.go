package model

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

func (q *Queries) AcquireConnection(ctx context.Context, pool *pgxpool.Pool, userID pgtype.UUID) (*pgxpool.Conn, error) {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return nil, err
	}

	if _, err := conn.Exec(ctx, "SELECT set_config('app.current_user_id', $1, false)", userID); err != nil {
		conn.Release()
		return nil, err
	}

	return conn, nil
}

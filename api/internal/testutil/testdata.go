package testutil

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"path/filepath"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ryichk/todolist/api/internal/model"
)

type TestData struct {
	UserID    pgtype.UUID `json:"user_id"`
	UserIDStr string      `json:"user_id_str"`
}

func loadTestData(filename string) *TestData {
	path, err := filepath.Abs(filepath.Join("../testdata", filename))
	if err != nil {
		log.Fatalf("failed to get absolute path: %v", err)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("failed to read file: %v", err)
	}

	var testData TestData
	if err := json.Unmarshal(data, &testData); err != nil {
		log.Fatalf("failed to unmarshal json: %v", err)
	}

	return &testData
}

func SeedTestUserID() pgtype.UUID {
	return loadTestData("testdata.json").UserID
}

func SeedTestUserIDStr() string {
	return loadTestData("testdata.json").UserIDStr
}

func SetupTestTodo(ctx context.Context, q *model.Queries, conn *pgxpool.Conn) model.Todo {
	userID := SeedTestUserID()
	title := "Todoリストを作る"
	note := pgtype.Text{String: "Todoリストを作ります。", Valid: true}
	createTodoParams := model.NewCreateTodoParams(
		userID,
		title,
		note,
	)
	todo, err := q.CreateTodo(ctx, conn, *createTodoParams)
	if err != nil {
		log.Fatalf("failed to create todo: %v", err)
	}

	return model.Todo{
		ID:    todo.ID,
		Title: title,
		Note:  note,
		Done:  false,
	}
}

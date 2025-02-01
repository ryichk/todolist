package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/ryichk/todolist/api/internal/model"
	"github.com/ryichk/todolist/api/internal/testutil"
)

func TestListTodos(t *testing.T) {
	e := testutil.SetupEcho()
	queries := model.New()
	h := NewHandler(testDBPool, queries)

	ctx := context.Background()

	userID := testutil.SeedTestUserID()
	conn, err := queries.AcquireConnection(ctx, testDBPool, userID)
	if err != nil {
		log.Fatalf("failed to acquire connection: %v", err)
	}

	todo := testutil.SetupTestTodo(ctx, queries, conn)

	t.Run("Todo一覧を取得できる", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/todos", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		testutil.SetAuthContext(c)

		if err := h.ListTodos(c); err != nil {
			t.Errorf("Handler.ListTodos() error = %v", err)
		}
		if rec.Code != http.StatusOK {
			t.Errorf("Handler.ListTodos() got http status = %v, want %v", rec.Code, http.StatusOK)
		}
		var got []model.ListTodosRow
		if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
			t.Errorf("Handler.ListTodos() error decoding response body: %v", err)
		}
		if got[0].ID != todo.ID {
			t.Errorf("Handler.ListTodos() got ID = %v, want %v", got[0].ID, todo.ID)
		}
		if got[0].Title != todo.Title {
			t.Errorf("Handler.ListTodos() got Title = %v, want %v", got[0].Title, todo.Title)
		}
		if got[0].Note != todo.Note {
			t.Errorf("Handler.ListTodos() got Note = %v, want %v", got[0].Note, todo.Note)
		}
	})

	testutil.Teardown(ctx, queries, conn)
}

func TestCreateTodo(t *testing.T) {
	e := testutil.SetupEcho()
	queries := model.New()
	h := NewHandler(testDBPool, queries)
	ctx := context.Background()
	userID := testutil.SeedTestUserID()
	conn, err := queries.AcquireConnection(ctx, testDBPool, userID)
	if err != nil {
		log.Fatalf("failed to acquire connection: %v", err)
	}

	t.Run("Todoを作成できる", func(t *testing.T) {
		title := "TODOタイトル"
		note := "TODOの詳細です。"
		requestBody, _ := json.Marshal(map[string]interface{}{
			"title": title,
			"note":  note,
		})
		req := httptest.NewRequest(http.MethodPost, "/todos", bytes.NewReader(requestBody))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		testutil.SetAuthContext(c)

		if err := h.CreateTodo(c); err != nil {
			t.Errorf("Handler.CreateTodo() error = %v", err)
		}
		if rec.Code != http.StatusCreated {
			t.Errorf("Handler.CreateTodo() got http status = %v, want %v", rec.Code, http.StatusCreated)
		}
		var got map[string]string
		if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
			t.Errorf("Handler.CreateTodo() error decoding response body: %v", err)
		}
		if got["title"] != title {
			t.Errorf("Handler.CreateTodo() got title = %v, want = %v", got["title"], title)
		}
		if got["note"] != note {
			t.Errorf("Handler.CreateTodo() got note = %v, want = %v", got["note"], note)
		}
	})

	testutil.Teardown(ctx, queries, conn)
}

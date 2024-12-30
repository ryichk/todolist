package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ryichk/todolist/api/internal/model"
	"github.com/ryichk/todolist/api/internal/testutil"
)

func TestHello(t *testing.T) {
	e := testutil.SetupEcho()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	queries := model.New()
	h := NewHandler(testDBPool, queries)
	if err := h.Hello(c); err != nil {
		t.Errorf("Hello() error = %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("Hello() rec.Code = %v, want %v", rec.Code, http.StatusOK)
	}
}

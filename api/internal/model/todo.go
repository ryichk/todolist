package model

import "github.com/jackc/pgx/v5/pgtype"

func NewCreateTodoParams(userID pgtype.UUID, title string, note pgtype.Text) *CreateTodoParams {
	return &CreateTodoParams{
		UserID: userID,
		Title:  title,
		Note:   note,
	}
}

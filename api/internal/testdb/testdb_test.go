package testdb

import (
	"testing"
)

func TestCreateTestContainer(t *testing.T) {
	type args struct {
		postgresUser     string
		postgresPassword string
		postgresDB       string
	}
	tests := []struct {
		name string
		args args
	}{
		{
			name: "success",
			args: args{
				postgresUser:     "admin_user",
				postgresPassword: "password",
				postgresDB:       "app_db",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			CreateTestContainer(tt.args.postgresUser, tt.args.postgresPassword, tt.args.postgresDB)
		})
	}
}

func TestConnectTestDB(t *testing.T) {
	type args struct {
		postgresUser     string
		postgresPassword string
		postgresDB       string
	}
	tests := []struct {
		name string
		args args
	}{
		{
			name: "admin_userでTestDBに接続できる",
			args: args{
				postgresUser:     "admin_user",
				postgresPassword: "password",
				postgresDB:       "app_db",
			},
		},
		{
			name: "test_userでTestDBに接続できる",
			args: args{
				postgresUser:     "test_user",
				postgresPassword: "password",
				postgresDB:       "app_db",
			},
		},
		{
			name: "app_userでTestDBに接続できる",
			args: args{
				postgresUser:     "test_user",
				postgresPassword: "password",
				postgresDB:       "app_db",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dockerPool, resource := CreateTestContainer(tt.args.postgresUser, tt.args.postgresPassword, tt.args.postgresDB)
			ConnectTestDB(dockerPool, resource, tt.args.postgresUser, tt.args.postgresPassword, tt.args.postgresDB)
		})
	}
}

func TestMigrateTestDB(t *testing.T) {
	type args struct {
		postgresUser     string
		postgresPassword string
		postgresDB       string
	}
	tests := []struct {
		name string
		args args
	}{
		{
			name: "admin_userでMigrateできる",
			args: args{
				postgresUser:     "admin_user",
				postgresPassword: "password",
				postgresDB:       "app_db",
			},
		},
		{
			name: "test_userでMigrateできる",
			args: args{
				postgresUser:     "test_user",
				postgresPassword: "password",
				postgresDB:       "app_db",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dockerPool, resource := CreateTestContainer(tt.args.postgresUser, tt.args.postgresPassword, tt.args.postgresDB)
			ConnectTestDB(dockerPool, resource, tt.args.postgresUser, tt.args.postgresPassword, tt.args.postgresDB)
			MigrateTestDB(resource, tt.args.postgresUser, tt.args.postgresPassword, tt.args.postgresDB)
		})
	}
}

func TestCloseTestContainer(t *testing.T) {
	type args struct {
		postgresUser     string
		postgresPassword string
		postgresDB       string
	}
	tests := []struct {
		name string
		args args
	}{
		{
			name: "テスト用コンテナを削除できる",
			args: args{
				postgresUser:     "admin_user",
				postgresPassword: "password",
				postgresDB:       "app_db",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dockerPool, resource := CreateTestContainer(tt.args.postgresUser, tt.args.postgresPassword, tt.args.postgresDB)
			CloseTestContainer(dockerPool, resource)
		})
	}
}

package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/joho/godotenv/autoload"
)

type UserInfo struct {
	userID    int
	userName  string
	userEmail string
	lastLogin time.Time
}

type Service interface {
	Health() map[string]string
	IsUserInDatabase(email string) (bool, error)
	AddUser(fName, lName, email, authToken, oauthID string) error
	UpdateLastLogin(email string) error // New method for updating lastLogin
}

type service struct {
	db *sql.DB
}

var (
	database = os.Getenv("DB_DATABASE")
	password = os.Getenv("DB_PASSWORD")
	username = os.Getenv("DB_USERNAME")
	port     = os.Getenv("DB_PORT")
	host     = os.Getenv("DB_HOST")
)

func New() Service {
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		username, password, host, port, database)
	db, err := sql.Open("pgx", connStr)
	if err != nil {
		log.Fatal(err)
	}
	s := &service{db: db}
	return s
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	err := s.db.PingContext(ctx)
	if err != nil {
		log.Fatalf(fmt.Sprintf("db down: %v", err))
	}

	return map[string]string{
		"message": "It's healthy!",
	}
}

// Check if user exists in database
func (s *service) IsUserInDatabase(email string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS (SELECT 1 FROM userInfo WHERE userEmail = $1)`
	err := s.db.QueryRow(query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check if user exists: %v", err)
	}
	return exists, nil
}

// Add a new user to the database
func (s *service) AddUser(fName, lName, email, authToken, oauthID string,) error {
	query := `INSERT INTO userInfo (firstName, lastName, userEmail, lastLogin, googleauthtoken, googleuserid) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := s.db.Exec(query, fName, lName, email, time.Now(), authToken, oauthID)
	if err != nil {
		return fmt.Errorf("failed to add user: %v", err)
	}
	return nil
}

// Update last login time for a user
func (s *service) UpdateLastLogin(email string) error {
	query := `UPDATE userInfo SET lastLogin = $1 WHERE userEmail = $2`
	_, err := s.db.Exec(query, time.Now(), email)
	if err != nil {
		return fmt.Errorf("failed to update last login time: %v", err)
	}
	return nil
}


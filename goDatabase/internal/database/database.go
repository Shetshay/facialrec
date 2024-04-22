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

type Service interface {
	Health() map[string]string
    QueryData(query string, args ...interface{}) ([]UserInfo, error)
}

type service struct {
	db *sql.DB
}

type UserInfo struct {
    UserID       string    `json:"userid"`
    Username     string    `json:"username"`
    UserEmail    string    `json:"useremail"`
    SignupData   string    `json:"signupdata"`
    LastLogin    string    `json:"lastlogin"`
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

func (s *service) QueryData(query string, args ...interface{}) ([]UserInfo, error) {
    // Create a slice to hold the results
    var results []UserInfo

    // Use context for query execution
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // Prepare the query
    rows, err := s.db.QueryContext(ctx, query, args...)
    if err != nil {
        log.Println("Error executing query:", err)
        return nil, err
    }
    defer rows.Close()

    // Iterate through the result set
    for rows.Next() {
        var data UserInfo
        // Scan the row into the YourDataType struct
        if err := rows.Scan(&data.UserID, &data.Username, &data.UserEmail, &data.SignupData, &data.LastLogin); err != nil { // Adjust the Scan to match YourDataType fields
            log.Println("Error scanning row:", err)
            return nil, err
        }
        results = append(results, data)
    }

    // Check for errors from iterating over rows
    if err = rows.Err(); err != nil {
        log.Println("Error during row iteration:", err)
        return nil, err
    }

    return results, nil
}

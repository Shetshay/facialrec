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
	UserID     int
	UserName   string
	UserEmail  string
	LastLogin  time.Time
	BucketName string
	ProfilePicture string `json:"profilePicture"`
}

type Service interface {
	Health() map[string]string
	IsUserInDatabase(email string) (bool, error)
	AddUser(fName, lName, email, authToken, profilePicture string) (int, error)
	UpdateLastLogin(email string) error
	UpdateUserBucketName(userEmail string, bucketName string) error
	GetUserIDByEmail(email string) (int, error)
	GetBucketNameByEmail(email string) (string, error)
    CheckIfFaceisScanned(userID int) (bool, error)
    UpdateFaceScannedBool(userID int, updateBool bool) error
	UpdateProfilePicture(email string, profilePicture string) error
	GetProfilePictureByEmail(email string) (string, error)
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

	// Test the database connection
	err = db.Ping()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	s := &service{db: db}
	return s
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	err := s.db.PingContext(ctx)
	if err != nil {
		log.Printf("Database down: %v", err)
		return map[string]string{
			"status":  "unhealthy",
			"message": fmt.Sprintf("Database down: %v", err),
		}
	}

	return map[string]string{
		"status":  "healthy",
		"message": "Database connection is healthy",
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

// Add a new user to the database and return the userID
func (s *service) AddUser(fName, lName, email, authToken, profilePicture string) (int, error) {
	query := `
		INSERT INTO userInfo (
			firstName, lastName, userEmail, lastLogin,
			googleAuthToken, profilePicture
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING userID
	`
	var userID int
	err := s.db.QueryRow(query, fName, lName, email, time.Now(), authToken, profilePicture).Scan(&userID)
	if err != nil {
		return 0, fmt.Errorf("failed to add user: %v", err)
	}
	return userID, nil
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

// Update user's bucket name
func (s *service) UpdateUserBucketName(userEmail string, bucketName string) error {
	query := `UPDATE userInfo SET bucketName = $1 WHERE userEmail = $2`
	_, err := s.db.Exec(query, bucketName, userEmail)
	if err != nil {
		return fmt.Errorf("failed to update user's bucket name: %v", err)
	}
	return nil
}

// Get userID by email
func (s *service) GetUserIDByEmail(email string) (int, error) {
	var userID int
	query := `SELECT userID FROM userInfo WHERE userEmail = $1`
	err := s.db.QueryRow(query, email).Scan(&userID)
	if err != nil {
		return 0, fmt.Errorf("failed to get userID by email: %v", err)
	}
	return userID, nil
}

func (s *service) CheckIfFaceisScanned(userID int) (bool, error) {
	var faceScannedStatus bool
	query := `SELECT faceScanned FROM userInfo WHERE userID = $1`
	err := s.db.QueryRow(query, userID).Scan(&faceScannedStatus)
	if err != nil {
		return false, fmt.Errorf("failed to get faceScannedStatus by userID: %v", err)
	}
	return faceScannedStatus, nil
}

func (s *service) UpdateFaceScannedBool(userID int, updateBool bool) error {
	query := `UPDATE userInfo set faceScanned = $1 where userID = $2`
	_, err := s.db.Exec(query, updateBool, userID)
	if err != nil {
		return fmt.Errorf("failed to update faceScannedStatus bool: %v", err)
	}
	return nil
}


// Get bucket name by email
func (s *service) GetBucketNameByEmail(email string) (string, error) {
	var bucketName string
	query := `SELECT bucketName FROM userInfo WHERE userEmail = $1`
	err := s.db.QueryRow(query, email).Scan(&bucketName)
	if err != nil {
		return "", fmt.Errorf("failed to get bucket name by email: %v", err)
	}
	return bucketName, nil
}


func (s *service) UpdateProfilePicture(email string, profilePicture string) error {
	query := `UPDATE userInfo SET profilePicture = $1 WHERE userEmail = $2`
	result, err := s.db.Exec(query, profilePicture, email)
	if err != nil {
		return fmt.Errorf("failed to update profile picture: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %v", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("no user found with email: %s", email)
	}

	return nil
}

func (s *service) GetProfilePictureByEmail(email string) (string, error) {
    var profilePicture string
    query := `SELECT profilePicture FROM userInfo WHERE userEmail = $1`
    err := s.db.QueryRow(query, email).Scan(&profilePicture)
    if err != nil {
        if err == sql.ErrNoRows {
            return "", fmt.Errorf("no user found with email: %s", email)
        }
        return "", fmt.Errorf("failed to get profile picture: %v", err)
    }
    return profilePicture, nil
}

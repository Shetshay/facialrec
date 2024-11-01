package server

import (
	"fmt"
	"log" // Added import for logging
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"goDatabase/internal/database"

	"github.com/minio/minio-go/v7"                 // MinIO SDK import
	"github.com/minio/minio-go/v7/pkg/credentials" // MinIO credentials import
)

type Server struct {
	port int

	db database.Service

	minioClient *minio.Client // Added MinIO client to Server struct
}

func NewServer() *http.Server {
	port, _ := strconv.Atoi(os.Getenv("PORT"))

	// Initialize MinIO client
	minioEndpoint := os.Getenv("MINIO_ENDPOINT")    // e.g., "minio:9000" if using Docker
	minioAccessKey := os.Getenv("MINIO_ACCESS_KEY") // e.g., "minioadmin"
	minioSecretKey := os.Getenv("MINIO_SECRET_KEY") // e.g., "minioadmin"

	minioClient, err := minio.New(minioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(minioAccessKey, minioSecretKey, ""),
		Secure: false, // Set to true if using HTTPS
	})
	if err != nil {
		log.Fatalf("Failed to initialize MinIO client: %v", err)
	}

	NewServer := &Server{
		port: port,

		db: database.New(),

		minioClient: minioClient, // Assign MinIO client to Server struct
	}

	// Declare Server config
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	fmt.Println("INITTLAITED SEVERS")


	return server
}

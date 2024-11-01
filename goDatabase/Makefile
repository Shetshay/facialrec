# Simple Makefile for a Go project

# Build the application
all: build

build:
	@echo "Building..."
	@go build -o main cmd/api/main.go

# Install dependencies
deps:
	@echo "Installing dependencies..."
	@rm -f go.sum
	@go mod download
	@go mod tidy -compat=1.21

# Run the application
run: deps
	@go run cmd/api/main.go

# Create DB container
docker-run:
	@if docker compose up 2>/dev/null; then \
		: ; \
		else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose up; \
		fi

# Shutdown DB container
docker-down:
	@if docker compose down 2>/dev/null; then \
		: ; \
		else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose down; \
		fi

# Test the application
test:
	@echo "Testing..."
	@go test ./tests -v

watch:
	@~/go/bin/air

# Clean the binary and dependencies
clean:
	@echo "Cleaning..."
	@rm -f main
	@go clean -modcache

.PHONY: all build run test clean deps

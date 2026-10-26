.PHONY: all build test test-backend test-frontend test-ingestion dev-backend dev-frontend benchmark docker-up docker-down clean

all: build test

build:
	@echo "==> Building Rust Axum Backend..."
	cd backend && cargo build --release
	@echo "==> Building React Vite Frontend..."
	cd frontend && npm run build

test: test-ingestion test-backend test-frontend
	@echo "==> All automated tests executed successfully!"

test-backend:
	@echo "==> Running Rust Backend API Tests..."
	cd backend && cargo test --test api_tests -j 2

test-frontend:
	@echo "==> Running Frontend Vitest Suite..."
	cd frontend && npm test

test-ingestion:
	@echo "==> Running Python Data Ingestion Pipeline Tests..."
	python ingestion/test_ingestion.py

dev-backend:
	@echo "==> Starting Rust Backend in Development Mode..."
	cd backend && cargo run

dev-frontend:
	@echo "==> Starting Vite Dev Server..."
	cd frontend && npm run dev

benchmark:
	@echo "==> Running API Performance & Throughput Benchmark..."
	python scripts/benchmark.py --url http://localhost:3001 --concurrency 5 --requests 25

docker-up:
	@echo "==> Launching Local Docker Stack (Postgres, Axum, React)..."
	docker-compose up -d --build

docker-down:
	@echo "==> Stopping Docker Stack..."
	docker-compose down

clean:
	@echo "==> Cleaning Build Artifacts..."
	cd backend && cargo clean
	rm -rf frontend/dist

# AirWatch Rust Backend Multi-Stage Production Dockerfile
FROM rust:1.79-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies layer
COPY Cargo.toml Cargo.lock ./
RUN mkdir src tests && \
    echo "fn main() {}" > src/main.rs && \
    echo "pub mod config;" > src/lib.rs && \
    echo "pub struct Config;" > src/config.rs && \
    cargo build --release --lib || true && \
    rm -rf src tests

# Copy application source code
COPY src ./src
COPY tests ./tests

# Build release binary
RUN cargo build --release --bin airwatch-backend

# Runtime stage
FROM debian:bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 airwatch && useradd -u 1001 -g airwatch -s /bin/bash airwatch

COPY --from=builder /app/target/release/airwatch-backend /usr/local/bin/airwatch-backend

USER airwatch

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["airwatch-backend"]

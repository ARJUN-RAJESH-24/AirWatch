# Root Dockerfile pointing to backend
FROM rust:1.79-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY backend/Cargo.toml backend/Cargo.lock ./
RUN mkdir src tests && \
    echo "fn main() {}" > src/main.rs && \
    echo "pub mod config;" > src/lib.rs && \
    echo "pub struct Config;" > src/config.rs && \
    cargo build --release --lib || true && \
    rm -rf src tests

COPY backend/src ./src
COPY backend/tests ./tests

RUN cargo build --release --bin airwatch-backend

FROM debian:bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 airwatch && useradd -u 1001 -g airwatch -s /bin/bash airwatch

COPY --from=builder /app/target/release/airwatch-backend /usr/local/bin/airwatch-backend

USER airwatch

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["airwatch-backend"]

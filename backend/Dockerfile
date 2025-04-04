# Stage 1: Builder
FROM python:3.9-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies with explicit torch installation first
COPY requirements.txt .
RUN pip install --no-cache-dir torch --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt gunicorn==20.1.0

# Stage 2: Runtime
FROM python:3.9-slim

WORKDIR /app

# Copy virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create directories and set permissions
RUN mkdir -p /.cache && \
    chown -R 1000:1000 /.cache && \
    mkdir -p /app/backend/COMBINE/chroma_db \
    /app/static/tts \
    /app/temp_audio && \
    chown -R 1000:1000 /app

# Set cache environment variables
ENV TRANSFORMERS_CACHE=/.cache
ENV HF_HOME=/.cache
ENV XDG_CACHE_HOME=/.cache

# Copy application files
COPY --chown=1000:1000 . .
COPY --chown=1000:1000 entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER 1000

EXPOSE 5000
CMD ["/entrypoint.sh"]
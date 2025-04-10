# Stage 1: Builder
FROM python:3.9-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir wheel && \
    pip install --no-cache-dir gunicorn==21.2.0 && \  
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.9-slim

WORKDIR /app

# Copy virtual environment with correct permissions
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"  

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Create directories with proper permissions
RUN mkdir -p \
    /app/backend/COMBINE/chroma_db \
    /app/static/tts \
    /app/temp_audio \
    /.cache && \
    chown -R 1000:1000 /app /.cache

# Environment variables
ENV HF_HOME=/.cache \
    XDG_CACHE_HOME=/.cache \
    MPLCONFIGDIR=/app/.config/matplotlib \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Copy application code
COPY --chown=1000:1000 . .

# Set up entrypoint
RUN chmod +x entrypoint.sh
USER 1000

EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]
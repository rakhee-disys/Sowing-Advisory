# Stage 1: Builder - Install build dependencies
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

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn==20.1.0

# # Stage 2: Runtime
# FROM python:3.9-slim

# WORKDIR /app

# # Copy virtual environment from builder
# COPY --from=builder /opt/venv /opt/venv
# ENV PATH="/opt/venv/bin:$PATH"

# # Install runtime dependencies
# RUN apt-get update && \
#     apt-get install -y --no-install-recommends \
#     ffmpeg \
#     && rm -rf /var/lib/apt/lists/*

# # Create directory structure
# RUN mkdir -p /app/backend/COMBINE/chroma_db \
#     /app/static/tts \
#     /app/temp_audio \
#     && chown -R 1000:1000 /app

# # Copy application files
# COPY --chown=1000:1000 . .

# # Copy and set up entrypoint
# COPY --chown=1000:1000 entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

# # Use non-root user
# USER 1000

# # Health check
# HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
#     CMD curl -f http://localhost:5000/healthcheck || exit 1

# EXPOSE 5000
# CMD ["/entrypoint.sh"]

# Stage 2: Runtime
FROM python:3.9-slim

WORKDIR /app

# Create cache directory with proper permissions
RUN mkdir -p /.cache && \
    chown -R 1000:1000 /.cache && \
    mkdir -p /app/backend/COMBINE/chroma_db \
    /app/static/tts \
    /app/temp_audio && \
    chown -R 1000:1000 /app

# Set environment variables for model cache
ENV TRANSFORMERS_CACHE=/.cache
ENV HF_HOME=/.cache
ENV XDG_CACHE_HOME=/.cache

# Copy virtual environment and application files
COPY --from=builder /opt/venv /opt/venv
COPY --chown=1000:1000 . .
COPY --chown=1000:1000 entrypoint.sh /entrypoint.sh

# Final setup
RUN chmod +x /entrypoint.sh
USER 1000

EXPOSE 5000
CMD ["/entrypoint.sh"]
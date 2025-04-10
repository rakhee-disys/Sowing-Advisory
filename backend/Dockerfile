# Stage 1: Builder
FROM python:3.9-slim as builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
# In the builder stage, replace the pip install line with:
    RUN pip uninstall -y torch torchvision  # Remove any existing versions
    RUN pip install --no-cache-dir \
        torch==2.1.2+cpu \
        torchvision==0.16.2+cpu \
        --extra-index-url https://download.pytorch.org/whl/cpu && \
        pip install --no-cache-dir -r requirements.txt gunicorn==20.1.0
       # Stage 2: Runtime
FROM python:3.9-slim

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN mkdir -p \
    /.cache \
    /app/static \
    /app/temp_audio \
    /app/COMBINE/chroma_db && \
    chown -R 1000:1000 /app /.cache

COPY --chown=1000:1000 . .

# Entrypoint with secret handling
USER 1000

EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]
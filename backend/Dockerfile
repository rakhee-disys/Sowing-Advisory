# Stage 1: Builder
FROM python:3.9-slim as builder

WORKDIR /app
COPY requirements.txt . 

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# First install specific torch/torchvision versions
RUN pip install --no-cache-dir \
    torch==2.1.2+cpu \
    torchvision==0.16.2+cpu \
    torchaudio==2.1.2+cpu \
    --extra-index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir huggingface-hub==0.23.0 && \
    pip install --no-cache-dir -r requirements.txt

# Then install other requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn==20.1.0

# Stage 2: Runtime
FROM python:3.9-slim

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN mkdir -p /.cache && \
    chown -R 1000:1000 /.cache && \
    mkdir -p /app/COMBINE/chroma_db \
    /app/static/tts \
    /app/temp_audio && \
    chown -R 1000:1000 /app

ENV HF_HOME=/.cache \
    XDG_CACHE_HOME=/.cache

COPY --chown=1000:1000 . .

RUN chmod +x entrypoint.sh
USER 1000

EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]
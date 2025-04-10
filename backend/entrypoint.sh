#!/bin/bash
set -eo pipefail

# Log function with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Load environment variables
load_env() {
    if [ -f "/app/.env" ]; then
        log "Loading environment variables from .env file"
        export $(grep -v '^#' /app/.env | xargs)
    fi
    
    # Load Azure credentials from secret if not in environment
    if [ -z "$AZURE_OPENAI_API_KEY" ] && [ -f "/run/secrets/azure_api_key" ]; then
        log "Loading Azure API key from Docker secrets"
        export AZURE_OPENAI_API_KEY=$(cat /run/secrets/azure_api_key)
    fi
}

# Verify essential Python packages
verify_packages() {
    log "Verifying Python package dependencies"
    python -c "
import importlib, sys
packages = {
    'torch': 'PyTorch',
    'transformers': 'Transformers',
    'whisperx': 'WhisperX',
    'chromadb': 'ChromaDB',
    'fastapi': 'FastAPI'
}
failures = 0
for pkg, name in packages.items():
    try:
        importlib.import_module(pkg)
        print(f'✓ {name} package available')
    except ImportError as e:
        print(f'✗ Error importing {name}: {e}')
        failures += 1
sys.exit(failures > 0)
    " || exit 1
}

# Check service dependencies
check_services() {
    log "Checking service dependencies"
    
    # Check ChromaDB connection
    if python -c "import chromadb; client = chromadb.PersistentClient(path='/app/backend/COMBINE/chroma_db'); print('✓ ChromaDB connection successful')"; then
        log "ChromaDB connection verified"
    else
        log "Error connecting to ChromaDB"
        exit 1
    fi
    
    # Check CUDA availability if using GPU
    if python -c "import torch; print(f'✓ CUDA available: {torch.cuda.is_available()}')"; then
        log "PyTorch CUDA check completed"
    else
        log "Error checking CUDA availability"
        exit 1
    fi
}

# Main execution
main() {
    log "Starting Sowing Advisory backend service"
    
    load_env
    verify_packages
    check_services
    
    # Validate required environment variables
    if [ -z "$AZURE_OPENAI_API_KEY" ]; then
        log "Error: AZURE_OPENAI_API_KEY not set"
        exit 1
    fi
    
    log "Starting Gunicorn server"
    exec /opt/venv/bin/gunicorn --bind 0.0.0.0:5000 \
    --workers ${GUNICORN_WORKERS:-2} \
    --timeout ${GUNICORN_TIMEOUT:-300} \
    --keep-alive ${GUNICORN_KEEP_ALIVE:-120} \
    --log-level ${GUNICORN_LOG_LEVEL:-info} \
    --worker-class uvicorn.workers.UvicornWorker \
    --access-logfile - \
    --error-logfile - \
    "main:app"
}

main "$@"
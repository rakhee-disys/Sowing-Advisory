#!/bin/bash
set -e

# Load Azure credentials
echo "Loading Azure credentials..."
export AZURE_OPENAI_API_KEY=$(cat /run/secrets/azure_api_key | tr -d '\0')

# Preload models with explicit cache directory
echo "Preloading ML models..."
python -c "
import os
from sentence_transformers import SentenceTransformer
os.makedirs('/.cache', exist_ok=True)
model = SentenceTransformer('BAAI/bge-small-en', cache_folder='/.cache')
print('Model loaded successfully')
"

# Start Gunicorn
exec gunicorn --bind 0.0.0.0:5000 \
    --workers 2 \
    --timeout 300 \
    --keep-alive 120 \
    --log-level info \
    "main:app"
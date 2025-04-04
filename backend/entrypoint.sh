#!/bin/bash
set -e

# Verify installations
echo "Verifying Python packages..."
python -c "
import importlib
for pkg in ['sentence_transformers', 'transformers', 'torch']:
    try:
        importlib.import_module(pkg)
        print(f'Successfully imported {pkg}')
    except ImportError as e:
        print(f'Error importing {pkg}: {str(e)}')
        exit(1)
"

# Load Azure credentials
echo "Loading Azure credentials..."
export AZURE_OPENAI_API_KEY=$(cat /run/secrets/azure_api_key | tr -d '\0')

# Start Gunicorn
exec gunicorn --bind 0.0.0.0:5000 \
    --workers 2 \
    --timeout 300 \
    --keep-alive 120 \
    --log-level info \
    "main:app"
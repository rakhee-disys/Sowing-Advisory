#!/bin/bash
set -e

# Load Azure credentials from secret if not in environment
if [ -z "$AZURE_OPENAI_API_KEY" ] && [ -f "/run/secrets/azure_api_key" ]; then
    export AZURE_OPENAI_API_KEY=$(cat /run/secrets/azure_api_key)
fi

# Verify essential packages
python -c "
import importlib
for pkg in ['torch', 'transformers']:
    try:
        importlib.import_module(pkg)
        print(f'✓ {pkg} imported successfully')
    except ImportError as e:
        print(f'✗ Error importing {pkg}: {e}')
        exit(1)
"

# Start Gunicorn
exec gunicorn --bind 0.0.0.0:5000 \
    --workers 2 \
    --timeout 300 \
    --keep-alive 120 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    "main:app"
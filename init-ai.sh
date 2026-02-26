#!/bin/bash
# init-ai.sh
# Script to be run after the AI container is up to pull the model

echo "Requesting Ollama to pull 'mistral' model..."
# We use the host's curl to talk to the mapped port 11434
curl -X POST http://localhost:11434/api/pull -d '{"name": "mistral"}'

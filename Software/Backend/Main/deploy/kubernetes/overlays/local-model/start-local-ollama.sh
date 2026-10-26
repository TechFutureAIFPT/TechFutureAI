#!/bin/sh
set -eu

model_name="cv-match:7b-local-sft-v2"
ollama serve &
server_pid=$!
cleanup() {
  kill "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

until ollama list >/dev/null 2>&1; do
  sleep 1
done

ollama show "$model_name" >/dev/null
wait "$server_pid"

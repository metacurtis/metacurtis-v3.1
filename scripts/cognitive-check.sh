#!/usr/bin/env bash
# scripts/cognitive-check.sh  –  Ask two quick questions & log JSON
set -euo pipefail
read -rp "Energy level (High/Med/Low)? " energy
read -rp "Mood (🙂 / 😐 / 😟 )? " mood
ts=$(date +"%Y-%m-%dT%H:%M:%S")
mkdir -p .ai-metrics
echo "{\"ts\":\"$ts\",\"energy\":\"$energy\",\"mood\":\"$mood\"}" \
  >> .ai-metrics/cognitive-log.ndjson
echo "🧠  Logged cognitive snapshot $ts"


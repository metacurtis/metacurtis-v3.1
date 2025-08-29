#!/bin/bash

echo "🎭 THEATER LAYER:"
echo "  Theater Director:"
find ../src -name "*Director*" -type f ! -name "*.bak*" | head -20

echo -e "\n  Consciousness Theater:"
find ../src -name "*Theater*" -type f ! -name "*.bak*" | head -20

echo -e "\n  Opening Sequence:"
find ../src -name "*Opening*" -o -name "*Sequence*" -type f ! -name "*.bak*" | head -20

echo -e "\n🧠 ENGINE LAYER:"
find ../src -name "*Engine*" -type f ! -name "*.bak*" | head -20

echo -e "\n🎨 RENDERING LAYER:"
echo "  WebGL Components:"
find ../src -path "*/webgl/*" -type f ! -name "*.bak*" | head -20

echo -e "\n🎼 ORCHESTRATION LAYER:"
echo "  BeatBus/Orchestrator:"
find ../src -name "*Beat*" -o -name "*Orchestr*" -type f ! -name "*.bak*" | head -20

echo -e "\n⚛️ STATE LAYER:"
echo "  Atoms & State Management:"
find ../src -name "*atom*" -o -name "*state*" -o -name "*State*" -type f ! -name "*.bak*" | head -20

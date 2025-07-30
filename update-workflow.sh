#!/bin/bash
# Update the AI queue workflow with GH_TOKEN fix

cat << 'EOF' > .github/workflows/ai-queue.yml
name: AI Patch Queue

# ----‑‑‑‑‑ permissions so the bot can push & open PRs ‑‑‑‑‑----
permissions:
  contents: write         # push, branch delete
  pull-requests: write    # create / label PRs

# ----‑‑‑‑‑ triggers ‑‑‑‑‑----
on:
  # run whenever a *.patch file is pushed into .ai‑queue/
  push:
    paths:
      - '.ai-queue/**/*.patch'
  # allow manual rerun from the Actions UI
  workflow_dispatch: {}

# ----‑‑‑‑‑ job definition ‑‑‑‑‑----
jobs:
  apply-patch:
    runs-on: ubuntu-latest
    env:
      GH_TOKEN: \${{ github.token }}  # Fix for gh pr create

    steps:
      # 1. checkout full repo history (needed for 3‑way apply)
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # 2. set up Node 20 (matches vite‑plugin‑glsl engine)
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      # 3. run the patch‑queue script
      - name: Run AI Patch Queue
        run: |
          node scripts/apply-ai-patch.cjs
EOF

echo "✅ Updated .github/workflows/ai-queue.yml with GH_TOKEN fix"

#!/bin/bash

# Path to VS Code settings file
VSCODE_SETTINGS=".vscode/settings.json"

# Ensure .vscode directory exists
mkdir -p .vscode

# Desired settings as a JSON string
read -r -d '' NEW_SETTINGS << EOM
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ],
  "editor.formatOnSave": true
}
EOM

# If settings.json does not exist, just write it
if [ ! -f "$VSCODE_SETTINGS" ]; then
  echo "$NEW_SETTINGS" > "$VSCODE_SETTINGS"
  echo "Created $VSCODE_SETTINGS with ESLint/format-on-save settings."
else
  # If it exists, merge settings (requires jq)
  if command -v jq >/dev/null 2>&1; then
    # Merge, giving priority to NEW_SETTINGS for the keys we care about
    jq -s '.[0] * .[1]' "$VSCODE_SETTINGS" <(echo "$NEW_SETTINGS") > "${VSCODE_SETTINGS}.tmp" && \
    mv "${VSCODE_SETTINGS}.tmp" "$VSCODE_SETTINGS"
    echo "Merged ESLint/format-on-save settings into $VSCODE_SETTINGS."
  else
    echo "Warning: jq not found, unable to merge. Add the following to $VSCODE_SETTINGS manually:"
    echo "$NEW_SETTINGS"
  fi
fi


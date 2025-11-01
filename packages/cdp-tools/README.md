# @metacurtis/cdp-tools

Constitutional Development Protocol v2.0 – automated velocity framework for spec-driven development.

## Features

- **50–60× faster validation** (≈5s vs 4–5 minutes)
- **Automatic savepoints** (zero manual work)
- **Schema-driven probe validation**
- **Clear mandatory/optional visual test triggers**
- **100% spec compliance** (automated enforcement)

## Installation

```bash
npm install --save-dev @metacurtis/cdp-tools
```

## Quick Start

```bash
# Initialize CDP in your project
npx cdp init

# Start work (automatic savepoint)
npm run cdp:start feat/your-feature

# Make changes...

# Commit with validation
npm run cdp:commit "fix: improve particle distribution"
```

## Commands

- `npm run cdp:start <branch>` – Start work session with savepoint
- `npm run cdp:check` – Run spec validation (SST + drift)
- `npm run cdp:probe` – Execute probes
- `npm run cdp:validate` – Spec + probes
- `npm run cdp:commit "message"` – Commit with validation
- `npm run cdp:savepoint:list` – List savepoints
- `npm run cdp:rollback <id>` – Rollback to savepoint

## Documentation

Full documentation lives in the MetaCurtis repo under `docs/development/`.

## License

MIT

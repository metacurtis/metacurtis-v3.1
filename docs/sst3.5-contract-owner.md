# SST 3.5 Contract Owner

## Canonical Contract

For SST 3.5, the canonical contract is:

- **Data:** `sst/canon/v3.5.json`
- **Schema:** `sst/canon/schema.json`

These two files together define:

- Which fields exist.
- Which types / enums / structures are valid.
- Which parts of SST are considered stable.

## Invariants

- All runtime code (`canonicalAuthority`, `VisualOrchestrator`, `BeatBus`, renderer, tools) must **treat this pair as the source of truth**.
- Local TS types, comments, or ad-hoc assumptions are **not allowed to disagree** with the canonical contract. Where they do, they are **partial / legacy**.
- Any new SST 3.5 capabilities must be reflected **first** in `sst/canon/schema.json` and then flowed into runtime.

## Phase

- Current phase: **0B/0C** – canonical owner pinned; schema is still incomplete in some areas (visual verbs, beat visuals, etc.), but **ownership is no longer ambiguous**.

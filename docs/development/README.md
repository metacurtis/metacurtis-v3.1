# Development Guides

## Constitutional Development Protocol v2.0

The CDP v2.0 is our automated velocity framework for spec-driven development.

**Core Documents:**
- [CDP v2.0 Complete Playbook](./Constitutional_Development_Protocol_v2.0.md) – Full specification
- [Implementation Guide](./CDP_v2_Implementation_Guide.md) – Integration steps
- [Quick Reference](./CDP_Quick_Reference.md) – Command cheat sheet

**Key Features:**
- 50–60× faster validation (≈5s vs 4–5 min)
- Automatic savepoints (zero manual work)
- Schema-driven probe validation
- Clear mandatory/optional visual test triggers

**Get Started:**

```bash
npm install --save-dev @metacurtis/cdp-tools
npx cdp init
npm run cdp:start feat/your-feature
```

**See Also:**
- [AI Partner Field Manual](../AI_PARTNER_FIELD_MANUAL.md)
- [Opening Sequence Playbook](../playbooks/opening-sequence-playbook.md)
- [Velocity Playbook](../velocity/VELOCITY_PLAYBOOK.md)

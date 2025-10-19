# SST-V3 Director Pattern - Git Workflow

## Day 1: Development Flow

### Setup Feature Branch (5 minutes)

- [ ] Fetch latest: `git fetch origin`
- [ ] Create branch: `git checkout -b feat/sst-v3-director-pattern`
- [ ] Verify clean: `git status`

### Commit After Each Task Group

_Commit messages are taken directly from the implementation plan._

- [ ] **Director Infrastructure:** `git add -A && git commit -m "feat(theater): add Director pattern infrastructure"`
- [ ] **Opening Sequence:** `git add -A && git commit -m "feat(theater): add reactive OpeningSequence component"`
- [ ] **Engine Emergence:** `git add -A && git commit -m "feat(engine): add emergence blueprint mode"`
- [ ] **Renderer Confirmation:** `git add -A && git commit -m "feat(renderer): add emergence confirmation"`
- [ ] **Theater Integration:** `git add -A && git commit -m "refactor(theater): integrate Director pattern"`
- [ ] **Flow Verification:** `git add -A && git commit -m "test: verify complete Director flow"`
- [ ] **Narrative System:** `git add -A && git commit -m "feat(theater): add Director-controlled narrative"`
- [ ] **Memory Fragments:** `git add -A && git commit -m "feat(theater): add memory fragments system"`
- [ ] **Shader Behaviors:** `git add -A && git commit -m "feat(shaders): add tier behaviors"`
- [ ] **Stage Transitions:** `git add -A && git commit -m "feat(theater): polish stage transitions"`
- [ ] **User Controls:** `git add -A && git commit -m "feat(interaction): add user controls"`
- [ ] **Debug Overlay:** `git add -A && git commit -m "feat(debug): add Director monitoring"`
- [ ] **Performance Validation:** `git add -A && git commit -m "perf: optimize Director flow"`
- [ ] **Final Day 1 Test:** `git add -A && git commit -m "test: complete SST v3.0 validation"`

### End of Day 1

- [ ] Push branch: `git push origin feat/sst-v3-director-pattern`
- [ ] Check CI/CD: Verify no build errors

## Day 2: Ship Flow

### Morning: Final Polish (2 hours)

- [ ] Fix any remaining bugs and add final touches.
- [ ] Commit changes: `git add -A && git commit -m "polish: final SST v3.0 adjustments"`
- [ ] Final local checks: `npm run lint && npm test`

### Afternoon: Release Process (2 hours)

#### Quality Gates

- [ ] Lint clean: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] Build works: `npm run build`
- [ ] Test production build locally: `npx serve dist`

#### Version & Tag

- [ ] Update version: `npm version 3.0.0 --no-git-tag-version`
- [ ] Commit version bump: `git add -A && git commit -m "chore(release): v3.0.0"`
- [ ] Create tag with release message: `git tag -a v3.0.0 -m "Release: SST v3.0 with Director pattern"`

#### Merge to Main

- [ ] Switch to main: `git checkout main`
- [ ] Pull latest: `git pull origin main`
- [ ] Merge feature branch: `git merge --no-ff feat/sst-v3-director-pattern`
- [ ] Push main to remote: `git push origin main`
- [ ] Push the new tag: `git push origin v3.0.0`

#### Deploy

- [ ] Trigger deployment via Vercel/Netlify/etc.
- [ ] Verify the live URL is working as expected.
- [ ] Test key features on a mobile device.

#### Documentation

- [ ] Create a new GitHub Release for `v3.0.0`.
- [ ] Attach screenshots or a demo video.
- [ ] Update the `README.md` with the live project link.

## Rollback Plan (If Needed)

- [ ] Quick revert of merge: `git revert HEAD && git push`
- [ ] Or, for critical issues, deploy the last stable tag.

## Success Confirmation

- [ ] Live URL works and is stable.
- [ ] 60+ FPS performance is verified on production.
- [ ] All features from the Director plan are working.
- [ ] Browser console is clean with zero errors.
- [ ] `v3.0.0` tag is pushed and GitHub Release is published.

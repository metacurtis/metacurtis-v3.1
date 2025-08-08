# SST-V3-GIT-WORKFLOW.md

## Day 1: Development Flow

### Setup Feature Branch (5 minutes)

- [ ] Fetch latest: `git fetch origin`
- [ ] Create branch: `git checkout -b feat/sst-v3-complete`
- [ ] Verify clean: `git status`

### Commit After Each Session

- [ ] Morning Session 1: `git add -A && git commit -m "feat(theater): add opening sequence"`
- [ ] Morning Session 2: `git add -A && git commit -m "feat(theater): add narrative system"`
- [ ] Morning Session 3: `git add -A && git commit -m "feat(theater): add memory fragments"`
- [ ] Morning Session 4: `git add -A && git commit -m "feat(shaders): add tier behaviors"`
- [ ] Afternoon Session 1: `git add -A && git commit -m "feat(audio): add soundscapes"`
- [ ] Afternoon Session 2: `git add -A && git commit -m "feat(visuals): add stage effects"`
- [ ] Afternoon Session 3: `git add -A && git commit -m "feat(interaction): add controls"`
- [ ] Afternoon Session 4: `git add -A && git commit -m "test: verify performance"`

### End of Day 1

- [ ] Push branch: `git push origin feat/sst-v3-complete`
- [ ] Check CI/CD: Verify no build errors

## Day 2: Ship Flow

### Morning: Final Polish (2 hours)

- [ ] Fix bugs: `git add -A && git commit -m "fix: resolve console errors"`
- [ ] Add polish: `git add -A && git commit -m "polish: loading screen and optimizations"`
- [ ] Final test: `npm run lint && npm test`

### Afternoon: Release Process (2 hours)

#### Quality Gates

- [ ] Lint clean: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] Build works: `npm run build`
- [ ] Local test: `npx serve dist`

#### Version & Tag

- [ ] Update version: `npm version 3.0.0 --no-git-tag-version`
- [ ] Commit version: `git add -A && git commit -m "chore(release): v3.0.0"`
- [ ] Create tag: `git tag -a v3.0.0 -m "Release: SST v3.0 Complete"`

#### Merge to Main

- [ ] Switch to main: `git checkout main`
- [ ] Pull latest: `git pull origin main`
- [ ] Merge feature: `git merge --no-ff feat/sst-v3-complete`
- [ ] Push main: `git push origin main`
- [ ] Push tag: `git push origin v3.0.0`

#### Deploy

- [ ] Trigger deployment (Vercel/Netlify)
- [ ] Verify live URL works
- [ ] Test on mobile device

#### Documentation

- [ ] Create GitHub Release
- [ ] Add screenshots
- [ ] Add demo video
- [ ] Update README with live link

## Rollback Plan (If Needed)

- [ ] Quick revert: `git revert HEAD && git push`
- [ ] Or checkout previous: `git checkout v2.9.0`
- [ ] Tag hotfix: `git tag -a v3.0.1 -m "Hotfix"`
- [ ] Push hotfix: `git push origin v3.0.1`

## Success Confirmation

- [ ] Live URL works
- [ ] 60+ FPS verified
- [ ] All features working
- [ ] Zero console errors
- [ ] Tagged v3.0.0
- [ ] GitHub Release created

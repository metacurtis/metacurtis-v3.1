# Manual Fixes Still Needed

## 🚨 CRITICAL ERRORS (Must fix to pass lint):

### 1. Case Declarations (5 errors)

**Files:** App.jsx (lines 53, 66, 79, 92, 114) and AdaptiveQualitySystem.jsx (line 86)

**Fix:** Wrap case blocks containing `const` declarations in braces:

```javascript
// BEFORE:
case 'stage':
  const config = getConfig();
  break;

// AFTER:
case 'stage': {
  const config = getConfig();
  break;
}
```

**Commands to find exact locations:**

```bash
grep -n "case.*:" src/App.jsx
grep -n "case.*:" src/components/quality/AdaptiveQualitySystem.jsx
```

### 2. Conditional Hooks (4 errors in WebGLBackground.jsx)

**Lines:** 222, 279, 325, 340

**Fix:** Move ALL hooks to component top level before any conditional logic:

```javascript
function Component() {
  // ALL HOOKS FIRST
  const value1 = useMemo(() => (condition1 ? compute() : null), [deps]);
  const value2 = useMemo(() => (condition2 ? compute() : null), [deps]);
  useFrame(() => {
    if (!condition) return;
    // frame logic
  });

  // THEN conditional rendering
  if (!condition) return null;
  return <mesh />;
}
```

### 3. Duplicate Else-If (1 error in App.jsx line 114)

**Fix:** Check App.jsx around line 114 for duplicate condition and remove/fix it.

## ⚠️ WARNINGS (Can fix later):

- Missing hook dependencies (24 warnings)
- Fast refresh violations (3 warnings)
- Other unused variables (1 warning)

## 🎯 Next Steps:

1. Fix the 6 critical case declaration errors manually
2. Fix the 4 conditional hook errors in WebGLBackground.jsx
3. Fix the duplicate else-if in App.jsx
4. Run: `npm run lint` to verify
5. Address remaining warnings as needed

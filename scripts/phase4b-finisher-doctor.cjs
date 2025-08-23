#!/usr/bin/env node
/**
 * Phase 4b Finisher Doctor — Automatic HMR cleanup & listener capture
 * Non-destructive, AST-based, idempotent transforms
 *
 * What it does
 *  - Rewrites BeatBus.on/once(...) to capture unsubscribe returns
 *  - Converts anonymous callbacks to named const handlers (in-scope, preserving closure)
 *  - Captures DOM addEventListener(...) and generates matching removeEventListener(...) cleanups
 *  - Adds or augments an HMR dispose() that drains a per-module disposer array
 *  - Backs up each patched file to <file>.bak and tags all edits with @doctor:4b markers
 *
 * Usage
 *  DRY RUN:  node scripts/phase4b-finisher-doctor.cjs
 *  WRITE:    node scripts/phase4b-finisher-doctor.cjs --write
 *  VERBOSE:  node scripts/phase4b-finisher-doctor.cjs --write --verbose
 *  FOCUS:    node scripts/phase4b-finisher-doctor.cjs --write --focus=OpeningSequence.jsx,ConsciousnessEngine.js,ConsciousnessTheater.jsx
 *  ALL:      node scripts/phase4b-finisher-doctor.cjs --write --all
 *
 * Safe guards
 *  - .bak backup per file
 *  - Idempotent (detects markers and existing disposers/HMR blocks)
 *  - Skips complex/unsafe call sites and leaves a precise TODO marker
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;

// ---- CLI / Config ----------------------------------------------------------

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const OPTS = new Map(process.argv.slice(2).map(a => {
  const [k, v] = a.split('=');
  return [k, v === undefined ? true : v];
}));

const WRITE   = OPTS.has('--write');
const VERBOSE = OPTS.has('--verbose');
const DO_ALL  = OPTS.has('--all');
const FOCUS   = OPTS.get('--focus'); // comma-separated filenames (partial match ok)

const ARTIFACTS = path.join(ROOT, 'doctor_artifacts');
if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS);

const log = (...a) => VERBOSE && console.log('[4b-finisher]', ...a);
const info = (...a) => console.log('ℹ️ ', ...a);
const ok = (...a) => console.log('✅', ...a);
const warn = (...a) => console.log('⚠️ ', ...a);
const err = (...a) => console.error('❌', ...a);

// Prefer using previous 4b findings if present, to prioritize targets
let findings = null;
try {
  findings = JSON.parse(fs.readFileSync(path.join(ARTIFACTS, '4b-findings.json'), 'utf8'));
} catch (_) {}

// Default focus = top 3 leakers from prior findings
let defaultFocus = [];
if (findings?.topLeaks?.length) {
  defaultFocus = findings.topLeaks
    .slice(0, 3)
    .map(l => l.path);
}

// Build focus set
const focusList = (FOCUS && String(FOCUS).split(',').map(s => s.trim()).filter(Boolean)) || defaultFocus;
const focusSet = new Set(focusList);

// Helper: gather files
function listSourceFiles() {
  const files = [];
  function walk(d) {
    for (const name of fs.readdirSync(d)) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      const p = path.join(d, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(m?jsx?|tsx?)$/.test(name)) files.push(p);
    }
  }
  walk(SRC);
  return files;
}

// ---- Utilities -------------------------------------------------------------

function parse(code, filename) {
  return parser.parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'classProperties',
      'decorators-legacy',
      'optionalChaining',
      'nullishCoalescingOperator',
      'dynamicImport'
    ],
    sourceFilename: filename
  });
}

function lastImportIndex(body) {
  let i = -1;
  for (let idx = 0; idx < body.length; idx++) {
    if (t.isImportDeclaration(body[idx])) i = idx;
  }
  return i;
}

function ensureDisposersArray(ast) {
  const body = ast.program.body;
  const has = body.some(n =>
    t.isVariableDeclaration(n) &&
    n.leadingComments?.some(c => /@doctor:4b-disposers/.test(c.value)) ||
    n.declarations?.some(d => t.isIdentifier(d.id, { name: '__doctorDisposers' }))
  );
  if (has) return; // already present

  const decl = t.variableDeclaration('const', [
    t.variableDeclarator(
      t.identifier('__doctorDisposers'),
      t.arrayExpression([])
    )
  ]);
  decl.leadingComments = [{ type: 'CommentLine', value: ' @doctor:4b-disposers' }];

  const idx = lastImportIndex(body);
  body.splice(idx + 1, 0, decl);
}

function makeHandlerName(counter) {
  return `__doctor_handler_${counter}`;
}
function makeUnsubName(counter) {
  return `__doctor_unsub_${counter}`;
}

function isBeatBusLike(calleeObjName) {
  if (!calleeObjName) return false;
  // permissive: support bus, BeatBus, globalThis.BeatBus, window.BeatBus, rendererBridge.bus, etc.
  return /(^|\.)(BeatBus|bus)$/i.test(calleeObjName) || /BeatBus|bus/i.test(calleeObjName);
}

function objectName(node) {
  if (t.isIdentifier(node)) return node.name;
  if (t.isThisExpression(node)) return 'this';
  if (t.isMemberExpression(node)) {
    const left = objectName(node.object);
    const right = t.isIdentifier(node.property) ? node.property.name : (node.property.value ?? '');
    return `${left}.${right}`;
  }
  return null;
}

function ensureHMRDisposeDrain(ast) {
  let hasHMR = false;
  traverse(ast, {
    IfStatement(p) {
      const tnode = p.node.test;
      // detect import.meta?.hot or import.meta.hot
      const isMeta =
        (t.isMemberExpression(tnode) && t.isMetaProperty(tnode.object) && tnode.property.name === 'hot') ||
        (t.isMemberExpression(tnode) && t.isMemberExpression(tnode.object) && t.isMetaProperty(tnode.object.object));
      if (!isMeta) return;

      hasHMR = true;
      const block = p.node.consequent.type === 'BlockStatement'
        ? p.node.consequent
        : (p.node.consequent = t.blockStatement([p.node.consequent]));

      // does it have a dispose callback?
      const hasDispose = block.body.some(stmt =>
        t.isExpressionStatement(stmt) &&
        t.isCallExpression(stmt.expression) &&
        t.isMemberExpression(stmt.expression.callee) &&
        stmt.expression.callee.property?.name === 'dispose'
      );

      const drainStmt = t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            t.identifier('__doctorDisposers'),
            t.identifier('splice')
          ),
          [t.numericLiteral(0)]
        )
      );

      const forEachStmt = t.expressionStatement(
        t.callExpression(
          t.memberExpression(
            drainStmt.expression, // __doctorDisposers.splice(0)
            t.identifier('forEach')
          ),
          [t.arrowFunctionExpression(
            [t.identifier('fn')],
            t.blockStatement([
              t.tryStatement(
                t.blockStatement([
                  t.expressionStatement(
                    t.optionalCallExpression
                      ? t.optionalCallExpression(t.identifier('fn'), [], true)
                      : t.callExpression(t.identifier('fn'), [])
                  )
                ]),
                t.catchClause(
                  t.identifier('e'),
                  t.blockStatement([
                    t.expressionStatement(
                      t.callExpression(
                        t.memberExpression(t.identifier('console'), t.identifier('error')),
                        [t.stringLiteral('@doctor:4b dispose error'), t.identifier('e')]
                      )
                    )
                  ])
                )
              )
            ])
          )]
        )
      );

      const drainBlock = t.blockStatement([
        // __doctorDisposers.splice(0).forEach(fn => { try { fn?.(); } catch(e){...} });
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.callExpression(
                t.memberExpression(t.identifier('__doctorDisposers'), t.identifier('splice')),
                [t.numericLiteral(0)]
              ),
              t.identifier('forEach')
            ),
            [t.arrowFunctionExpression(
              [t.identifier('fn')],
              t.blockStatement([
                t.tryStatement(
                  t.blockStatement([
                    // fn?.()
                    t.expressionStatement(
                      t.optionalCallExpression
                        ? t.optionalCallExpression(t.identifier('fn'), [], true)
                        : t.callExpression(t.identifier('fn'), [])
                    )
                  ]),
                  t.catchClause(
                    t.identifier('e'),
                    t.blockStatement([
                      t.expressionStatement(
                        t.callExpression(
                          t.memberExpression(t.identifier('console'), t.identifier('error')),
                          [t.stringLiteral('@doctor:4b dispose error'), t.identifier('e')]
                        )
                      )
                    ])
                  )
                )
              ])
            )]
          )
        )
      ]);

      if (hasDispose) {
        // augment existing dispose: append drainBlock to its callback body
        block.body.forEach(stmt => {
          if (
            t.isExpressionStatement(stmt) &&
            t.isCallExpression(stmt.expression) &&
            t.isMemberExpression(stmt.expression.callee) &&
            stmt.expression.callee.property?.name === 'dispose'
          ) {
            const cb = stmt.expression.arguments[0];
            if (t.isArrowFunctionExpression(cb) || t.isFunctionExpression(cb)) {
              if (t.isBlockStatement(cb.body)) {
                // avoid injecting twice
                const already = generate(cb.body).code.includes('@doctor:4b-drain');
                if (!already) {
                  cb.body.body.push(
                    t.expressionStatement(t.stringLiteral('@doctor:4b-drain')),
                    ...drainBlock.body
                  );
                }
              }
            }
          }
        });
      } else {
        // add new dispose with drain
        block.body.push(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.memberExpression(
                  t.memberExpression(t.identifier('import'), t.identifier('meta')),
                  t.identifier('hot')
                ),
                t.identifier('dispose')
              ),
              [t.arrowFunctionExpression(
                [],
                t.blockStatement([
                  t.expressionStatement(t.stringLiteral('@doctor:4b-drain')),
                  ...drainBlock.body
                ])
              )]
            )
          )
        );
      }
    }
  });

  if (hasHMR) return;

  // If no HMR guard existed, add one with accept + dispose
  const guard = parse(
`// @doctor:4b-hmr
if (import.meta?.hot) {
  import.meta.hot.accept?.();
  import.meta.hot.dispose?.(() => {
    '@doctor:4b-drain';
    __doctorDisposers.splice(0).forEach(fn => { try { fn?.(); } catch (e) { console.error('@doctor:4b dispose error', e); } });
  });
}`, 'hmr.js');

  // insert at end
  ast.program.body.push(...guard.program.body);
}

// Helper: insert node before the statement containing path
function insertBeforeStatement(path, node) {
  const stmt = path.getStatementParent();
  if (stmt) stmt.insertBefore(node);
  else path.insertBefore(node);
}

// Helper: replace standalone call with decl + push
function replaceStandaloneCallWithCapture(path, unsubId) {
  const stmt = path.getStatementParent();
  if (!stmt || !t.isExpressionStatement(stmt.node)) return false;

  const decl = t.variableDeclaration('const', [
    t.variableDeclarator(unsubId, stmt.node.expression)
  ]);
  decl.leadingComments = [{ type: 'CommentLine', value: ' @doctor:4b-capture' }];

  const push = t.expressionStatement(
    t.callExpression(
      t.memberExpression(t.identifier('__doctorDisposers'), t.identifier('push')),
      [unsubId]
    )
  );

  stmt.replaceWithMultiple([decl, push]);
  return true;
}

// ---- Transform -------------------------------------------------------------

function transformFile(fullPath) {
  const code = fs.readFileSync(fullPath, 'utf8');
  const rel = path.relative(ROOT, fullPath);

  // Skip files outside focus unless --all
  if (!DO_ALL && focusSet.size && ![...focusSet].some(f => rel.includes(f))) {
    return { file: rel, skipped: true };
  }

  let ast;
  try {
    ast = parse(code, rel);
  } catch (e) {
    warn(`Parse failed ${rel}: ${e.message.split('\n')[0]}`);
    return { file: rel, error: 'parse' };
  }

  let edits = 0;
  let counter = 1;
  let hasDisposers = false;

  // quick idempotency: if file already has @doctor:4b markers and not asked to repair, we still allow augment (HMR drain)
  if (code.includes('__doctorDisposers')) hasDisposers = true;

  traverse(ast, {
    Program: {
      enter(p) {
        ensureDisposersArray(ast);
        edits += hasDisposers ? 0 : 1;
        hasDisposers = true;
      },
      exit(p) {
        ensureHMRDisposeDrain(ast);
      }
    },

    CallExpression(path) {
      const { node } = path;
      if (!t.isMemberExpression(node.callee)) return;

      const method = node.callee.property?.name;
      const objName = objectName(node.callee.object);

      // --- BeatBus on/once capturing ---
      if ((method === 'on' || method === 'once') && (isBeatBusLike(objName) || t.isStringLiteral(node.arguments?.[0]))) {
        // Already captured? if parent assigns to variable or pushes into disposers, skip.
        if (t.isVariableDeclarator(path.parent) || t.isAssignmentExpression(path.parent)) return;
        const parentStmt = path.getStatementParent();
        if (!parentStmt || !t.isExpressionStatement(parentStmt.node)) {
          // Not a plain statement (e.g., used in expression). Too risky—leave TODO once.
          if (!generate(parentStmt.node).code.includes('@doctor:4b-todo-capture')) {
            insertBeforeStatement(path, t.expressionStatement(
              t.stringLiteral(`@doctor:4b-todo-capture: capture unsubscribe for ${method}()`)));
            edits++;
          }
          return;
        }

        // Ensure handler is a referenceable identifier (convert anonymous)
        if (node.arguments.length >= 2) {
          const handlerArg = node.arguments[1];
          if (t.isFunctionExpression(handlerArg) || t.isArrowFunctionExpression(handlerArg)) {
            const hname = makeHandlerName(counter++);
            const hdecl = t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier(hname), handlerArg)
            ]);
            hdecl.leadingComments = [{ type: 'CommentLine', value: ' @doctor:4b-handler' }];
            insertBeforeStatement(path, hdecl);
            node.arguments[1] = t.identifier(hname);
            edits++;
          }
        }

        // Replace call with `const __doctor_unsub_X = call; __doctorDisposers.push(__doctor_unsub_X);`
        const unsubId = t.identifier(makeUnsubName(counter++));
        const replaced = replaceStandaloneCallWithCapture(path, unsubId);
        if (replaced) edits++;
        return;
      }

      // --- DOM addEventListener capture ---
      if (method === 'addEventListener') {
        const parentStmt = path.getStatementParent();
        if (!parentStmt || !t.isExpressionStatement(parentStmt.node)) return;

        const [eventArg, handlerArg, optsArg] = node.arguments;

        // require an event type and handler
        if (!eventArg || !handlerArg) return;

        // Ensure handler is identifier (convert anonymous)
        let handlerIdent = handlerArg;
        if (t.isFunctionExpression(handlerArg) || t.isArrowFunctionExpression(handlerArg)) {
          const hname = makeHandlerName(counter++);
          const hdecl = t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier(hname), handlerArg)
          ]);
          hdecl.leadingComments = [{ type: 'CommentLine', value: ' @doctor:4b-handler-dom' }];
          insertBeforeStatement(path, hdecl);
          handlerIdent = t.identifier(hname);
          node.arguments[1] = handlerIdent;
          edits++;
        } else if (!t.isIdentifier(handlerArg)) {
          // complex expression handler, too risky—add TODO and skip
          insertBeforeStatement(path, t.expressionStatement(
            t.stringLiteral(`@doctor:4b-todo-dom: non-identifier handler; manual cleanup required`)));
          edits++;
          return;
        }

        // Push disposer: () => target.removeEventListener(event, handler, opts?)
        const removeCall = t.callExpression(
          t.memberExpression(node.callee.object, t.identifier('removeEventListener')),
          optsArg ? [eventArg, handlerIdent, optsArg] : [eventArg, handlerIdent]
        );
        const disposerFn = t.arrowFunctionExpression([], t.blockStatement([
          t.expressionStatement(removeCall)
        ]));
        const pushDispose = t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.identifier('__doctorDisposers'), t.identifier('push')),
            [disposerFn]
          )
        );
        insertBeforeStatement(path, pushDispose);
        edits++;
      }
    }
  });

  if (edits === 0) {
    log('No edits needed:', rel);
    return { file: rel, edits: 0 };
  }

  const out = generate(ast, { retainLines: true }, code).code;

  if (!WRITE) {
    log('DRY RUN (not writing):', rel);
    return { file: rel, edits };
  }

  // Non-destructive write with backup
  const bak = `${fullPath}.bak`;
  try { if (!fs.existsSync(bak)) fs.copyFileSync(fullPath, bak); } catch (_) {}
  fs.writeFileSync(fullPath, out, 'utf8');
  ok('Patched', rel, `(edits=${edits})`);
  return { file: rel, edits, written: true, backup: path.basename(bak) };
}

// ---- Main ------------------------------------------------------------------

(async function main() {
  console.log('🚀 Phase 4b Finisher Doctor — HMR cleanup & listener capture');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN'} | All: ${DO_ALL ? 'yes' : 'no'} | Focus: ${focusList.join(', ') || '(auto top-leakers)'}`);
  console.log('');

  const files = listSourceFiles();
  const results = [];
  for (const f of files) {
    try {
      const r = transformFile(f);
      if (r) results.push(r);
    } catch (e) {
      err('Fatal on file:', f, e.message);
      results.push({ file: path.relative(ROOT, f), error: e.message });
    }
  }

  // Summaries
  const touched = results.filter(r => r?.edits > 0);
  const written = touched.filter(r => r.written);
  const skipped = results.filter(r => r?.skipped);

  const summary = {
    mode: WRITE ? 'WRITE' : 'DRY',
    totalFiles: files.length,
    considered: results.length - skipped.length,
    skipped: skipped.length,
    touched: touched.length,
    written: written.length,
    focus: [...focusSet],
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(path.join(ARTIFACTS, '4b-finisher-summary.json'), JSON.stringify({ summary, results }, null, 2), 'utf8');

  console.log('\n📊 Summary');
  console.log(`  Considered: ${summary.considered}`);
  console.log(`  Touched:    ${summary.touched}`);
  console.log(`  Written:    ${summary.written}`);
  console.log(`  Skipped:    ${summary.skipped}`);
  console.log(`  Artifacts:  ${path.relative(ROOT, ARTIFACTS)}/4b-finisher-summary.json`);

  // Generate a verification helper (browser console)
  const verify = `
// 4b Finisher Verification — Run in browser console after dev server starts

console.log('=== 4b Finisher Verification ===');
const info = window.BeatBus?.getDebugInfo?.();
console.log('BeatBus debug:', info || '(no getDebugInfo)');

let c = 0;
const h = () => c++;
const off = window.BeatBus?.on?.('FINISHER_TEST', h);
window.BeatBus?.emit?.('FINISHER_TEST', {});
setTimeout(() => {
  console.log('Handler fired count (expect 1):', c);
  off?.();
  console.log('Now make a small code edit to trigger HMR, then run this again — counts should not grow.');
}, 100);
console.log('=== end ===');
`;
  fs.writeFileSync(path.join(ARTIFACTS, '4b-finisher-verify.js'), verify, 'utf8');

  // Exit codes
  if (results.some(r => r.error)) process.exit(2);
  process.exit(0);
})();

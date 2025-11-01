import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import { walk } from './lib/walk.mjs';

const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });

const SUPPORTED_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

const parserOptions = {
  sourceType: 'module',
  allowAwaitOutsideFunction: true,
  allowReturnOutsideFunction: true,
  allowImportExportEverywhere: true,
  errorRecovery: true,
  plugins: [
    'jsx',
    'typescript',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'dynamicImport',
    'decorators-legacy',
    'importMeta',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'logicalAssignment',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'optionalChaining',
    'topLevelAwait'
  ]
};

const events = new Map();
const dynamicCalls = [];
const parseFailures = [];
let filesScanned = 0;

const visit = (node, enter) => {
  if (!node || typeof node.type !== 'string') return;
  enter(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') {
      continue;
    }
    const value = node[key];
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child.type === 'string') {
          visit(child, enter);
        }
      }
    } else if (typeof value.type === 'string') {
      visit(value, enter);
    }
  }
};

const getEventName = (arg) => {
  if (!arg) return { name: null, kind: 'missing' };
  switch (arg.type) {
    case 'StringLiteral':
      return { name: arg.value, kind: 'literal' };
    case 'TemplateLiteral':
      if (arg.expressions.length === 0 && arg.quasis.length === 1) {
        return { name: arg.quasis[0].value.cooked ?? '', kind: 'literal' };
      }
      return { name: null, kind: 'template' };
    default:
      return { name: null, kind: 'dynamic' };
  }
};

const recordEvent = (name, info) => {
  const bucket = events.get(name) || [];
  bucket.push(info);
  events.set(name, bucket);
};

for await (const file of walk('src')) {
  const ext = path.extname(file).toLowerCase();
  if (!SUPPORTED_EXTS.has(ext)) continue;
  const code = await fs.promises.readFile(file, 'utf8');
  filesScanned += 1;
  let ast;
  try {
    ast = parse(code, { ...parserOptions, sourceFilename: path.relative('.', file) });
  } catch (err) {
    parseFailures.push({ file, error: err.message });
    continue;
  }

  visit(ast, (node) => {
    if (node.type !== 'CallExpression' && node.type !== 'OptionalCallExpression') return;
    const callee = node.callee;
    if (!callee || callee.type !== 'Identifier' || callee.name !== 'trace') return;
    const first = node.arguments?.[0];
    const { name, kind } = getEventName(first);
    const loc = node.loc?.start ?? null;
    const info = {
      file,
      line: loc?.line ?? null,
      column: loc?.column != null ? loc.column + 1 : null
    };
    if (name) {
      recordEvent(name, { ...info, kind });
    } else {
      const snippet = first ? code.slice(first.start ?? 0, first.end ?? first.start ?? 0).trim() : '';
      dynamicCalls.push({
        ...info,
        expression: snippet || (first ? '<unprintable>' : '<no-arg>'),
        kind
      });
    }
  });
}

const sortedEvents = Array.from(events.keys()).sort((a, b) => a.localeCompare(b));
const literalCount = sortedEvents.reduce((acc, key) => acc + events.get(key).length, 0);
const summary = {
  filesScanned,
  uniqueEvents: sortedEvents.length,
  totalLiteralSites: literalCount,
  dynamicSites: dynamicCalls.length,
  parseFailures: parseFailures.length
};

const jsonOutput = {
  summary,
  events: Object.fromEntries(sortedEvents.map((name) => [name, events.get(name)])),
  dynamicCalls,
  parseFailures
};

const md = [];
md.push('# Trace Bus Report', '');
md.push(`- Files scanned: ${filesScanned}`);
md.push(`- Unique events: ${summary.uniqueEvents}`);
md.push(`- Literal trace sites: ${summary.totalLiteralSites}`);
md.push(`- Dynamic trace sites: ${summary.dynamicSites}`);
md.push(`- Parse failures: ${summary.parseFailures}`, '');

for (const name of sortedEvents) {
  const rows = events.get(name) || [];
  md.push(`## ${name}`);
  if (rows.length) {
    for (const entry of rows) {
      const line = entry.line != null ? `:${entry.line}` : '';
      md.push(`- \`${entry.file}${line}\``);
    }
  } else {
    md.push('- (none)');
  }
  md.push('');
}

if (dynamicCalls.length) {
  md.push('## Dynamic trace calls');
  for (const entry of dynamicCalls) {
    const line = entry.line != null ? `:${entry.line}` : '';
    const expr = entry.expression?.replace(/\s+/g, ' ').slice(0, 120);
    md.push(`- \`${entry.file}${line}\` → \`${expr}\``);
  }
  md.push('');
}

if (parseFailures.length) {
  md.push('## Parse failures');
  for (const entry of parseFailures) {
    md.push(`- \`${entry.file}\` → ${entry.error}`);
  }
  md.push('');
}

fs.writeFileSync(path.join(outDir, 'trace-bus.json'), JSON.stringify(jsonOutput, null, 2));
fs.writeFileSync(path.join(outDir, 'trace-bus.md'), md.join('\n'));
console.log('[trace-bus] wrote reports/trace-bus.{json,md}');

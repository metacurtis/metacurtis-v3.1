#!/usr/bin/env node
import fs from 'node:fs';

function patchFile(path, mut) {
  const src = fs.readFileSync(path, 'utf8');
  const out = mut(src);
  if (out !== src) {
    fs.writeFileSync(path + 

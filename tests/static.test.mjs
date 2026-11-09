import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');

test('all six main app pages are present',()=>{
  for(const page of ['home','path','words','cards','speak','lab'])assert.match(html,new RegExp(`id="page-${page}"`));
});

test('static entry point loads the required application assets',()=>{
  for(const asset of ['styles.css','data/words.js','ml-engine.js','app.js','manifest.webmanifest'])assert.ok(html.includes(asset));
});

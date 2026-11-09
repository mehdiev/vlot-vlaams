import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');

test('all seven main app pages are present and Path is removed',()=>{
  for(const page of ['home','words','cards','speak','video','quiz','lab'])assert.match(html,new RegExp(`id="page-${page}"`));
  assert.doesNotMatch(html,/id="page-path"/);
});

test('YouTube lesson and Anki-style controls are present',()=>{
  assert.match(html,/id="youtube-url"/);
  assert.match(html,/id="video-sentence-list"/);
  for(const label of ['Again','Hard','Good','Easy'])assert.ok(html.includes(`>${label}<`));
});

test('static entry point loads the required application assets',()=>{
  for(const asset of ['styles.css','data/words.js','ml-engine.js','app.js','manifest.webmanifest'])assert.ok(html.includes(asset));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../data/words.js',import.meta.url),'utf8');
const context={window:{}};
vm.runInNewContext(source,context);
const words=context.window.VLOT_WORDS;

test('dataset contains exactly 4,000 unique entries',()=>{
  assert.equal(words.length,4000);
  assert.equal(new Set(words.map(word=>word.word)).size,4000);
  assert.ok(words.every((word,index)=>word.rank===index+1));
});

test('every entry is complete enough to learn from',()=>{
  for(const word of words){
    assert.ok(word.id&&word.word&&word.meaning&&word.level&&word.category);
    assert.ok(word.example&&word.translation,`missing example for ${word.word}`);
    assert.ok(['A0','A1','A2','B1','B2','C1'].includes(word.level));
  }
});

test('curriculum bands and Belgian layer have expected sizes',()=>{
  const counts=Object.fromEntries(['A0','A1','A2','B1','B2','C1'].map(level=>[level,words.filter(word=>word.level===level).length]));
  assert.deepEqual(counts,{A0:250,A1:750,A2:1000,B1:800,B2:700,C1:500});
  assert.equal(words.filter(word=>word.variant==='Belgian Dutch').length,50);
});

test('most entries include dictionary IPA and authentic examples',()=>{
  assert.ok(words.filter(word=>word.ipa).length>=3300);
  assert.ok(words.filter(word=>word.exampleSource==='Tatoeba').length>=3000);
});

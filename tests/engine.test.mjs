import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const storage=new Map();
const context={window:{},console,Math,Date,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}};
vm.runInNewContext(fs.readFileSync(new URL('../ml-engine.js',import.meta.url),'utf8'),context);
const Engine=context.window.VlotLearningEngine;
const word={id:'test',word:'goesting',example:'Ik heb goesting in frieten.',level:'A1'};

test('adaptive engine records review and pronunciation signals',()=>{
  const engine=new Engine();
  const before=engine.predict(word);
  engine.record(word,3,1800);
  engine.recordPronunciation(word,86);
  const record=engine.recordFor(word);
  assert.equal(record.attempts,1);
  assert.equal(record.pronunciationAttempts,1);
  assert.equal(record.pronunciationAvg,86);
  assert.ok(engine.state.signals>=2);
  assert.notEqual(engine.predict(word),before);
});

test('dashboard and recommendation expose explainable results',()=>{
  const engine=new Engine();
  const other={id:'other',word:'amai',example:'Amai, dat is mooi!',level:'A0'};
  const recommendation=engine.recommendation([word,other]);
  assert.ok(recommendation.word);
  assert.ok(recommendation.reason.length>20);
  const dashboard=engine.dashboard([word,other]);
  assert.equal(typeof dashboard.signals,'number');
});

test('Anki-style learning steps begin at 1 minute, 10 minutes, 1 hour, and 4 days',()=>{
  const engine=new Engine();
  const freshWord={...word,id:'fresh-anki-card'};
  const intervals=engine.intervalPreviews(freshWord);
  assert.deepEqual([...intervals],[60000,600000,3600000,345600000]);
});

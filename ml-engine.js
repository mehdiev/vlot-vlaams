(function(){
  'use strict';

  const STORAGE_KEY = 'vlot_vlaams_adaptive_v1';
  const INPUTS = 7;
  const HIDDEN_1 = 9;
  const HIDDEN_2 = 5;
  const DAY = 86400000;
  const clamp = (value, min=0, max=1) => Math.max(min, Math.min(max, value));
  const sigmoid = value => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, value))));
  const tanhDerivative = value => 1 - value * value;

  function seededRandom(seed){
    let state = seed >>> 0;
    return function(){
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function matrix(rows, columns, random, scale){
    return Array.from({length:rows}, () => Array.from({length:columns}, () => (random() * 2 - 1) * scale));
  }

  function createWeights(){
    const random = seededRandom(11072003);
    return {
      w1:matrix(HIDDEN_1, INPUTS, random, Math.sqrt(2 / INPUTS)), b1:Array(HIDDEN_1).fill(0),
      w2:matrix(HIDDEN_2, HIDDEN_1, random, Math.sqrt(2 / HIDDEN_1)), b2:Array(HIDDEN_2).fill(0),
      w3:Array.from({length:HIDDEN_2}, () => (random() * 2 - 1) * Math.sqrt(2 / HIDDEN_2)), b3:0
    };
  }

  function freshState(){
    return {version:1, signals:0, words:{}, samples:[], weights:createWeights()};
  }

  class VlotLearningEngine {
    constructor(){ this.state = this.load(); }

    load(){
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved?.version === 1 && saved.weights && saved.words) return saved;
      } catch(error){ console.warn('The local learner model was reset.', error); }
      return freshState();
    }

    save(){
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); }
      catch(error){ console.warn('The local learner model could not be saved.', error); }
    }

    clear(){ this.state = freshState(); this.save(); }
    key(word){ return word.id || word.word; }

    recordFor(word){
      return this.state.words[this.key(word)] || {
        attempts:0, scoreSum:0, correct:0, lapses:0, avgMs:0, lastSeen:0,
        nextReview:0, intervalMs:0, pronunciationAttempts:0, pronunciationAvg:0
      };
    }

    features(word, record=this.recordFor(word), now=Date.now()){
      const attempts = clamp(Math.log1p(record.attempts) / Math.log(18));
      const accuracy = record.attempts ? record.scoreSum / record.attempts : .5;
      const timeAway = record.lastSeen ? clamp((now - record.lastSeen) / (10 * DAY)) : 1;
      const difficulty = clamp((String(word.word).length + String(word.example || '').split(/\s+/).length / 2) / 24);
      const speed = record.avgMs ? 1 - clamp((record.avgMs - 800) / 14000) : .5;
      const lapseRate = record.attempts ? clamp(record.lapses / record.attempts) : 0;
      const pronunciation = record.pronunciationAttempts ? clamp(record.pronunciationAvg / 100) : .55;
      return [attempts, accuracy, timeAway, difficulty, speed, lapseRate, pronunciation];
    }

    forward(input){
      const w = this.state.weights;
      const h1 = w.w1.map((row, index) => Math.tanh(row.reduce((sum, weight, i) => sum + weight * input[i], w.b1[index])));
      const h2 = w.w2.map((row, index) => Math.tanh(row.reduce((sum, weight, i) => sum + weight * h1[i], w.b2[index])));
      const output = sigmoid(w.w3.reduce((sum, weight, i) => sum + weight * h2[i], w.b3));
      return {h1,h2,output};
    }

    train(input, target, epochs=8){
      const w = this.state.weights;
      const rate = .026;
      for(let epoch=0; epoch<epochs; epoch++){
        const {h1,h2,output} = this.forward(input);
        const previousW3 = [...w.w3];
        const previousW2 = w.w2.map(row => [...row]);
        const deltaOutput = clamp(output - target, -1, 1);
        const deltaH2 = h2.map((value, i) => deltaOutput * previousW3[i] * tanhDerivative(value));
        const deltaH1 = h1.map((value, i) => deltaH2.reduce((sum, delta, j) => sum + delta * previousW2[j][i], 0) * tanhDerivative(value));
        w.w3 = w.w3.map((weight, i) => weight - rate * deltaOutput * h2[i]);
        w.b3 -= rate * deltaOutput;
        w.w2 = w.w2.map((row, i) => row.map((weight, j) => weight - rate * deltaH2[i] * h1[j]));
        w.b2 = w.b2.map((bias, i) => bias - rate * deltaH2[i]);
        w.w1 = w.w1.map((row, i) => row.map((weight, j) => weight - rate * deltaH1[i] * input[j]));
        w.b1 = w.b1.map((bias, i) => bias - rate * deltaH1[i]);
      }
    }

    heuristicRecall(record, now=Date.now()){
      if (!record.attempts) return .4;
      const accuracy = record.scoreSum / record.attempts;
      const interval = Math.max(record.intervalMs, 4 * 3600000);
      const elapsed = Math.max(0, now - record.lastSeen);
      const retention = Math.exp(-elapsed / (interval * 1.4));
      const speechLift = record.pronunciationAttempts ? (record.pronunciationAvg / 100 - .5) * .08 : 0;
      return clamp((accuracy * .72 + retention * .28 + speechLift) * (1 - Math.min(record.lapses * .03, .2)), .03, .98);
    }

    predict(word, now=Date.now()){
      const record = this.recordFor(word);
      const neural = this.forward(this.features(word, record, now)).output;
      const heuristic = this.heuristicRecall(record, now);
      const neuralWeight = Math.min(.76, this.state.signals / 55);
      return clamp(heuristic * (1 - neuralWeight) + neural * neuralWeight, .02, .99);
    }

    record(word, quality, responseMs=4000){
      const now = Date.now();
      const key = this.key(word);
      const record = {...this.recordFor(word)};
      const before = {...record};
      const targets = [0,.42,.82,1];
      const target = targets[quality] ?? 0;
      record.attempts += 1;
      record.scoreSum += target;
      if (quality >= 2) record.correct += 1;
      if (quality === 0) record.lapses += 1;
      const measured = clamp(responseMs || 4000, 500, 30000);
      record.avgMs = record.avgMs ? record.avgMs * .72 + measured * .28 : measured;
      record.lastSeen = now;
      const oldInterval = before.intervalMs || 0;
      const intervals = [45000, Math.max(10 * 60000, oldInterval * .55), Math.max(12 * 3600000, oldInterval * 1.75), Math.max(3 * DAY, oldInterval * 2.5)];
      record.intervalMs = intervals[quality];
      record.nextReview = now + record.intervalMs;
      this.state.words[key] = record;
      this.state.signals += 1;
      const sample = {x:this.features(word, before, now), y:target};
      this.state.samples.push(sample);
      if (this.state.samples.length > 260) this.state.samples.shift();
      this.train(sample.x, sample.y, 12);
      const replayCount = Math.min(4, this.state.samples.length - 1);
      for(let i=0; i<replayCount; i++){
        const replay = this.state.samples[Math.floor(Math.random() * this.state.samples.length)];
        this.train(replay.x, replay.y, 2);
      }
      this.save();
      return record;
    }

    recordPronunciation(word, score){
      const key = this.key(word);
      const record = {...this.recordFor(word)};
      record.pronunciationAttempts += 1;
      record.pronunciationAvg = record.pronunciationAttempts === 1
        ? score
        : record.pronunciationAvg * .72 + score * .28;
      this.state.words[key] = record;
      this.state.signals += 1;
      this.save();
      return record;
    }

    recommendation(words, excludeKey=''){
      const now = Date.now();
      const ranked = words
        .filter(word => this.key(word) !== excludeKey)
        .map(word => {
          const record = this.recordFor(word);
          const recall = this.predict(word, now);
          const overdue = record.nextReview ? clamp((now - record.nextReview) / (3 * DAY), 0, 1) : 0;
          const exploration = record.attempts ? 0 : .19;
          const speechNeed = record.pronunciationAttempts && record.pronunciationAvg < 70 ? .07 : 0;
          const levelWeight = word.rank <= 300 ? .035 : 0;
          const score = (1 - recall) * .6 + overdue * .25 + exploration + speechNeed + levelWeight + Math.random() * .025;
          return {word,record,recall,overdue,score};
        })
        .sort((a,b) => b.score - a.score);
      const choice = ranked[0];
      if (!choice) return null;
      let reason;
      if (!choice.record.attempts) reason = `New-word exploration · this ${choice.word.level} word will help the model learn your starting point.`;
      else if (choice.record.nextReview <= now) reason = `Scheduled review · estimated recall is ${Math.round(choice.recall * 100)}% and the item is due now.`;
      else if (choice.record.lapses) reason = `Weak-memory signal · ${choice.record.lapses} lapse${choice.record.lapses === 1 ? '' : 's'} detected, with ${Math.round(choice.recall * 100)}% predicted recall.`;
      else if (choice.record.pronunciationAttempts && choice.record.pronunciationAvg < 70) reason = `Speech signal · recall is developing, but the pronunciation match averages ${Math.round(choice.record.pronunciationAvg)}%.`;
      else reason = `Useful uncertainty · ${Math.round(choice.recall * 100)}% predicted recall makes this a productive review.`;
      return {...choice,reason};
    }

    dashboard(words){
      const now = Date.now();
      const practiced = words.filter(word => this.recordFor(word).attempts > 0);
      const pronunciation = words.map(word => this.recordFor(word)).filter(record => record.pronunciationAttempts > 0);
      const recall = practiced.length ? practiced.reduce((sum, word) => sum + this.predict(word, now), 0) / practiced.length : null;
      const due = words.filter(word => { const r=this.recordFor(word); return r.attempts && r.nextReview <= now; }).length;
      const mastered = practiced.filter(word => { const r=this.recordFor(word); return r.attempts >= 2 && this.predict(word, now) >= .78; }).length;
      const speechAverage = pronunciation.length ? pronunciation.reduce((sum, record) => sum + record.pronunciationAvg, 0) / pronunciation.length : null;
      return {signals:this.state.signals, practiced:practiced.length, mastered, recall, due, speechAverage};
    }
  }

  window.VlotLearningEngine = VlotLearningEngine;
})();

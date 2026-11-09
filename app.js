(function(){
  'use strict';

  const WORDS = window.VLOT_WORDS || [];
  const engine = new window.VlotLearningEngine();
  const STATS_KEY = 'vlot_vlaams_stats_v1';
  const LEVELS = [
    {code:'A0',title:'First contact',description:'Pronouns, greetings, tiny questions, and the words that hold a sentence together.',goal:'Survive your first simple exchange.'},
    {code:'A1',title:'Daily essentials',description:'People, time, home, food, routines, and direct everyday requests.',goal:'Handle predictable daily situations.'},
    {code:'A2',title:'Independent basics',description:'Describe experiences, make plans, solve small problems, and follow short conversations.',goal:'Keep a practical conversation moving.'},
    {code:'B1',title:'Connected conversation',description:'Explain reasons, tell stories, express feelings, and manage life in Flanders.',goal:'Speak in connected, useful sentences.'},
    {code:'B2',title:'Flexible expression',description:'More precise verbs, descriptions, opinions, and faster real-world listening.',goal:'Discuss familiar topics with confidence.'},
    {code:'C1',title:'Nuance starter',description:'Abstract vocabulary, subtle connectors, Belgian institutions, and richer phrasing.',goal:'Build the core needed for nuanced study.'}
  ];

  const DIALOGUES = [
    {kicker:'A0 · FIRST MEETING',title:'Meeting someone in Leuven',lines:[['A','Goeiedag! Ik ben Noor. Hoe heet gij?','Hello! I’m Noor. What is your name?'],['B','Ik ben Mehdi. Aangenaam.','I’m Mehdi. Nice to meet you.'],['A','Vanwaar zijt ge?','Where are you from?'],['B','Ik kom uit Marokko, maar ik studeer hier.','I’m from Morocco, but I study here.']]},
    {kicker:'A1 · BAKERY',title:'Sunday at the bakery',lines:[['A','Goeiemorgen. Wat mag het zijn?','Good morning. What would you like?'],['B','Vier pistolets en twee koffiekoeken, alstublieft.','Four bread rolls and two pastries, please.'],['A','Nog iets anders?','Anything else?'],['B','Nee, merci. Hoeveel is het?','No, thanks. How much is it?']]},
    {kicker:'A1 · CAFÉ',title:'Ordering a drink',lines:[['A','Wat wilt ge drinken?','What would you like to drink?'],['B','Voor mij een koffie en een fruitsap.','A coffee and a fruit juice for me.'],['A','Met melk of zonder?','With milk or without?'],['B','Met een beetje melk, graag.','With a little milk, please.']]},
    {kicker:'A2 · TRAIN',title:'Asking about a connection',lines:[['A','Excuseer, rijdt deze trein naar Antwerpen?','Excuse me, does this train go to Antwerp?'],['B','Ja, maar ge moet in Mechelen overstappen.','Yes, but you have to change in Mechelen.'],['A','Hoe laat komen we daar aan?','What time do we arrive there?'],['B','Normaal om kwart voor drie.','Normally at a quarter to three.']]},
    {kicker:'A2 · STUDENT LIFE',title:'Looking for a student room',lines:[['A','Is het kot nog vrij?','Is the student room still available?'],['B','Ja. Het ligt vlak bij de universiteit.','Yes. It is close to the university.'],['A','Zijn de kosten inbegrepen?','Are the costs included?'],['B','Water wel, maar elektriciteit niet.','Water is, but electricity is not.']]},
    {kicker:'B1 · DOCTOR',title:'At the doctor’s office',lines:[['A','Wat kan ik voor u doen?','What can I do for you?'],['B','Ik voel me al drie dagen niet goed.','I haven’t felt well for three days.'],['A','Hebt ge koorts of keelpijn?','Do you have a fever or a sore throat?'],['B','Vooral keelpijn en ik ben heel moe.','Mainly a sore throat, and I’m very tired.']]},
    {kicker:'B1 · WORK',title:'A first day at work',lines:[['A','Welkom in het team. Ik toon u eerst het kantoor.','Welcome to the team. I’ll first show you the office.'],['B','Merci. Bij wie kan ik terecht met vragen?','Thanks. Who can I go to with questions?'],['A','Vraag het gerust aan mij of aan Lotte.','Feel free to ask me or Lotte.'],['B','Perfect, dan weet ik wat te doen.','Perfect, then I know what to do.']]},
    {kicker:'B1 · SHOPPING',title:'During the sales',lines:[['A','Is deze jas nog beschikbaar in een andere maat?','Is this jacket still available in another size?'],['B','Ik kijk even in het magazijn.','I’ll quickly check in the stockroom.'],['A','Prima, want tijdens de solden gaat alles rap.','Great, because during the sales everything goes quickly.'],['B','Ik heb nog één maat groter gevonden.','I found one size larger.']]},
    {kicker:'B1 · FRITUUR',title:'Ordering Belgian fries',lines:[['A','Voor mij een grote friet met mayonaise.','A large fries with mayonnaise for me.'],['B','Wilt ge daar een snack bij?','Would you like a snack with that?'],['A','Ja, een kaaskroket, alstublieft.','Yes, a cheese croquette, please.'],['B','Dat is samen negen euro twintig.','That is nine euros twenty altogether.']]},
    {kicker:'B2 · DIRECTIONS',title:'Finding the right building',lines:[['A','Weet u waar het onthaal van het ziekenhuis is?','Do you know where the hospital reception is?'],['B','Ga rechtdoor tot aan het rondpunt.','Go straight ahead to the roundabout.'],['A','En daarna?','And after that?'],['B','Neem de tweede afslag. De ingang is aan uw rechterkant.','Take the second exit. The entrance is on your right.']]},
    {kicker:'B2 · PHONE',title:'Changing an appointment',lines:[['A','Goeiedag, ik bel om mijn afspraak te verplaatsen.','Hello, I’m calling to move my appointment.'],['B','Geen probleem. Wanneer past het voor u?','No problem. When suits you?'],['A','Donderdag in de namiddag, als dat mogelijk is.','Thursday afternoon, if that is possible.'],['B','Ik heb nog plaats om halfvier.','I still have an opening at half past three.']]},
    {kicker:'C1 · ADMINISTRATION',title:'Explaining a document problem',lines:[['A','Mijn dossier blijkt nog onvolledig te zijn.','My file appears to be incomplete.'],['B','Welk document ontbreekt er precies?','Which document is missing exactly?'],['A','Volgens de brief moet ik een bijkomend attest indienen.','According to the letter, I must submit an additional certificate.'],['B','Bezorg het ons digitaal; dan verwittigen we u zodra alles verwerkt is.','Send it to us digitally; then we’ll notify you as soon as everything is processed.']]}
  ];

  let stats = loadStats();
  let currentPage = 'home';
  let wordsPage = 1;
  let currentCard = null;
  let currentCardStarted = Date.now();
  let currentLabChoice = null;
  let repeatWord = null;
  let coachWord = null;
  let selectedDialogue = 0;
  let voices = [];
  const session = {reviewed:0, remembered:0, xp:0, target:10};

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const todayKey = () => new Intl.DateTimeFormat('en-CA',{timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone}).format(new Date());
  const yesterdayKey = () => {
    const date = new Date(); date.setDate(date.getDate() - 1);
    return new Intl.DateTimeFormat('en-CA',{timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone}).format(date);
  };

  function loadStats(){
    try {
      return {...{streak:0,lastDate:'',dailyDate:'',dailyCount:0,totalRatings:0,xp:0,speechScores:[]},...JSON.parse(localStorage.getItem(STATS_KEY) || '{}')};
    } catch { return {streak:0,lastDate:'',dailyDate:'',dailyCount:0,totalRatings:0,xp:0,speechScores:[]}; }
  }
  function saveStats(){ localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }
  function resetDailyIfNeeded(){ if (stats.dailyDate !== todayKey()){ stats.dailyDate=todayKey(); stats.dailyCount=0; saveStats(); } }
  function touchStreak(){
    const today=todayKey();
    if (stats.lastDate !== today){ stats.streak = stats.lastDate === yesterdayKey() ? stats.streak + 1 : 1; stats.lastDate=today; }
    saveStats();
  }
  function effectiveStreak(){ return stats.lastDate === todayKey() || stats.lastDate === yesterdayKey() ? stats.streak : 0; }
  function escapeHtml(value){ return String(value ?? '').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
  function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2200); }

  function setPage(name, updateHash=true){
    if (!document.getElementById(`page-${name}`)) name='home';
    currentPage=name;
    $$('.page').forEach(page=>page.classList.toggle('active',page.id===`page-${name}`));
    $$('.nav-item,.mobile-nav-item').forEach(item=>item.classList.toggle('active',item.dataset.page===name));
    if (updateHash) history.replaceState(null,'',`#${name}`);
    window.scrollTo({top:0,behavior:'smooth'});
    if (name==='home') renderHome();
    if (name==='path') renderPath();
    if (name==='words') renderWords();
    if (name==='cards') showNextCard();
    if (name==='speak') renderSpeak();
    if (name==='lab') renderLab();
  }

  function dashboard(){ return engine.dashboard(WORDS); }
  function currentLevel(){
    for (const level of LEVELS){
      const levelWords=WORDS.filter(word=>word.level===level.code);
      const mastered=levelWords.filter(word=>{const record=engine.recordFor(word);return record.attempts>=2&&engine.predict(word)>=.78;}).length;
      if (mastered < Math.ceil(levelWords.length*.45)) return level.code;
    }
    return 'C1';
  }

  function renderHome(){
    resetDailyIfNeeded();
    const data=dashboard();
    $('#header-streak').textContent=effectiveStreak();
    $('#today-date').textContent=new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date());
    $('#daily-count').textContent=Math.min(stats.dailyCount,10);
    $('#daily-ring').style.strokeDashoffset=314*(1-Math.min(stats.dailyCount/10,1));
    $('#home-due').textContent=`${data.due} word${data.due===1?'':'s'}`;
    $('#home-practiced').textContent=data.practiced;
    $('#home-mastered').textContent=data.mastered;
    $('#home-pronunciation').textContent=data.speechAverage===null?'—':`${Math.round(data.speechAverage)}%`;
    $('#home-level').textContent=currentLevel();
  }

  function renderPath(){
    const data=dashboard();
    const overall=Math.round(data.mastered/WORDS.length*100);
    $('#path-overall').textContent=`${overall}%`;
    $('#path-overall-bar').style.width=`${overall}%`;
    $('#level-stack').innerHTML=LEVELS.map(level=>{
      const levelWords=WORDS.filter(word=>word.level===level.code);
      const unitSize=50;
      const units=Math.ceil(levelWords.length/unitSize);
      const mastered=levelWords.filter(word=>{const record=engine.recordFor(word);return record.attempts>=2&&engine.predict(word)>=.78;}).length;
      const percent=Math.round(mastered/levelWords.length*100);
      const chips=Array.from({length:units},(_,index)=>{
        const subset=levelWords.slice(index*unitSize,(index+1)*unitSize);
        const attempts=subset.reduce((sum,word)=>sum+engine.recordFor(word).attempts,0);
        const strong=subset.filter(word=>engine.recordFor(word).attempts>=2&&engine.predict(word)>=.78).length;
        const state=strong>=Math.ceil(subset.length*.6)?'done':attempts?'active':'';
        return `<span class="unit-chip ${state}" title="Unit ${index+1}: ${strong}/${subset.length} strong">${index+1}</span>`;
      }).join('');
      return `<article class="level-card"><div class="level-code">${level.code}</div><div class="level-copy"><h2>${level.title}</h2><p>${level.description}<br><b>${level.goal}</b></p></div><div class="unit-track">${chips}</div><div class="level-percent"><strong>${percent}%</strong><span>strong</span></div></article>`;
    }).join('');
  }

  function wordFilters(){
    const query=$('#word-search').value.trim().toLocaleLowerCase('nl-BE');
    const level=$('#word-level').value;
    const category=$('#word-category').value;
    return WORDS.filter(word=>{
      const haystack=`${word.word} ${word.meaning} ${word.example} ${word.translation}`.toLocaleLowerCase('nl-BE');
      return (!query||haystack.includes(query))&&(level==='all'||word.level===level)&&(category==='all'||word.category===category);
    });
  }

  function renderWords(){
    const categories=[...new Set(WORDS.map(word=>word.category))].sort();
    if ($('#word-category').options.length===1) $('#word-category').insertAdjacentHTML('beforeend',categories.map(category=>`<option>${escapeHtml(category)}</option>`).join(''));
    const filtered=wordFilters();
    const perPage=16;
    const pages=Math.max(1,Math.ceil(filtered.length/perPage));
    wordsPage=Math.min(wordsPage,pages);
    const visible=filtered.slice((wordsPage-1)*perPage,wordsPage*perPage);
    $('#word-result-count').textContent=`${filtered.length.toLocaleString()} result${filtered.length===1?'':'s'}`;
    $('#word-list').innerHTML=visible.map(word=>{
      const belgian=word.variant==='Belgian Dutch';
      const note=belgian?`<div class="word-note"><b>Belgian usage</b><p>${escapeHtml(word.note)}${word.standard?` Neutral alternative: <strong>${escapeHtml(word.standard)}</strong>.`:''}</p></div>`:'<div></div>';
      return `<article class="word-row" data-word-id="${word.id}"><div class="word-summary"><span class="word-rank">#${word.rank}</span><div class="word-main"><b>${escapeHtml(word.word)}</b><small>${escapeHtml(word.ipa||'Pronunciation by audio')}</small></div><div class="word-meaning">${escapeHtml(word.meaning)}</div><span class="word-label ${belgian?'belgian':''}">${belgian?'Belgian Dutch':word.level+' · '+word.category}</span><button class="row-audio" data-speak-word="${word.id}" aria-label="Hear ${escapeHtml(word.word)}">)))</button></div><div class="word-details"><div class="word-example"><p>${escapeHtml(word.example)}</p><span>${escapeHtml(word.translation)}</span></div>${note}</div></article>`;
    }).join('')||'<div class="truth-note"><span class="truth-mark">i</span><div><strong>No matching words</strong><p>Try a broader search or clear one of the filters.</p></div></div>';
    const start=Math.max(1,Math.min(wordsPage-3,pages-6));
    const end=Math.min(pages,start+6);
    const buttons=[];
    if(wordsPage>1)buttons.push(`<button data-word-page="${wordsPage-1}">←</button>`);
    for(let page=start;page<=end;page++)buttons.push(`<button class="${page===wordsPage?'active':''}" data-word-page="${page}">${page}</button>`);
    if(wordsPage<pages)buttons.push(`<button data-word-page="${wordsPage+1}">→</button>`);
    $('#word-pagination').innerHTML=buttons.join('');
  }

  function adaptivePool(){
    const level=currentLevel();
    const levelIndex=LEVELS.findIndex(item=>item.code===level);
    const learningPool=WORDS.filter(word=>LEVELS.findIndex(item=>item.code===word.level)<=levelIndex);
    const dueOutside=WORDS.filter(word=>{const record=engine.recordFor(word);return record.attempts&&record.nextReview<=Date.now();});
    return [...new Map([...dueOutside,...learningPool].map(word=>[word.id,word])).values()];
  }
  function selectedCardPool(){
    const value=$('#card-level').value;
    if(value==='adaptive')return adaptivePool();
    if(value==='belgian')return WORDS.filter(word=>word.variant==='Belgian Dutch');
    return WORDS.filter(word=>word.level===value);
  }
  function showNextCard(){
    if(currentPage!=='cards')return;
    const pool=selectedCardPool();
    const choice=engine.recommendation(pool,currentCard?.id);
    currentCard=choice?.word||pool[Math.floor(Math.random()*pool.length)]||WORDS[0];
    currentCardStarted=Date.now();
    $('#flashcard').classList.remove('flipped');
    $('#card-level-badge').textContent=currentCard.level;
    $('#card-variant').textContent=currentCard.variant.toUpperCase();
    $('#card-word').textContent=currentCard.word;
    $('#card-ipa').textContent=currentCard.ipa||'Listen for pronunciation';
    $('#card-meaning').textContent=currentCard.meaning;
    $('#card-example').textContent=currentCard.example;
    $('#card-translation').textContent=currentCard.translation;
    $('#card-note').textContent=currentCard.note?(currentCard.standard?`${currentCard.note} Neutral alternative: ${currentCard.standard}.`:currentCard.note):'';
    $('#card-reason').textContent=choice?.reason||'A fresh card from your selected deck.';
    $$('#rating-row button').forEach(button=>button.disabled=true);
    renderSession();
  }
  function flipCard(){
    const flipped=$('#flashcard').classList.toggle('flipped');
    $$('#rating-row button').forEach(button=>button.disabled=!flipped);
  }
  function rateCard(quality){
    if(!currentCard||!$('#flashcard').classList.contains('flipped'))return;
    engine.record(currentCard,quality,Date.now()-currentCardStarted);
    touchStreak();resetDailyIfNeeded();
    stats.dailyCount+=1;stats.totalRatings+=1;stats.xp+=quality===0?2:quality===1?5:quality===2?8:12;saveStats();
    session.reviewed+=1;if(quality>=2)session.remembered+=1;session.xp+=quality===0?2:quality===1?5:quality===2?8:12;
    renderSession();renderHome();
    setTimeout(showNextCard,260);
  }
  function renderSession(){
    $('#card-session-count').textContent=`${Math.min(stats.dailyCount,10)} / 10 today`;
    $('#card-session-bar').style.width=`${Math.min(stats.dailyCount/10,1)*100}%`;
    $('#session-reviewed').textContent=session.reviewed;
    $('#session-accuracy').textContent=session.reviewed?`${Math.round(session.remembered/session.reviewed*100)}%`:'—';
    $('#session-xp').textContent=session.xp;
  }

  function loadVoices(){
    voices=speechSynthesis.getVoices();
    const voice=preferredVoice();
    if(voice){$('#voice-dot')?.classList.add('ready');if($('#voice-name'))$('#voice-name').textContent=voice.name;if($('#voice-detail'))$('#voice-detail').textContent=`${voice.lang} · ${voice.localService?'on this device':'browser service'}`;}
  }
  function preferredVoice(){
    return voices.find(voice=>voice.lang.toLowerCase()==='nl-be')||voices.find(voice=>/belg|flem/i.test(voice.name)&&voice.lang.toLowerCase().startsWith('nl'))||voices.find(voice=>voice.lang.toLowerCase().startsWith('nl'))||null;
  }
  function speak(text,options={}){
    if(!('speechSynthesis'in window)){toast('Speech playback is not available in this browser.');return;}
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang='nl-BE';utterance.rate=Number(options.rate||$('#speech-rate')?.value||.9);utterance.pitch=.98;
    const voice=preferredVoice();if(voice)utterance.voice=voice;
    if(options.onstart)utterance.onstart=options.onstart;if(options.onend)utterance.onend=options.onend;
    speechSynthesis.speak(utterance);
  }

  function nextRepeatWord(){
    const pool=WORDS.filter(word=>word.level===currentLevel());
    repeatWord=pool[Math.floor(Math.random()*pool.length)]||WORDS[0];
    $('#repeat-level').textContent=repeatWord.level;
    $('#repeat-word').textContent=repeatWord.word;
    $('#repeat-ipa').textContent=repeatWord.ipa||'';
    $('#repeat-sentence').textContent=repeatWord.example;
    $('#repeat-translation').textContent=repeatWord.translation;
    const tips=pronunciationTips(repeatWord.example);
    $('#sound-tip-title').textContent=tips.title;$('#sound-tip').textContent=tips.tip;
  }
  function nextCoachWord(){
    const pool=adaptivePool().filter(word=>word.example&&word.example.length<110);
    coachWord=engine.recommendation(pool,coachWord?.id)?.word||pool[Math.floor(Math.random()*pool.length)]||WORDS[0];
    $('#coach-target').textContent=coachWord.example;$('#coach-translation').textContent=coachWord.translation;
    resetSpeechFeedback();
  }
  function renderSpeak(){
    if(!repeatWord)nextRepeatWord();
    if(!coachWord)nextCoachWord();
    renderDialogues();loadVoices();
  }
  function resetSpeechFeedback(){
    $('#speech-score').textContent='—';$('#speech-verdict').textContent='Ready when you are.';$('#speech-transcript').textContent='Your transcript and a practical tip will appear here.';$('#speech-missing').innerHTML='';$('#speech-tip').textContent='';
  }

  function normaliseSpeech(value){return String(value).toLocaleLowerCase('nl-BE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
  function levenshtein(a,b){
    const previous=Array.from({length:b.length+1},(_,index)=>index);
    for(let i=1;i<=a.length;i++){let diagonal=previous[0];previous[0]=i;for(let j=1;j<=b.length;j++){const old=previous[j];previous[j]=Math.min(previous[j]+1,previous[j-1]+1,diagonal+(a[i-1]===b[j-1]?0:1));diagonal=old;}}
    return previous[b.length];
  }
  function speechScore(target,spoken){
    const a=normaliseSpeech(target),b=normaliseSpeech(spoken);if(!a||!b)return 0;
    const charScore=1-levenshtein(a,b)/Math.max(a.length,b.length);
    const targetTokens=a.split(' '),spokenTokens=b.split(' ');const spokenBag=[...spokenTokens];let matched=0;
    targetTokens.forEach(token=>{const index=spokenBag.indexOf(token);if(index>=0){matched++;spokenBag.splice(index,1);}});
    return Math.round(Math.max(0,Math.min(1,charScore*.62+matched/Math.max(targetTokens.length,spokenTokens.length)*.38))*100);
  }
  function missingWords(target,spoken){
    const targetTokens=normaliseSpeech(target).split(' '),bag=normaliseSpeech(spoken).split(' ');const missing=[];
    targetTokens.forEach(token=>{const index=bag.indexOf(token);if(index>=0)bag.splice(index,1);else missing.push(token);});return missing;
  }
  function pronunciationTips(text){
    const value=normaliseSpeech(text);
    if(/ui/.test(value))return{title:'Round, then glide on “ui”.',tip:'Start with rounded lips and glide toward an open sound. Do not pronounce it like English “oo”.'};
    if(/(ij|ei)/.test(value))return{title:'Keep “ij/ei” as one glide.',tip:'Start open and move quickly upward; avoid splitting the sound into two separate syllables.'};
    if(/(sch|ch|g)/.test(value))return{title:'Soften the Belgian g.',tip:'Belgian Dutch often uses a softer throat sound than northern Dutch. Keep the airflow gentle and continuous.'};
    if(/eu/.test(value))return{title:'Hold the rounded “eu”.',tip:'Keep the tongue around an “eh” position while rounding the lips.'};
    return{title:'Copy rhythm before perfection.',tip:'Listen once at normal speed, shadow the whole phrase, then repeat slowly and reconnect the words.'};
  }

  function startRecognition(){
    if(!coachWord)return;
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){$('#mic-note').textContent='Speech recognition is not available here. Try the latest Chrome or Edge; listening and playback still work.';toast('Speech recognition is unavailable in this browser.');return;}
    const recognition=new Recognition();recognition.lang='nl-BE';recognition.interimResults=false;recognition.maxAlternatives=3;
    const button=$('#coach-record');button.classList.add('listening');button.querySelector('b').textContent='Listening…';
    recognition.onresult=event=>{
      const alternatives=[...event.results[0]].map(result=>({text:result.transcript,score:speechScore(coachWord.example,result.transcript)})).sort((a,b)=>b.score-a.score);
      const best=alternatives[0];const missing=missingWords(coachWord.example,best.text);const tip=pronunciationTips(coachWord.example);
      $('#speech-score').textContent=`${best.score}%`;
      $('#speech-verdict').textContent=best.score>=88?'Very close.':best.score>=72?'Good—polish the difficult part.':best.score>=52?'A useful first pass.':'Slow it down and shadow the audio.';
      $('#speech-transcript').textContent=`The browser heard: “${best.text}”`;
      $('#speech-missing').innerHTML=missing.length?`<span>Listen for:</span>${missing.slice(0,6).map(word=>`<span class="missed">${escapeHtml(word)}</span>`).join('')}`:'<span>Every target word was detected.</span>';
      $('#speech-tip').textContent=tip.tip;
      engine.recordPronunciation(coachWord,best.score);stats.speechScores=[...(stats.speechScores||[]),best.score].slice(-100);stats.xp+=Math.max(3,Math.round(best.score/12));touchStreak();saveStats();renderHome();
    };
    recognition.onerror=event=>{$('#mic-note').textContent=event.error==='not-allowed'?'Microphone permission was blocked. Allow it in the browser site settings and try again.':`The browser could not complete recognition (${event.error}). Try again in a quieter place.`;};
    recognition.onend=()=>{button.classList.remove('listening');button.querySelector('b').textContent='Start speaking';};
    recognition.start();
  }

  function renderDialogues(){
    $('#dialogue-menu').innerHTML=DIALOGUES.map((dialogue,index)=>`<button class="${index===selectedDialogue?'active':''}" data-dialogue="${index}">${dialogue.kicker.split(' · ')[0]} · ${escapeHtml(dialogue.title)}</button>`).join('');
    const dialogue=DIALOGUES[selectedDialogue];$('#dialogue-kicker').textContent=dialogue.kicker;$('#dialogue-title').textContent=dialogue.title;
    $('#dialogue-lines').innerHTML=dialogue.lines.map((line,index)=>`<div class="dialogue-line"><span class="speaker-bubble">${line[0]}</span><div class="dialogue-text"><p>${escapeHtml(line[1])}</p><span>${escapeHtml(line[2])}</span></div><button class="row-audio" data-dialogue-line="${index}" aria-label="Hear line">)))</button></div>`).join('');
  }
  function playDialogueLine(index){speak(DIALOGUES[selectedDialogue].lines[index][1]);}
  function playDialogue(){
    const lines=DIALOGUES[selectedDialogue].lines;let index=0;
    const next=()=>{if(index>=lines.length)return;speak(lines[index++][1],{rate:.88,onend:()=>setTimeout(next,280)});};next();
  }

  function renderLab(){
    const data=dashboard();
    $('#lab-recall').textContent=data.recall===null?'—':`${Math.round(data.recall*100)}%`;
    $('#lab-signals').textContent=data.signals;$('#lab-due').textContent=data.due;$('#lab-speech').textContent=data.speechAverage===null?'—':`${Math.round(data.speechAverage)}%`;
    $('#model-status').textContent=data.signals<10?'Calibrating':data.signals<45?'Learning':'Adaptive';
    currentLabChoice=engine.recommendation(adaptivePool(),currentLabChoice?.word?.id);
    if(currentLabChoice){const word=currentLabChoice.word;$('#lab-word').textContent=word.word;$('#lab-ipa').textContent=word.ipa||word.level;$('#lab-reason').textContent=currentLabChoice.reason;$('#lab-answer').innerHTML='';$('#lab-reveal').disabled=false;$$('#lab-ratings button').forEach(button=>button.disabled=true);}
    renderInsights(data);
  }
  function renderInsights(data){
    const insights=[];
    if(!data.signals)insights.push(['Begin with a short baseline','Rate ten A0 cards honestly. The model needs real signals before it can personalize review.']);
    else{
      if(data.due>18)insights.push(['Review before adding more',`${data.due} items are due. A focused review now will reduce forgetting better than opening a new level.`]);
      if(data.speechAverage!==null&&data.speechAverage<70)insights.push(['Shadow shorter phrases',`Your speech match averages ${Math.round(data.speechAverage)}%. Listen once, repeat with the audio, then try alone.`]);
      if(data.recall!==null&&data.recall>.82)insights.push(['Increase retrieval difficulty','Recall looks strong. Try answering before revealing and switch some cards to Dutch → English production.']);
      const records=Object.values(engine.state.words);const slow=records.filter(record=>record.avgMs>9000).length;
      if(slow>5)insights.push(['Use smaller sessions',`${slow} practiced items take more than nine seconds on average. Five focused cards may work better than a long tired session.`]);
      const lapses=records.reduce((sum,record)=>sum+(record.lapses||0),0);
      if(lapses>4)insights.push(['Turn lapses into examples',`The model has seen ${lapses} forgotten recalls. Say the full example sentence after every “Again” rating.`]);
      if(!insights.length)insights.push(['Keep the rhythm steady','Your signals are balanced. A short daily session will teach the model more than one large weekly session.']);
    }
    $('#coach-insights').innerHTML=insights.slice(0,3).map(([title,text])=>`<div class="insight-item"><b>${title}</b><p>${text}</p></div>`).join('');
  }
  function revealLab(){
    if(!currentLabChoice)return;const word=currentLabChoice.word;
    $('#lab-answer').innerHTML=`${escapeHtml(word.meaning)}<span>${escapeHtml(word.example)} · ${escapeHtml(word.translation)}</span>`;$('#lab-reveal').disabled=true;$$('#lab-ratings button').forEach(button=>button.disabled=false);
  }
  function rateLab(quality){
    if(!currentLabChoice||!$('#lab-reveal').disabled)return;engine.record(currentLabChoice.word,quality,4500);touchStreak();resetDailyIfNeeded();stats.dailyCount+=1;stats.totalRatings+=1;stats.xp+=quality===0?2:quality===1?5:quality===2?8:12;saveStats();renderHome();renderLab();
  }

  function bindEvents(){
    document.addEventListener('click',event=>{
      const pageButton=event.target.closest('[data-page]');if(pageButton){setPage(pageButton.dataset.page);return;}
      const pageLink=event.target.closest('[data-page-link]');if(pageLink){event.preventDefault();setPage(pageLink.dataset.pageLink);return;}
      const speaker=event.target.closest('[data-speak-word]');if(speaker){event.stopPropagation();const word=WORDS.find(item=>item.id===speaker.dataset.speakWord);if(word)speak(word.word);return;}
      const row=event.target.closest('.word-row');if(row&&!event.target.closest('button')){row.classList.toggle('open');return;}
      const page=event.target.closest('[data-word-page]');if(page){wordsPage=Number(page.dataset.wordPage);renderWords();window.scrollTo({top:250,behavior:'smooth'});return;}
      const rating=event.target.closest('#rating-row [data-quality]');if(rating){rateCard(Number(rating.dataset.quality));return;}
      const labRating=event.target.closest('#lab-ratings [data-quality]');if(labRating){rateLab(Number(labRating.dataset.quality));return;}
      const tab=event.target.closest('[data-speak-tab]');if(tab){$$('.subnav-item').forEach(item=>item.classList.toggle('active',item===tab));$$('.speak-panel').forEach(panel=>panel.classList.toggle('active',panel.id===`speak-${tab.dataset.speakTab}`));return;}
      const dialogueButton=event.target.closest('[data-dialogue]');if(dialogueButton){selectedDialogue=Number(dialogueButton.dataset.dialogue);renderDialogues();return;}
      const dialogueLine=event.target.closest('[data-dialogue-line]');if(dialogueLine){playDialogueLine(Number(dialogueLine.dataset.dialogueLine));return;}
    });
    $$('#word-search,#word-level,#word-category').forEach(input=>input.addEventListener(input.tagName==='INPUT'?'input':'change',()=>{wordsPage=1;renderWords();}));
    $('#word-random').addEventListener('click',()=>{const word=WORDS[Math.floor(Math.random()*WORDS.length)];$('#word-search').value=word.word;wordsPage=1;renderWords();setTimeout(()=>$('.word-row')?.classList.add('open'),0);});
    $('#flashcard-scene').addEventListener('click',event=>{if(!event.target.closest('button'))flipCard();});
    $('#flashcard-scene').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();flipCard();}});
    $('#card-audio-word').addEventListener('click',event=>{event.stopPropagation();speak(currentCard.word);});
    $('#card-audio-sentence').addEventListener('click',event=>{event.stopPropagation();speak(currentCard.example);});
    $('#card-level').addEventListener('change',showNextCard);
    $('#reset-session').addEventListener('click',()=>{session.reviewed=0;session.remembered=0;session.xp=0;showNextCard();toast('A fresh 10-card session is ready.');});
    $('#repeat-next').addEventListener('click',nextRepeatWord);
    $('#repeat-play').addEventListener('click',()=>speak(repeatWord.example,{onstart:()=>$('.wave').classList.add('playing'),onend:()=>$('.wave').classList.remove('playing')}));
    $('#coach-hear').addEventListener('click',()=>speak(coachWord.example));$('#coach-next').addEventListener('click',nextCoachWord);$('#coach-record').addEventListener('click',startRecognition);
    $('#dialogue-play').addEventListener('click',playDialogue);
    $('#lab-hear').addEventListener('click',()=>currentLabChoice&&speak(currentLabChoice.word.word));$('#lab-reveal').addEventListener('click',revealLab);
    $('#clear-learning-data').addEventListener('click',()=>{if(confirm('Clear all local progress, streaks, pronunciation scores, and adaptive model data for Vlot Vlaams?')){engine.clear();stats={streak:0,lastDate:'',dailyDate:'',dailyCount:0,totalRatings:0,xp:0,speechScores:[]};saveStats();renderHome();renderLab();toast('Learning data cleared.');}});
  }

  function init(){
    if(!WORDS.length){document.body.innerHTML='<p style="padding:2rem">The vocabulary data could not be loaded.</p>';return;}
    resetDailyIfNeeded();bindEvents();renderWords();renderHome();renderPath();renderDialogues();renderSession();
    if('speechSynthesis'in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}
    const requested=location.hash.replace('#','');setPage(requested||'home',false);
    if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }
  init();
})();

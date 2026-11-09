import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(SCRIPT_DIR, '..');
const WORKSPACE_DIR = path.resolve(PROJECT_DIR, '..');

const FREQUENCY_PATH = path.join(WORKSPACE_DIR, 'nl_50k.txt');
const DICTIONARY_PATH = path.join(WORKSPACE_DIR, 'kaikki-dutch.jsonl.gz');
const TATOEBA_NL_PATH = path.join(WORKSPACE_DIR, 'tatoeba-en-nl', 'Tatoeba.en-nl.nl');
const TATOEBA_EN_PATH = path.join(WORKSPACE_DIR, 'tatoeba-en-nl', 'Tatoeba.en-nl.en');
const OUTPUT_PATH = path.join(PROJECT_DIR, 'data', 'words.js');

const blockedWords = new Set([
  'n','m','t','s','z','o','lk','eén','mr','mrs','dr','sir','the','new','miss','fbi','ok','oke',
  'john','jack','sam','charlie','michael','george','york','joe','peter','mike','tom','james','henry','david','frank',
  'verdomme','klootzak','shit','seks','idioot','stomme','verdomde','moord','moordenaar','vermoord','vermoorden',
  'doden','gedood','pistool','wapen','wapens','schieten','slachtoffer','gevangenis','drugs','luitenant','kolonel',
  'generaal','kapitein','dollar'
]);

const badSentenceWords = new Set([
  'vermoord','vermoorden','moord','doden','gedood','klootzak','verdomme','shit','seks','pistool','wapen','drugs'
]);

const curated = [
  {slot:24, word:'gij', meaning:'you (informal, stressed)', pos:'pronoun', ipa:'/ɣɛi̯/', example:'Gij zijt altijd welkom bij ons.', translation:'You are always welcome at our place.', standard:'jij', note:'Very common in informal Belgian Dutch; use jij in neutral standard Dutch.'},
  {slot:39, word:'ge', meaning:'you (informal, unstressed)', pos:'pronoun', ipa:'/ɣə/', example:'Hebt ge morgen tijd?', translation:'Do you have time tomorrow?', standard:'je', note:'The unstressed everyday partner of gij in much of Flanders.'},
  {slot:54, word:'amai', meaning:'wow; oh my', pos:'interjection', ipa:'/aːˈmɑi̯/', example:'Amai, dat ziet er lekker uit!', translation:'Wow, that looks delicious!', standard:'tjonge; wauw', note:'A very common Belgian reaction showing surprise or admiration.'},
  {slot:69, word:'merci', meaning:'thanks', pos:'interjection', ipa:'/mɛrˈsi/', example:'Merci voor uw hulp!', translation:'Thanks for your help!', standard:'dank je', note:'Informal French loanword used constantly in Belgium.'},
  {slot:84, word:'uw', meaning:'your (formal or Belgian informal)', pos:'determiner', ipa:'/yʋ/', example:'Is dat uw fiets?', translation:'Is that your bicycle?', standard:'jouw', note:'In Belgium uw is also common with informal gij/ge.'},
  {slot:112, word:'allez', meaning:'come on; well; okay', pos:'interjection', ipa:'/aˈleː/', example:'Allez, we zijn ermee weg.', translation:'Alright, we are off.', standard:'kom op; nou', note:'Meaning changes with tone; it often organizes conversation.'},
  {slot:132, word:'goesting', meaning:'desire; appetite; feeling like something', pos:'noun', ipa:'/ˈɣustɪŋ/', example:'Ik heb goesting in frieten.', translation:'I feel like having fries.', standard:'zin; trek', note:'Standard Belgian Dutch and one of the most useful local words.'},
  {slot:152, word:'plezant', meaning:'fun; pleasant', pos:'adjective', ipa:'/pləˈzɑnt/', example:'Het was een plezante avond.', translation:'It was a fun evening.', standard:'leuk; prettig', note:'Everyday Belgian Dutch.'},
  {slot:172, word:'seffens', meaning:'in a little while', pos:'adverb', ipa:'/ˈsɛfəns/', example:'Ik bel u seffens terug.', translation:'I will call you back in a little while.', standard:'straks; zo meteen', note:'Common in Belgian speech.'},
  {slot:192, word:'rap', meaning:'quickly; fast', pos:'adverb', ipa:'/rɑp/', example:'Kom rap binnen, het regent.', translation:'Come inside quickly, it is raining.', standard:'snel', note:'Very common informal Belgian use.'},
  {slot:212, word:'kuisen', meaning:'to clean', pos:'verb', ipa:'/ˈkœy̯zə(n)/', example:'Ik moet vandaag de keuken kuisen.', translation:'I have to clean the kitchen today.', standard:'schoonmaken', note:'Standard Belgian Dutch.'},
  {slot:232, word:'frigo', meaning:'fridge', pos:'noun', ipa:'/ˈfriɣoː/', example:'De melk staat in de frigo.', translation:'The milk is in the fridge.', standard:'koelkast', note:'Everyday Belgian Dutch.'},
  {slot:252, word:'gsm', meaning:'mobile phone', pos:'noun', ipa:'/ɣeː ɛs ɛm/', example:'Mijn gsm is bijna leeg.', translation:'My phone is almost out of battery.', standard:'mobiele telefoon', note:'The normal everyday Belgian word for a mobile phone.'},
  {slot:272, word:'kot', meaning:'student room; small room', pos:'noun', ipa:'/kɔt/', example:'Mijn kot ligt dicht bij de universiteit.', translation:'My student room is close to the university.', standard:'studentenkamer', note:'Especially common in student life.'},
  {slot:292, word:'solden', meaning:'sales; clearance sales', pos:'noun', ipa:'/ˈsɔldə(n)/', example:'Tijdens de solden zijn de schoenen goedkoper.', translation:'During the sales, the shoes are cheaper.', standard:'uitverkoop', note:'Standard Belgian Dutch.'},
  {slot:318, word:'hesp', meaning:'ham', pos:'noun', ipa:'/ɦɛsp/', example:'Ik neem een broodje met kaas en hesp.', translation:'I will have a roll with cheese and ham.', standard:'ham', note:'Common Belgian Dutch.'},
  {slot:338, word:'confituur', meaning:'jam; fruit preserve', pos:'noun', ipa:'/ˌkɔnfiˈtyːr/', example:'Wil je confituur op je boterham?', translation:'Would you like jam on your bread?', standard:'jam', note:'Common Belgian Dutch.'},
  {slot:358, word:'appelsien', meaning:'orange', pos:'noun', ipa:'/ˌɑpəlˈsin/', example:'Ik pers een appelsien voor het ontbijt.', translation:'I am squeezing an orange for breakfast.', standard:'sinaasappel', note:'Common Belgian Dutch.'},
  {slot:378, word:'fruitsap', meaning:'fruit juice', pos:'noun', ipa:'/ˈfrœy̯tˌsɑp/', example:'Mag ik een glas fruitsap?', translation:'May I have a glass of fruit juice?', standard:'vruchtensap', note:'Common Belgian Dutch.'},
  {slot:398, word:'pistolet', meaning:'crusty bread roll', pos:'noun', ipa:'/ˌpɪstoːˈlɛt/', example:'Op zondag halen we verse pistolets.', translation:'On Sundays we get fresh bread rolls.', standard:'broodje', note:'A classic Belgian bakery word.'},
  {slot:418, word:'koffiekoek', meaning:'sweet breakfast pastry', pos:'noun', ipa:'/ˈkɔfiˌkuk/', example:'Bij de bakker koop ik een koffiekoek.', translation:'I buy a pastry at the bakery.', standard:'zoet broodje', note:'Common Belgian bakery vocabulary.'},
  {slot:438, word:'frieten', meaning:'fries', pos:'noun', ipa:'/ˈfritə(n)/', example:'We halen vanavond frieten bij de frituur.', translation:'We are getting fries from the chip shop tonight.', standard:'friet', note:'The plural form is especially natural in Belgium.'},
  {slot:458, word:'frituur', meaning:'chip shop; fryer', pos:'noun', ipa:'/friˈtyːr/', example:'De frituur op de hoek is nog open.', translation:'The chip shop on the corner is still open.', standard:'snackbar', note:'A central piece of Belgian food culture.'},
  {slot:478, word:'patatten', meaning:'potatoes', pos:'noun', ipa:'/pɑˈtɑtə(n)/', example:'Mijn oma maakt patatten met groenten.', translation:'My grandmother makes potatoes with vegetables.', standard:'aardappelen', note:'Very common informal Belgian Dutch.'},
  {slot:498, word:'boterham', meaning:'slice of bread; sandwich', pos:'noun', ipa:'/ˈboːtərˌɦɑm/', example:'Ik eet een boterham met kaas.', translation:'I am eating a cheese sandwich.', standard:'boterham', note:'Shared Dutch word, but essential in Belgian daily conversation.'},
  {slot:522, word:'ambetant', meaning:'annoying; inconvenient', pos:'adjective', ipa:'/ˌɑmbəˈtɑnt/', example:'Dat lawaai is echt ambetant.', translation:'That noise is really annoying.', standard:'vervelend', note:'Very common Belgian Dutch.'},
  {slot:542, word:'schoon', meaning:'beautiful; nice', pos:'adjective', ipa:'/sxoːn/', example:'Wat een schoon uitzicht!', translation:'What a beautiful view!', standard:'mooi', note:'In Belgium schoon often means beautiful; in general Dutch it often means clean.'},
  {slot:562, word:'proper', meaning:'clean; tidy', pos:'adjective', ipa:'/ˈprɔpər/', example:'De kamer is weer proper.', translation:'The room is clean again.', standard:'schoon; netjes', note:'A common Belgian meaning influenced by French.'},
  {slot:582, word:'verwittigen', meaning:'to notify; to warn', pos:'verb', ipa:'/vərˈʋɪtəɣə(n)/', example:'Verwittig mij als de trein vertraging heeft.', translation:'Let me know if the train is delayed.', standard:'waarschuwen; informeren', note:'Standard Belgian Dutch.'},
  {slot:602, word:'onthaal', meaning:'reception; welcome desk', pos:'noun', ipa:'/ɔntˈɦaːl/', example:'Meld u eerst aan bij het onthaal.', translation:'Please check in at reception first.', standard:'receptie; ontvangst', note:'Common in Belgian institutions and workplaces.'},
  {slot:622, word:'lavabo', meaning:'washbasin; sink', pos:'noun', ipa:'/ˈlaːvaːboː/', example:'De lavabo is naast de douche.', translation:'The washbasin is next to the shower.', standard:'wastafel', note:'Common Belgian Dutch.'},
  {slot:642, word:'vuilbak', meaning:'trash can; bin', pos:'noun', ipa:'/ˈvœy̯lˌbɑk/', example:'Gooi dat papier in de vuilbak.', translation:'Throw that paper in the bin.', standard:'vuilnisbak', note:'Everyday Belgian Dutch.'},
  {slot:662, word:'dampkap', meaning:'cooker hood', pos:'noun', ipa:'/ˈdɑmpˌkɑp/', example:'Zet de dampkap aan tijdens het koken.', translation:'Turn on the cooker hood while cooking.', standard:'afzuigkap', note:'Standard Belgian Dutch.'},
  {slot:682, word:'valies', meaning:'suitcase', pos:'noun', ipa:'/vaːˈlis/', example:'Mijn valies staat klaar voor de reis.', translation:'My suitcase is ready for the trip.', standard:'koffer', note:'Common Belgian Dutch.'},
  {slot:702, word:'camionette', meaning:'van; delivery van', pos:'noun', ipa:'/ˌkɑmjoːˈnɛtə/', example:'De pakjes worden met een camionette geleverd.', translation:'The parcels are delivered by van.', standard:'bestelwagen', note:'Informal Belgian Dutch.'},
  {slot:722, word:'camion', meaning:'truck', pos:'noun', ipa:'/ˈkɑmjoːn/', example:'De camion staat voor het magazijn.', translation:'The truck is parked in front of the warehouse.', standard:'vrachtwagen', note:'Informal Belgian Dutch.'},
  {slot:742, word:'beenhouwer', meaning:'butcher', pos:'noun', ipa:'/ˈbeːnˌɦɑu̯ər/', example:'De beenhouwer snijdt de hesp vers.', translation:'The butcher slices the ham fresh.', standard:'slager', note:'Standard Belgian Dutch.'},
  {slot:762, word:'charcuterie', meaning:'cold cuts; prepared meats', pos:'noun', ipa:'/ʃɑrˌkyːtəˈri/', example:'We kopen charcuterie voor bij de lunch.', translation:'We are buying cold cuts for lunch.', standard:'vleeswaren', note:'Common Belgian Dutch.'},
  {slot:782, word:'microgolfoven', meaning:'microwave oven', pos:'noun', ipa:'/ˈmikroːˌɣɔlfˌoːvə(n)/', example:'Warm de soep op in de microgolfoven.', translation:'Heat the soup in the microwave.', standard:'magnetron', note:'Standard Belgian Dutch.'},
  {slot:802, word:'chauffage', meaning:'heating', pos:'noun', ipa:'/ʃoːˈfaːʒə/', example:'Zet de chauffage wat hoger.', translation:'Turn the heating up a little.', standard:'verwarming', note:'Informal Belgian Dutch.'},
  {slot:822, word:'rondpunt', meaning:'roundabout', pos:'noun', ipa:'/ˈrɔntˌpʏnt/', example:'Neem op het rondpunt de tweede afslag.', translation:'Take the second exit at the roundabout.', standard:'rotonde', note:'Common Belgian Dutch.'},
  {slot:842, word:'voetpad', meaning:'pavement; sidewalk', pos:'noun', ipa:'/ˈvutˌpɑt/', example:'De fiets staat op het voetpad.', translation:'The bicycle is on the pavement.', standard:'stoep', note:'Standard Belgian Dutch.'},
  {slot:862, word:'mutualiteit', meaning:'health insurance fund', pos:'noun', ipa:'/ˌmytyɑliˈtɛit/', example:'Ik stuur het attest naar de mutualiteit.', translation:'I am sending the certificate to the health insurance fund.', standard:'zorgverzekeraar', note:'Essential Belgian administrative vocabulary.'},
  {slot:882, word:'remgeld', meaning:'patient co-payment', pos:'noun', ipa:'/ˈrɛmˌɣɛlt/', example:'Hoeveel remgeld moet ik betalen?', translation:'How much co-payment do I have to pay?', standard:'eigen bijdrage', note:'Belgian healthcare vocabulary.'},
  {slot:902, word:'vakantiejob', meaning:'holiday job; seasonal student job', pos:'noun', ipa:'/vɑˈkɑnsiˌdʒɔp/', example:'Deze zomer doe ik een vakantiejob.', translation:'This summer I am doing a holiday job.', standard:'vakantiewerk', note:'Very common in Belgian student life.'},
  {slot:922, word:'jobstudent', meaning:'student worker', pos:'noun', ipa:'/ˈdʒɔpˌstyˌdɛnt/', example:'Als jobstudent werk ik in het weekend.', translation:'As a student worker, I work at weekends.', standard:'werkstudent', note:'Belgian employment vocabulary.'},
  {slot:942, word:'paswoord', meaning:'password', pos:'noun', ipa:'/ˈpɑsˌʋoːrt/', example:'Ik ben mijn paswoord vergeten.', translation:'I forgot my password.', standard:'wachtwoord', note:'Common Belgian Dutch.'},
  {slot:962, word:'pompelmoes', meaning:'grapefruit', pos:'noun', ipa:'/ˈpɔmpəlˌmus/', example:'Wil je sap van pompelmoes?', translation:'Would you like grapefruit juice?', standard:'grapefruit', note:'Common Belgian Dutch.'},
  {slot:982, word:'gerief', meaning:'things; equipment; tools', pos:'noun', ipa:'/ɣəˈrif/', example:'Al het gerief ligt in de kast.', translation:'All the equipment is in the cupboard.', standard:'spullen; gereedschap', note:'Belgian Dutch; the exact meaning depends on context.'},
  {slot:994, word:'weeral', meaning:'again; yet again', pos:'adverb', ipa:'/ˈʋeːrˌɑl/', example:'Het regent weeral.', translation:'It is raining again.', standard:'alweer; opnieuw', note:'Very common informal Belgian Dutch.'}
];

const normaliseWord = value => String(value || '').trim().toLocaleLowerCase('nl-BE');
const tokenise = value => normaliseWord(value).match(/[\p{L}][\p{L}'’-]*/gu) || [];

function hasTag(entry, tag) {
  return (entry.senses || []).some(sense => (sense.tags || []).includes(tag));
}

function entryPriority(entry) {
  const posScores = {pron:95, article:94, det:93, conj:92, prep:91, verb:88, adv:86, adj:84, noun:82, interj:80, phrase:70};
  let score = posScores[entry.pos] || 40;
  if ((entry.senses || []).some(s => s.form_of?.length)) score += entry.pos === 'verb' ? 10 : 4;
  if ((entry.senses || []).some(s => s.glosses?.length && !s.form_of?.length)) score += 15;
  if (entry.pos === 'name' || entry.pos === 'proper-noun') score -= 200;
  if (hasTag(entry, 'obsolete') || hasTag(entry, 'archaic')) score -= 30;
  return score;
}

function getLemma(entry) {
  const formSense = (entry.senses || []).find(sense => sense.form_of?.[0]?.word);
  return normaliseWord(formSense?.form_of?.[0]?.word || entry.word);
}

function bestGloss(entry) {
  const senses = (entry?.senses || []).filter(sense => sense.glosses?.length && !sense.form_of?.length && !sense.alt_of?.length);
  const preferred = senses.find(sense => !(sense.tags || []).some(tag => ['obsolete','archaic','historical'].includes(tag))) || senses[0];
  if (!preferred) return '';
  return preferred.glosses
    .slice(0, 2)
    .map(gloss => gloss.replace(/^\([^)]*\)\s*/, '').replace(/\.$/, ''))
    .join('; ')
    .replace(/\s+/g, ' ')
    .slice(0, 180);
}

function bestIpa(entry) {
  const sounds = entry?.sounds || [];
  const belgian = sounds.find(sound => sound.ipa && (sound.tags || []).some(tag => /Belg|Flem/i.test(tag)));
  return (belgian || sounds.find(sound => sound.ipa))?.ipa || '';
}

function getForms(entry, frequencySet) {
  const forms = new Set([normaliseWord(entry.word)]);
  if (['pron','article','det','conj','prep'].includes(entry.pos)) return [...forms];
  for (const form of entry.forms || []) {
    const value = normaliseWord(form.form);
    if (value && frequencySet.has(value) && !value.includes(' ')) forms.add(value);
  }
  return [...forms].slice(0, 12);
}

async function collectDictionaryEntries(targetWords) {
  const result = new Map();
  const input = fs.createReadStream(DICTIONARY_PATH).pipe(zlib.createGunzip());
  const lines = readline.createInterface({input, crlfDelay: Infinity});
  for await (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const word = normaliseWord(entry.word);
    if (!targetWords.has(word)) continue;
    if (!result.has(word)) result.set(word, []);
    result.get(word).push(entry);
  }
  return result;
}

function chooseSurfaceEntry(entries) {
  return [...(entries || [])].sort((a,b) => entryPriority(b) - entryPriority(a))[0] || null;
}

function chooseLemmaEntry(entries, preferredPos) {
  return [...(entries || [])]
    .filter(entry => bestGloss(entry))
    .sort((a,b) => {
      const aMatch = a.pos === preferredPos ? 25 : 0;
      const bMatch = b.pos === preferredPos ? 25 : 0;
      return (entryPriority(b) + bMatch) - (entryPriority(a) + aMatch);
    })[0] || null;
}

function categoryFor(pos, rank) {
  if (rank <= 120) return 'Essentials';
  if (['verb'].includes(pos)) return 'Actions';
  if (['adj','adv'].includes(pos)) return 'Descriptions';
  if (['pron','article','det','conj','prep'].includes(pos)) return 'Building sentences';
  if (['interj','phrase'].includes(pos)) return 'Conversation';
  return 'People & things';
}

function levelFor(rank) {
  if (rank <= 100) return 'A0';
  if (rank <= 300) return 'A1';
  if (rank <= 500) return 'A2';
  if (rank <= 700) return 'B1';
  if (rank <= 850) return 'B2';
  return 'C1';
}

function fallbackExample(word) {
  const value = word.word;
  if (word.pos === 'verb') return {example:`Ik probeer ${value} in een echt gesprek te gebruiken.`, translation:`I try to use “${value}” in a real conversation.`};
  if (word.pos === 'adj' || word.pos === 'adv') return {example:`In deze situatie klinkt “${value}” heel natuurlijk.`, translation:`In this situation, “${value}” sounds very natural.`};
  return {example:`Je hoort het woord “${value}” vaak in gesprekken.`, translation:`You often hear the word “${value}” in conversations.`};
}

function selectExamples(words) {
  const nlLines = fs.readFileSync(TATOEBA_NL_PATH, 'utf8').split(/\r?\n/);
  const enLines = fs.readFileSync(TATOEBA_EN_PATH, 'utf8').split(/\r?\n/);
  const tokenToWordIndexes = new Map();
  words.forEach((word, index) => {
    for (const form of new Set([word.word, ...(word.forms || [])])) {
      if (!form || form.includes(' ')) continue;
      if (!tokenToWordIndexes.has(form)) tokenToWordIndexes.set(form, []);
      tokenToWordIndexes.get(form).push(index);
    }
  });

  const candidates = words.map(() => []);
  for (let i=0; i<Math.min(nlLines.length, enLines.length); i++) {
    const dutch = nlLines[i]?.trim();
    const english = enLines[i]?.trim();
    if (!dutch || !english || dutch.length > 125 || english.length > 145) continue;
    const tokens = tokenise(dutch);
    if (tokens.length < 3 || tokens.length > 15) continue;
    if (tokens.some(token => badSentenceWords.has(token))) continue;
    const uniqueTokens = new Set(tokens);
    const touched = new Set();
    for (const token of uniqueTokens) {
      for (const wordIndex of tokenToWordIndexes.get(token) || []) {
        if (touched.has(wordIndex)) continue;
        touched.add(wordIndex);
        const exact = uniqueTokens.has(words[wordIndex].word);
        const score = Math.abs(tokens.length - 7) * 2 + dutch.length / 45 + (exact ? 0 : 2) + (/\d/.test(dutch) ? 4 : 0);
        const list = candidates[wordIndex];
        list.push({score, example:dutch, translation:english});
        list.sort((a,b) => a.score - b.score);
        if (list.length > 8) list.length = 8;
      }
    }
  }

  const used = new Map();
  words.forEach((word, index) => {
    if (word.example && word.translation) return;
    const options = candidates[index];
    const chosen = options.find(option => (used.get(option.example) || 0) < 2) || options[0];
    if (chosen) {
      word.example = chosen.example;
      word.translation = chosen.translation;
      used.set(chosen.example, (used.get(chosen.example) || 0) + 1);
      word.exampleSource = 'Tatoeba';
    } else {
      Object.assign(word, fallbackExample(word));
      word.exampleSource = 'Vlot Vlaams fallback';
    }
  });
}

for (const required of [FREQUENCY_PATH, DICTIONARY_PATH, TATOEBA_NL_PATH, TATOEBA_EN_PATH]) {
  if (!fs.existsSync(required)) throw new Error(`Missing source file: ${required}`);
}

const frequencyRows = fs.readFileSync(FREQUENCY_PATH, 'utf8')
  .split(/\r?\n/)
  .map((line, index) => {
    const [surface, count] = line.trim().split(/\s+/);
    return {surface:normaliseWord(surface), count:Number(count) || 0, sourceRank:index + 1};
  })
  .filter(row => row.surface && /^[\p{L}][\p{L}'’-]+$/u.test(row.surface) && !blockedWords.has(row.surface));

const frequencySet = new Set(frequencyRows.map(row => row.surface));
const firstPassTargets = new Set(frequencyRows.slice(0, 7000).map(row => row.surface));
curated.forEach(item => firstPassTargets.add(item.word));

console.log(`Reading dictionary forms for ${firstPassTargets.size} frequent words…`);
const surfaceEntries = await collectDictionaryEntries(firstPassTargets);
const surfaceCandidates = [];
const lemmaTargets = new Set(curated.map(item => item.word));

for (const row of frequencyRows.slice(0, 7000)) {
  const entry = chooseSurfaceEntry(surfaceEntries.get(row.surface));
  if (!entry || ['name','proper-noun','character','symbol'].includes(entry.pos)) continue;
  const lemma = getLemma(entry);
  if (!lemma || blockedWords.has(lemma) || lemma.length < 2 || lemma.includes(' ')) continue;
  surfaceCandidates.push({row, entry, lemma});
  lemmaTargets.add(lemma);
}

console.log(`Reading ${lemmaTargets.size} lemma entries…`);
const lemmaEntries = await collectDictionaryEntries(lemmaTargets);
const grouped = new Map();

// A few very common words have several valid dictionary senses. Keep the
// learner-facing gloss aligned with the concrete sentence used in the course.
const lexicalOverrides = {
  kapot: {meaning:'broken; exhausted', pos:'adjective'}
};

for (const candidate of surfaceCandidates) {
  if (!grouped.has(candidate.lemma)) grouped.set(candidate.lemma, {sourceRank:candidate.row.sourceRank, count:candidate.row.count, pos:candidate.entry.pos, forms:new Set()});
  const group = grouped.get(candidate.lemma);
  group.forms.add(candidate.row.surface);
  if (candidate.row.sourceRank < group.sourceRank) {
    group.sourceRank = candidate.row.sourceRank;
    group.count = candidate.row.count;
    group.pos = candidate.entry.pos;
  }
}

const baseWords = [];
for (const [lemma, group] of [...grouped].sort((a,b) => a[1].sourceRank - b[1].sourceRank)) {
  if (curated.some(item => item.word === lemma)) continue;
  const entry = chooseLemmaEntry(lemmaEntries.get(lemma), group.pos);
  const lexicalOverride = lexicalOverrides[lemma];
  const meaning = lexicalOverride?.meaning || bestGloss(entry);
  if (!entry || !meaning || meaning.length < 2) continue;
  const forms = [...new Set([...group.forms, ...getForms(entry, frequencySet)])].filter(Boolean).slice(0, 12);
  baseWords.push({
    word:lemma,
    meaning,
    pos:lexicalOverride?.pos || entry.pos || group.pos || 'word',
    ipa:bestIpa(entry),
    forms,
    sourceRank:group.sourceRank,
    corpusCount:group.count,
    variant:'General Dutch',
    standard:'',
    note:'',
    source:'OpenSubtitles frequency + Kaikki/Wiktionary'
  });
  if (baseWords.length >= 1200) break;
}

if (baseWords.length < 950) throw new Error(`Only ${baseWords.length} usable frequency lemmas were found.`);

const curatedBySlot = new Map(curated.map(item => [item.slot, item]));
const words = [];
let baseIndex = 0;
for (let rank=1; rank<=1000; rank++) {
  const special = curatedBySlot.get(rank);
  const raw = special ? {
    ...special,
    forms:[special.word],
    sourceRank:null,
    corpusCount:null,
    variant:'Belgian Dutch',
    source:'Curated Belgian Dutch layer',
    exampleSource:'Curated Belgian Dutch example'
  } : baseWords[baseIndex++];
  if (!raw) throw new Error(`Ran out of words at rank ${rank}`);
  const {slot: _slot, ...cleanRaw} = raw;
  words.push({
    id:`vv-${String(rank).padStart(4,'0')}`,
    rank,
    level:levelFor(rank),
    category:special ? 'Belgian Dutch' : categoryFor(raw.pos, rank),
    ...cleanRaw
  });
}

selectExamples(words);

const output = `// Generated by scripts/generate-dataset.mjs. Do not edit by hand.\n` +
  `window.VLOT_WORDS = ${JSON.stringify(words, null, 2)};\n` +
  `window.VLOT_DATASET_META = ${JSON.stringify({
    generatedAt:new Date().toISOString(),
    count:words.length,
    frequencySource:'FrequencyWords Dutch 2018 / OpenSubtitles',
    dictionarySource:'Kaikki.org Dutch dictionary / English Wiktionary',
    exampleSource:'Tatoeba English–Dutch parallel corpus plus curated Belgian examples',
    methodology:'950 high-frequency conversational Dutch lemmas plus 50 Belgian-Dutch essentials, ordered into a learning path.'
  }, null, 2)};\n`;

fs.mkdirSync(path.dirname(OUTPUT_PATH), {recursive:true});
fs.writeFileSync(OUTPUT_PATH, output, 'utf8');

const fallbackCount = words.filter(word => word.exampleSource === 'Vlot Vlaams fallback').length;
const ipaCount = words.filter(word => word.ipa).length;
console.log(`Wrote ${words.length} entries to ${OUTPUT_PATH}`);
console.log(`IPA coverage: ${ipaCount}/${words.length}; generated fallbacks: ${fallbackCount}`);

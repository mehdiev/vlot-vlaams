# Vlot Vlaams

Vlot Vlaams is a free, static Belgian-Dutch learning app built around exactly 1,000 conversational entries. It combines a frequency-ranked Dutch core with a curated Belgian-Dutch layer, authentic bilingual examples, browser speech, adaptive flashcards, streaks, and a private on-device learner model.

**Live app:** [mehdiev.github.io/vlot-vlaams](https://mehdiev.github.io/vlot-vlaams/)

## What is included

- 1,000 unique entries, each with an English meaning and contextual sentence
- 50 clearly labelled Belgian-Dutch essentials with neutral alternatives
- IPA coverage for more than 90% of the corpus
- A0–C1 curriculum bands and 20 units of 50 words
- Searchable word reference, audio playback, and contextual notes
- Four-grade spaced-repetition flashcards
- Belgian-Dutch speech playback (`nl-BE` preferred, Dutch fallback)
- Microphone-based transcript comparison and practical pronunciation tips
- 12 real-life mini-dialogues set in Flanders
- Local neural recall model and explainable study recommendations
- Daily streak, XP, offline cache, and installable web-app manifest
- No account, backend, paid API, or build step

## Important learning note

The A0–C1 labels are progressively harder curriculum bands for this 1,000-word core. Knowing 1,000 words is not equivalent to CEFR C1. Genuine C1 ability requires a much larger vocabulary and sustained work in listening, reading, writing, interaction, and feedback.

## Run locally

Serve the folder with any static server, for example:

```bash
npx serve .
```

Speech recognition works best in a recent Chrome or Edge browser. Speech playback depends on the Dutch voices installed in the browser or operating system.

## Tests

```bash
npm test
```

## Regenerating the dataset

The generator expects these source files one directory above the project:

- `nl_50k.txt`
- `kaikki-dutch.jsonl.gz`
- `tatoeba-en-nl/Tatoeba.en-nl.nl`
- `tatoeba-en-nl/Tatoeba.en-nl.en`

Then run:

```bash
npm run generate:data
```

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for data attribution and licensing.

'use strict';
// Instant, local scripture recognition for Live Mode. No network, no AI round trip.
//   parseReference(text)   -> spoken references: "Psalm twenty three verse one", "John 3 16",
//                             "first Corinthians chapter thirteen verses four to seven"
//   VerseIndex.match(text) -> which verse is being read aloud, from the first few words of it
// Runs on every new word of the live transcript, so everything here is cheap and synchronous.

const fs = require('fs');

const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

const NUMBERED = ['Samuel', 'Kings', 'Chronicles', 'Corinthians', 'Thessalonians', 'Timothy', 'Peter', 'John'];
const ORDINALS = { 1: ['1', 'first', '1st'], 2: ['2', 'second', '2nd'], 3: ['3', 'third', '3rd'] };

const ALIASES = (() => {
  const m = {};
  BOOKS.forEach((b) => { m[b.toLowerCase()] = b; });
  Object.assign(m, {
    psalm: 'Psalms', 'song of songs': 'Song of Solomon', 'songs of solomon': 'Song of Solomon',
    'songs of songs': 'Song of Solomon', revelations: 'Revelation', 'revelation of john': 'Revelation',
    deutronomy: 'Deuteronomy', jenesis: 'Genesis', genesus: 'Genesis', phillipians: 'Philippians',
    filipians: 'Philippians', obadia: 'Obadiah', nahoom: 'Nahum', salms: 'Psalms'
  });
  for (const bk of NUMBERED) {
    const maxN = bk === 'John' ? 3 : 2;
    for (let n = 1; n <= maxN; n++) for (const o of ORDINALS[n]) m[`${o} ${bk.toLowerCase()}`] = `${n} ${bk}`;
  }
  return m;
})();

// ---- spoken numbers ("twenty three", "one hundred and nineteen") -> digits ----
const UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

function convertNumbers(tokens) {
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (!(t in UNITS) && !(t in TENS) && t !== 'hundred') { out.push(t); i++; continue; }
    let rest = 0, hundreds = 0, state = null, j = i;
    for (; j < tokens.length; j++) {
      const w = tokens[j];
      if (w in UNITS) {
        const v = UNITS[w];
        if (state === null || state === 'hundred' || state === 'and' || (state === 'tens' && v >= 1 && v <= 9)) {
          rest += v; state = 'unit'; continue;
        }
        break;
      }
      if (w in TENS) {
        if (state === null || state === 'hundred' || state === 'and') { rest += TENS[w]; state = 'tens'; continue; }
        break;
      }
      if (w === 'hundred') {
        if (state === 'unit' && rest >= 1 && rest <= 9 && hundreds === 0) { hundreds = rest * 100; rest = 0; state = 'hundred'; continue; }
        if (state === null) { hundreds = 100; state = 'hundred'; continue; }
        break;
      }
      if (w === 'and' && state === 'hundred' && j + 1 < tokens.length && (tokens[j + 1] in UNITS || tokens[j + 1] in TENS)) { state = 'and'; continue; }
      break;
    }
    if (j === i) { out.push(t); i++; } else { out.push(String(hundreds + rest)); i = j; }
  }
  return out;
}

function tokenize(text) {
  const s = String(text || '').toLowerCase()
    .replace(/(\d+)\s*:\s*(\d+)/g, '$1 verse $2')
    .replace(/(\d+)\s*[-–—]\s*(\d+)/g, '$1 to $2')
    .replace(/[^a-z0-9\s]/g, ' ');
  return convertNumbers(s.split(/\s+/).filter(Boolean));
}

function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const SINGLE_BOOKS = BOOKS.filter((b) => !/\s/.test(b));
function fuzzyBook(token) {
  if (token.length < 6) return null;
  const max = token.length >= 9 ? 2 : 1;
  let best = null, bestD = max + 1;
  for (const b of SINGLE_BOOKS) {
    const d = editDistance(token, b.toLowerCase(), max);
    if (d < bestD) { bestD = d; best = b; }
  }
  return best;
}

const VERSE_WORDS = new Set(['verse', 'verses', 'vs', 'versus']);
const RANGE_WORDS = new Set(['to', 'through', 'thru', 'until']);

// Finds the most recent spoken reference. `end` is the token index just past it; `tokenCount`
// the transcript length -- the live engine uses them to tell a finished reference from one still
// being spoken ("John three sixteen" vs "John three").
function parseReference(text) {
  const tokens = tokenize(text);
  let found = null;
  for (let i = 0; i < tokens.length; i++) {
    let book = null, len = 0;
    for (let l = 4; l >= 1 && !book; l--) {
      const key = tokens.slice(i, i + l).join(' ');
      if (i + l <= tokens.length && ALIASES[key]) { book = ALIASES[key]; len = l; }
    }
    if (!book) {
      // Mishearing of a long book name, only trusted when a number follows (reference-shaped)
      const next = tokens[i + 1];
      const nn = tokens[i + 2];
      if (/^\d+$/.test(next || '') || (['chapter', 'chapters'].includes(next) && /^\d+$/.test(nn || ''))) {
        const fz = fuzzyBook(tokens[i]);
        if (fz) { book = fz; len = 1; }
      }
    }
    if (!book) continue;

    let k = i + len;
    if (tokens[k] === 'chapter' || tokens[k] === 'chapters') k++;
    if (!/^\d+$/.test(tokens[k] || '')) continue;
    const chapter = parseInt(tokens[k], 10); k++;
    let verse = null, verseEnd = null;
    if (VERSE_WORDS.has(tokens[k])) k++;
    if (/^\d+$/.test(tokens[k] || '')) {
      verse = parseInt(tokens[k], 10); k++;
      if (RANGE_WORDS.has(tokens[k]) && /^\d+$/.test(tokens[k + 1] || '')) { verseEnd = parseInt(tokens[k + 1], 10); k += 2; }
    }
    found = { book, chapter, verse, verseEnd, end: k, tokenCount: tokens.length, chapterOnly: verse === null };
    i = k - 1;
  }
  return found;
}

function formatRef(r) {
  if (!r) return '';
  if (r.verse === null) return `${r.book} ${r.chapter}`;
  return `${r.book} ${r.chapter}:${r.verse}${r.verseEnd ? '-' + r.verseEnd : ''}`;
}

// ---- verse-text matching ----
const STOP = new Set(('the a an and of to in that he she it is was be for his her their they them thy thee thou ye you unto shall ' +
  'will not but with as from by which who whom this these those i my me we our us at on or if then there were are have had has ' +
  'do did so up out all him be am said').split(' '));

function verseTokens(text) {
  return String(text).toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
}

class VerseIndex {
  constructor(books) {
    this.refs = [];          // [bookName, chapter, verse]
    this.texts = [];
    this.words = [];         // per verse: array of word ids
    this.vocab = new Map();
    this.df = [];
    const bigramSets = [];
    books.forEach(([name, chapters]) => {
      chapters.forEach((verses, ci) => {
        verses.forEach((text, vi) => {
          this.refs.push([name, ci + 1, vi + 1]);
          this.texts.push(text);
          const ids = verseTokens(text).map((w) => {
            let id = this.vocab.get(w);
            if (id === undefined) { id = this.vocab.size; this.vocab.set(w, id); this.df.push(0); }
            return id;
          });
          this.words.push(ids);
          new Set(ids).forEach((id) => { this.df[id]++; });
        });
      });
    });
    this.n = this.refs.length;
    this.byRef = new Map(this.refs.map(([b, c, v], i) => [`${b.toLowerCase()} ${c}:${v}`, i]));
    this.idf = this.df.map((d) => Math.log(this.n / d));
    this.postings = new Map();
    this.words.forEach((ids, v) => {
      new Set(ids).forEach((id) => {
        if (this.df[id] > 1800) return;               // too common to discriminate
        let p = this.postings.get(id);
        if (!p) { p = []; this.postings.set(id, p); }
        p.push(v);
      });
    });
    void bigramSets;
  }

  // Verse object in the same shape the rest of the app uses ({reference, text, verses}), or null
  lookup(reference) {
    const m = /^(.+?)\s+(\d+):(\d+)/.exec(reference || '');
    if (!m) return null;
    const i = this.byRef.get(`${m[1].toLowerCase()} ${m[2]}:${m[3]}`);
    if (i === undefined) return null;
    const [book, chapter, verse] = this.refs[i];
    return { reference: `${book} ${chapter}:${verse}`, text: this.texts[i], verses: [{ book_name: book, chapter, verse, text: this.texts[i] }] };
  }

  static fromFile(file) {
    return new VerseIndex(JSON.parse(fs.readFileSync(file, 'utf8')));
  }

  // text: recent transcript. Returns up to 5 candidates, best first.
  match(text, opts = {}) {
    const win = opts.window || 14;
    const all = verseTokens(text).slice(-win);
    const info = [];                       // informative window words (in vocab, not a stop word)
    all.forEach((w, pos) => {
      const id = this.vocab.get(w);
      if (id !== undefined && !STOP.has(w) && this.postings.has(id)) info.push({ id, pos });
    });
    const uniq = [...new Map(info.map((x) => [x.id, x])).values()];
    if (!uniq.length || uniq.reduce((a, x) => a + this.idf[x.id], 0) < 4.5) return [];
    const score = new Map();
    uniq.forEach(({ id }) => {
      const idf = this.idf[id];
      this.postings.get(id).forEach((v) => score.set(v, (score.get(v) || 0) + idf));
    });
    const top = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
    const winIds = all.map((w) => this.vocab.get(w));
    const out = top.map(([v, base]) => {
      const vw = this.words[v];
      // consecutive window word pairs that also appear consecutively in the verse
      let bigrams = 0;
      for (let i = 0; i + 1 < winIds.length; i++) {
        const a = winIds[i], b = winIds[i + 1];
        if (a === undefined || b === undefined) continue;
        // pairs made only of filler words ("of the", "that he") match everywhere and prove nothing
        if (STOP.has(all[i]) && STOP.has(all[i + 1])) continue;
        for (let j = 0; j + 1 < vw.length; j++) if (vw[j] === a && vw[j + 1] === b) { bigrams++; break; }
      }
      const matched = uniq.filter(({ id }) => vw.includes(id)).length;
      return { v, score: base + bigrams * 2.5, matched, bigrams, vlen: vw.length };
    }).filter((o) => o.bigrams >= 3 || (o.matched >= 3 && o.bigrams >= 2)).sort((a, b) => b.score - a.score).slice(0, 5);
    const best = out[0] ? out[0].score : 1;
    return out.map((o, i) => ({
      ref: { book: this.refs[o.v][0], chapter: this.refs[o.v][1], verse: this.refs[o.v][2] },
      reference: `${this.refs[o.v][0]} ${this.refs[o.v][1]}:${this.refs[o.v][2]}`,
      text: this.texts[o.v],
      score: o.score, matched: o.matched, bigrams: o.bigrams, vlen: o.vlen, informative: uniq.length,
      lead: i === 0 && out[1] ? o.score / Math.max(out[1].score, 0.001) : (i === 0 ? 9 : 0),
      strength: o.score / best
    })).map((c, i) => {
      // 'strong' = safe to put on screen without asking: a long run of consecutive matching words
      // (or many matched rare words) AND clearly ahead of the runner-up. Everything else that
      // survives is a 'likely' candidate for the operator's list.
      c.confidence = i === 0 && (
        (c.bigrams >= 4 && c.matched >= 3 && c.lead >= 1.4) ||
        (c.matched >= 5 && c.bigrams >= 3 && c.lead >= 1.5) ||
        // a short verse that is mostly spoken already (e.g. Psalm 23:1) can't be confused with another
        (c.bigrams >= 4 && c.bigrams / Math.max(1, c.vlen - 1) >= 0.6 && c.lead >= 1.5)
      ) ? 'strong' : 'likely';
      return c;
    });
  }
}

module.exports = { parseReference, formatRef, tokenize, convertNumbers, VerseIndex, BOOKS };

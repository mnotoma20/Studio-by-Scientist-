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
  // Abbreviations and short forms that transcripts produce ("Gen 1:1", "2 Chron 15", "Matt 6")
  const abbr = {
    gen: 'Genesis', exod: 'Exodus', exo: 'Exodus', lev: 'Leviticus', deut: 'Deuteronomy', josh: 'Joshua', judg: 'Judges',
    neh: 'Nehemiah', esth: 'Esther', psa: 'Psalms', ps: 'Psalms', prov: 'Proverbs', eccl: 'Ecclesiastes', ecc: 'Ecclesiastes',
    isa: 'Isaiah', jer: 'Jeremiah', lam: 'Lamentations', ezek: 'Ezekiel', eze: 'Ezekiel', dan: 'Daniel', hos: 'Hosea',
    obad: 'Obadiah', mic: 'Micah', nah: 'Nahum', hab: 'Habakkuk', zeph: 'Zephaniah', zep: 'Zephaniah', hag: 'Haggai',
    zech: 'Zechariah', zec: 'Zechariah', mal: 'Malachi', matt: 'Matthew', mat: 'Matthew', mk: 'Mark', mrk: 'Mark',
    lk: 'Luke', luk: 'Luke', jn: 'John', joh: 'John', rom: 'Romans', gal: 'Galatians', eph: 'Ephesians', phil: 'Philippians',
    col: 'Colossians', titus: 'Titus', philem: 'Philemon', heb: 'Hebrews', jas: 'James', rev: 'Revelation',
    chronicle: 'Chronicles'
  };
  for (const [k, v] of Object.entries(abbr)) if (v !== 'Chronicles') m[k] = v;
  const numAbbr = { sam: 'Samuel', kgs: 'Kings', kings: 'Kings', king: 'Kings', chron: 'Chronicles', chr: 'Chronicles', chronicle: 'Chronicles',
    cor: 'Corinthians', corinthian: 'Corinthians', thess: 'Thessalonians', thes: 'Thessalonians', tim: 'Timothy', pet: 'Peter', jn: 'John', joh: 'John' };
  for (const [k, base] of Object.entries(numAbbr)) {
    const maxN = base === 'John' ? 3 : 2;
    for (let n = 1; n <= maxN; n++) for (const o of ORDINALS[n]) m[`${o} ${k}`] = `${n} ${base}`;
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
    } else {
      // "2 Chronicles chapter 15, please give us from verse 10": a few ordinary words can sit
      // between the chapter and the verse. Stop at anything that looks like another reference.
      for (let g = k; g < Math.min(tokens.length, k + 8); g++) {
        const t = tokens[g];
        if (/^\d+$/.test(t) || ALIASES[t]) break;
        if (VERSE_WORDS.has(t) && /^\d+$/.test(tokens[g + 1] || '')) {
          verse = parseInt(tokens[g + 1], 10); k = g + 2;
          if (RANGE_WORDS.has(tokens[k]) && /^\d+$/.test(tokens[k + 1] || '')) { verseEnd = parseInt(tokens[k + 1], 10); k += 2; }
          break;
        }
      }
    }
    found = { book, chapter, verse, verseEnd, end: k, tokenCount: tokens.length, chapterOnly: verse === null };
    i = k - 1;
  }
  return found;
}

// A verse (and optionally chapter) said without a book -- "from verse 10", "verses 5 to 9",
// "chapter 16 verse 3" -- to be resolved against the passage already being read. Only the most
// recent such phrase counts, and only when no book name sits right before it (that is a full
// reference and parseReference handles it).
function parseRelative(text) {
  const tokens = tokenize(text);
  for (let i = tokens.length - 2; i >= 0; i--) {
    if (!VERSE_WORDS.has(tokens[i]) || !/^\d+$/.test(tokens[i + 1])) continue;
    let chapter = null, from = i;
    if (tokens[i - 2] === 'chapter' && /^\d+$/.test(tokens[i - 1])) { chapter = parseInt(tokens[i - 1], 10); from = i - 2; }
    // a book name just before means a full reference, not a relative one
    let hasBook = false;
    for (let b = Math.max(0, from - 3); b < from; b++) if (ALIASES[tokens[b]]) hasBook = true;
    if (hasBook) return null;
    let k = i + 2, verseEnd = null;
    if (RANGE_WORDS.has(tokens[k]) && /^\d+$/.test(tokens[k + 1] || '')) { verseEnd = parseInt(tokens[k + 1], 10); k += 2; }
    return { chapter, verse: parseInt(tokens[i + 1], 10), verseEnd, end: k, tokenCount: tokens.length };
  }
  return null;
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
    // Where the pastor already is (cursor = {book, chapter, verse}): the next verses of the same
    // chapter are far more likely than the same words anywhere else in the Bible, and a verse
    // already read is unlikely to be wanted again. Behaviour of a human operator who follows along.
    const cur = opts.cursor && opts.cursor.book ? opts.cursor : null;
    const relationOf = (v) => {
      if (!cur) return ['elsewhere', 1];
      const [b, c, vs] = this.refs[v];
      if (b !== cur.book || c !== cur.chapter) return ['elsewhere', 1];
      const cv = cur.verse || 0;
      if (!cur.verse) return ['ahead', 1.4];             // chapter announced, verse not yet known
      if (vs === cv) return ['same', 1.2];
      if (vs > cv && vs <= cv + 8) return ['ahead', 1.5];
      if (vs < cv) return ['behind', 0.6];
      return ['far', 1];
    };
    if (cur) for (const [v, sc] of score) { const [, m] = relationOf(v); if (m !== 1) score.set(v, sc * m); }
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
      // Is it what is being said RIGHT NOW? Informative words among the newest few tokens that are in
      // this verse. Without it, the tail end of the verse just read (or any earlier phrase) can pull
      // in a different verse that happens to end the same way.
      let recent = 0;
      for (let i = Math.max(0, all.length - 7); i < all.length; i++) {
        const id = winIds[i];
        if (id !== undefined && !STOP.has(all[i]) && vw.includes(id)) recent++;
      }
      return { v, score: base + bigrams * 2.5, matched, bigrams, recent, vlen: vw.length, rel: relationOf(v)[0] };
    }).filter((o) => o.bigrams >= 3 || (o.matched >= 3 && o.bigrams >= 2)).sort((a, b) => b.score - a.score).slice(0, 5);
    const best = out[0] ? out[0].score : 1;
    return out.map((o, i) => ({
      ref: { book: this.refs[o.v][0], chapter: this.refs[o.v][1], verse: this.refs[o.v][2] },
      reference: `${this.refs[o.v][0]} ${this.refs[o.v][1]}:${this.refs[o.v][2]}`,
      text: this.texts[o.v],
      score: o.score, matched: o.matched, bigrams: o.bigrams, recent: o.recent, vlen: o.vlen, rel: o.rel, informative: uniq.length,
      lead: i === 0 && out[1] ? o.score / Math.max(out[1].score, 0.001) : (i === 0 ? 9 : 0),
      strength: o.score / best
    })).map((c, i) => {
      // 'strong' = safe to put on screen without asking: a long run of consecutive matching words
      // (or many matched rare words) AND clearly ahead of the runner-up. Everything else that
      // survives is a 'likely' candidate for the operator's list.
      const base = (c.bigrams >= 4 && c.matched >= 3 && c.lead >= 1.4) ||
        (c.matched >= 5 && c.bigrams >= 3 && c.lead >= 1.5) ||
        // a short verse that is mostly spoken already (e.g. Psalm 23:1) can't be confused with another
        (c.bigrams >= 4 && c.bigrams / Math.max(1, c.vlen - 1) >= 0.6 && c.lead >= 1.5);
      // Following along in the same chapter, the next verses need less proof; a verse BEHIND where we
      // are never goes up on its own (only by an explicit reference or a tap)
      const following = (c.rel === 'ahead' || c.rel === 'same') && c.bigrams >= 3 && c.matched >= 2 && c.lead >= 1.3;
      c.confidence = i === 0 && c.rel !== 'behind' && c.recent >= 2 && (base || following) ? 'strong' : 'likely';
      return c;
    });
  }
}

module.exports = { parseReference, parseRelative, formatRef, tokenize, convertNumbers, VerseIndex, BOOKS };

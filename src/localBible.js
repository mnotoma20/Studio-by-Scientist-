// Public-domain Bible text that ships inside the app, so scripture works with no internet.
// KJV is assets/kjv.json (also used by the live matcher); the rest are assets/bible/<code>.json.gz,
// all in the same [[bookName, [[verse text, ...], ...chapters]], ...] shape. Results use the same
// shapes bible-api.com returns, so callers don't care which source answered.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUNDLED = new Set(['kjv', 'asv', 'bsb', 'darby', 'ylt']);
const loaded = new Map();   // code -> Map(lowercased book name -> { name, chapters })

function has(code) { return BUNDLED.has(String(code || '').toLowerCase()); }

function load(code = 'kjv') {
  code = String(code).toLowerCase();
  if (!has(code)) return null;
  if (loaded.has(code)) return loaded.get(code);
  const assets = path.join(__dirname, '..', 'assets');
  const raw = code === 'kjv'
    ? fs.readFileSync(path.join(assets, 'kjv.json'), 'utf8')
    : zlib.gunzipSync(fs.readFileSync(path.join(assets, 'bible', `${code}.json.gz`))).toString('utf8');
  const books = new Map(JSON.parse(raw).map(([name, chapters]) => [name.toLowerCase(), { name, chapters }]));
  loaded.set(code, books);
  return books;
}

const ALIASES = {
  psalm: 'psalms', 'song of songs': 'song of solomon', 'songs of solomon': 'song of solomon',
  revelations: 'revelation', 'revelation of john': 'revelation',
};

function findBook(name, code) {
  const key = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const all = load(code);
  return (all && all.get(ALIASES[key] || key)) || null;
}

function verseObjects(book, chapter, from, to) {
  const verses = book.chapters[chapter - 1];
  if (!verses) return null;
  const last = Math.min(to, verses.length);
  if (from < 1 || from > last) return null;
  const out = [];
  for (let v = from; v <= last; v++) out.push({ book_name: book.name, chapter, verse: v, text: verses[v - 1] });
  return out;
}

// Whole chapter: [{ book_name, chapter, verse, text }] or null
function getChapter(bookName, chapter, code = 'kjv') {
  const book = findBook(bookName, code);
  if (!book) return null;
  return verseObjects(book, Number(chapter), 1, Infinity);
}

// "John 3:16", "John 3:16-18", "Psalm 23" -> { reference, text, verses } or null
function lookup(reference, code = 'kjv') {
  const m = String(reference || '').trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/);
  if (!m) return null;
  const book = findBook(m[1], code);
  if (!book) return null;
  const chapter = parseInt(m[2], 10);
  const from = m[3] ? parseInt(m[3], 10) : 1;
  const to = m[3] ? (m[4] ? parseInt(m[4], 10) : from) : Infinity;
  const verses = verseObjects(book, chapter, from, to);
  if (!verses) return null;
  const first = verses[0].verse, last = verses[verses.length - 1].verse;
  const range = !m[3] ? '' : (first === last ? `:${first}` : `:${first}-${last}`);
  return {
    reference: `${book.name} ${chapter}${range}`,
    text: verses.map((v) => v.text).join(' '),
    verses,
  };
}

module.exports = { getChapter, lookup, has };

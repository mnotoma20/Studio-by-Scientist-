// The KJV text that ships inside the app (assets/kjv.json), so scripture works with no internet.
// Same result shapes bible-api.com returns, so callers don't care which source answered.
const fs = require('fs');
const path = require('path');

let books = null;   // lowercased name -> { name, chapters: [[verse text, ...], ...] }

function load() {
  if (books) return books;
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'kjv.json'), 'utf8'));
  books = new Map(raw.map(([name, chapters]) => [name.toLowerCase(), { name, chapters }]));
  return books;
}

const ALIASES = {
  psalm: 'psalms', 'song of songs': 'song of solomon', 'songs of solomon': 'song of solomon',
  revelations: 'revelation', 'revelation of john': 'revelation',
};

function findBook(name) {
  const key = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const all = load();
  return all.get(ALIASES[key] || key) || null;
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
function getChapter(bookName, chapter) {
  const book = findBook(bookName);
  if (!book) return null;
  return verseObjects(book, Number(chapter), 1, Infinity);
}

// "John 3:16", "John 3:16-18", "Psalm 23" -> { reference, text, verses } or null
function lookup(reference) {
  const m = String(reference || '').trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/);
  if (!m) return null;
  const book = findBook(m[1]);
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

module.exports = { getChapter, lookup };

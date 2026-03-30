// Bible verse fetcher
const bibleBooks = {
  'gen': 'Genesis', 'genesis': 'Genesis',
  'exo': 'Exodus', 'exodus': 'Exodus',
  'lev': 'Leviticus', 'leviticus': 'Leviticus',
  'num': 'Numbers', 'numbers': 'Numbers',
  'deut': 'Deuteronomy', 'deuteronomy': 'Deuteronomy',
  'josh': 'Joshua', 'joshua': 'Joshua',
  'judg': 'Judges', 'judges': 'Judges',
  'ruth': 'Ruth',
  '1sam': '1 Samuel', '1 sam': '1 Samuel',
  '2sam': '2 Samuel', '2 sam': '2 Samuel',
  '1kings': '1 Kings', '1 kings': '1 Kings',
  '2kings': '2 Kings', '2 kings': '2 Kings',
  'ps': 'Psalms', 'psalm': 'Psalms', 'psalms': 'Psalms',
  'prov': 'Proverbs', 'proverbs': 'Proverbs',
  'isa': 'Isaiah', 'isaiah': 'Isaiah',
  'jer': 'Jeremiah', 'jeremiah': 'Jeremiah',
  'ezek': 'Ezekiel', 'ezekiel': 'Ezekiel',
  'dan': 'Daniel', 'daniel': 'Daniel',
  'matt': 'Matthew', 'matthew': 'Matthew',
  'mk': 'Mark', 'mark': 'Mark',
  'lk': 'Luke', 'luke': 'Luke',
  'jn': 'John', 'john': 'John',
  'acts': 'Acts',
  'rom': 'Romans', 'romans': 'Romans',
  '1cor': '1 Corinthians', '1 cor': '1 Corinthians',
  '2cor': '2 Corinthians', '2 cor': '2 Corinthians',
  'gal': 'Galatians', 'galatians': 'Galatians',
  'eph': 'Ephesians', 'ephesians': 'Ephesians',
  'phil': 'Philippians', 'philippians': 'Philippians',
  'col': 'Colossians', 'colossians': 'Colossians',
  '1thess': '1 Thessalonians', '1 thess': '1 Thessalonians',
  '2thess': '2 Thessalonians', '2 thess': '2 Thessalonians',
  '1tim': '1 Timothy', '1 tim': '1 Timothy',
  '2tim': '2 Timothy', '2 tim': '2 Timothy',
  'titus': 'Titus',
  'phile': 'Philemon', 'philemon': 'Philemon',
  'heb': 'Hebrews', 'hebrews': 'Hebrews',
  'james': 'James', 'jas': 'James',
  '1pet': '1 Peter', '1 pet': '1 Peter',
  '2pet': '2 Peter', '2 pet': '2 Peter',
  '1jn': '1 John', '1 jn': '1 John',
  '2jn': '2 John', '2 jn': '2 John',
  '3jn': '3 John', '3 jn': '3 John',
  'jude': 'Jude',
  'rev': 'Revelation', 'revelation': 'Revelation'
};

function parseVerseReference(input) {
  // "jn 3:16" -> {book: "John", chapter: 3, verse: 16}
  const cleaned = input.toLowerCase().trim();
  const parts = cleaned.split(/\s+/);
  
  if (parts.length < 2) return null;
  
  const bookAbbr = parts.slice(0, -1).join(' ');
  const ref = parts[parts.length - 1];
  
  const bookName = bibleBooks[bookAbbr];
  if (!bookName) return null;
  
  if (ref.includes(':')) {
    const [chapter, verse] = ref.split(':').map(n => parseInt(n));
    return { book: bookName, chapter, verse };
  } else {
    return { book: bookName, chapter: parseInt(ref), verse: 1 };
  }
}

async function getVerse(book, chapter, verse) {
  try {
    // Using Bible API (free, no key needed)
    const url = `https://bible-api.com/${book}+${chapter}:${verse}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      reference: data.reference,
      text: data.text,
      translation: data.translation_name || 'KJV'
    };
  } catch (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
}

module.exports = { parseVerseReference, getVerse };
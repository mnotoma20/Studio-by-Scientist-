#!/usr/bin/env node
'use strict';
// Single source of truth for the legal documents: legal/*.md. Run `node scripts/build-legal.js`
// after editing them. It writes
//   - src/screens/legal/<name>.html     standalone page the desktop app opens (works offline, any browser)
//   - landing/content/<name>.html       body fragment the website's /terms and /privacy pages render
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = ['terms-of-service', 'privacy-policy'];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '<a href="mailto:$1">$1</a>');
}

// Markdown subset: #, ##, ### headings, "- " lists, paragraphs, **bold**, [text](url), bare emails
function toHtml(md) {
  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push('</ul>'); list = null; } };
  md.split(/\r?\n/).forEach((raw) => {
    const line = raw.trimEnd();
    if (!line.trim()) { closeList(); return; }
    let m;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) { closeList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); return; }
    if ((m = /^-\s+(.*)$/.exec(line))) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(m[1])}</li>`); return; }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  });
  closeList();
  return out.join('\n');
}

const PAGE = (title, body) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} - Studio by Scientist</title>
<style>
  body{margin:0;background:#0f0f1e;color:#e5e7eb;font:16px/1.7 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;}
  main{max-width:760px;margin:0 auto;padding:48px 24px 80px;}
  h1{font-size:34px;color:#fff;margin:0 0 6px;}
  h2{font-size:21px;color:#c4b5fd;margin:36px 0 10px;}
  h3{font-size:17px;color:#fff;margin:24px 0 8px;}
  p{margin:0 0 14px;} ul{margin:0 0 16px;padding-left:22px;} li{margin-bottom:6px;}
  strong{color:#fff;} a{color:#a78bfa;}
</style></head><body><main>
${body}
</main></body></html>
`;

for (const name of DOCS) {
  const md = fs.readFileSync(path.join(ROOT, 'legal', `${name}.md`), 'utf8');
  const body = toHtml(md);
  const title = (/^#\s+(.*)$/m.exec(md) || [])[1] || name;
  fs.writeFileSync(path.join(ROOT, 'src', 'screens', 'legal', `${name}.html`), PAGE(title, body));
  fs.writeFileSync(path.join(ROOT, 'landing', 'content', `${name}.html`), body + '\n');
  console.log('built', name);
}

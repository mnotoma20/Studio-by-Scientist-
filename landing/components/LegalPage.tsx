import fs from 'fs'
import path from 'path'
import Footer from './Footer'

// Renders one of the legal documents. The HTML comes from legal/*.md in the repo root via
// scripts/build-legal.js (our own content, never user input), so the website and the desktop
// app always show the same text.
export default function LegalPage({ file }: { file: 'terms-of-service' | 'privacy-policy' }) {
  const html = fs.readFileSync(path.join(process.cwd(), 'content', `${file}.html`), 'utf8')
  return (
    <>
      <main className="min-h-screen px-6 pt-10 pb-20">
        <div className="max-w-3xl mx-auto">
          <a href="/" className="text-sm inline-block mb-8 hover:text-white transition-colors" style={{ color: '#a78bfa' }}>
            ← Back to Studio by Scientist
          </a>
          <article className="legal" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </main>
      <Footer />
    </>
  )
}

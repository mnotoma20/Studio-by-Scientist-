import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service — Studio by Scientist',
  description: 'The terms that apply when you use Studio by Scientist.',
}

export default function TermsPage() {
  return <LegalPage file="terms-of-service" />
}

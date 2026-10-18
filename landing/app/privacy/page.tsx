import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy — Studio by Scientist',
  description: 'How Studio by Scientist collects, uses and protects your information.',
}

export default function PrivacyPage() {
  return <LegalPage file="privacy-policy" />
}

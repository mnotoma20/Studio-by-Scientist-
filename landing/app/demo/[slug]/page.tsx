import type { Metadata } from 'next'
import DemoPage from '@/components/DemoPage'

// Personal links are for one church each; keep them out of search results.
export const metadata: Metadata = {
  title: 'Studio by Scientist — Demo',
  robots: { index: false, follow: false },
}

export default function Page({ params }: { params: { slug: string } }) {
  return <DemoPage slug={params.slug} />
}

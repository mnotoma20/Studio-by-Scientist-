import dynamic from 'next/dynamic'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import ProductShowcase from '@/components/ProductShowcase'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import AIShowcase from '@/components/AIShowcase'
import Pricing from '@/components/Pricing'
import Testimonials from '@/components/Testimonials'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), { ssr: false })

export default function Home() {
  return (
    <main className="relative">
      <ThreeBackground />
      <Nav />
      <Hero />
      <ProductShowcase />
      <HowItWorks />
      <Features />
      <AIShowcase />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}

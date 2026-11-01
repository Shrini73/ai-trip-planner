import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import DestinationsCarousel from '@/components/DestinationsCarousel';
import FeaturesSection from '@/components/FeaturesSection';
import ReviewsSection from '@/components/ReviewsSection';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <DestinationsCarousel />
      <FeaturesSection />
      <ReviewsSection />
      <PricingSection />

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-purple-900/20 to-dark-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="badge badge-primary inline-flex mb-6">
            <Sparkles className="w-3 h-3" /> Ready to Explore?
          </div>
          <h2 className="font-display font-bold text-5xl sm:text-6xl text-white mb-6 leading-tight">
            Your Next Adventure
            <br />
            <span className="gradient-text">Starts Here</span>
          </h2>
          <p className="text-dark-400 text-xl mb-10 max-w-2xl mx-auto">
            Join 50,000+ travelers who use VOYAGE AI to plan unforgettable trips. 
            Free to start, no credit card required.
          </p>
          <Link
            href="/create-trip"
            className="btn-primary inline-flex items-center gap-3 text-lg py-4 px-8 group"
          >
            <Sparkles className="w-5 h-5" />
            Start Planning for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

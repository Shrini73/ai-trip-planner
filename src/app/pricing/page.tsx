import Navbar from '@/components/Navbar';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';
import { HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How does the AI create my travel itinerary?',
    a: 'VOYAGE AI uses Google Gemini models to synthesize real-world geographic data, attractions, local dining recommendations, and budget guidelines into a coherent, day-by-day plan personalized to your preferences.',
  },
  {
    q: 'Can I customize or modify my trip after it is generated?',
    a: 'Yes! Every itinerary includes our AI Travel Assistant chat. You can ask for hotel swaps, alternative dining options, or rainy-day backup activities on the fly.',
  },
  {
    q: 'Can I export my plan for offline use?',
    a: 'Absolutely. Every plan can be exported as a clean, multi-page PDF briefing that you can save to your mobile device or print for international travel.',
  },
  {
    q: 'Is there a free trial for the Voyager plan?',
    a: 'Yes, the Voyager plan comes with a full 7-day free trial. You can cancel at any time with no questions asked.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />

      <main className="flex-1 pt-16">
        <PricingSection />

        {/* FAQ Section */}
        <section className="py-16 border-t border-white/5 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <div className="badge badge-primary inline-flex mb-3">
                <HelpCircle className="w-3 h-3" /> FAQ
              </div>
              <h2 className="font-display font-bold text-3xl text-white">
                Frequently Asked <span className="gradient-text">Questions</span>
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="glass-card p-6">
                  <h3 className="font-semibold text-white text-base mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-dark-400 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


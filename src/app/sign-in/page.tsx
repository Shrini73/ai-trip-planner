'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LogIn, Compass, Sparkles, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { loginUser } from '@/lib/auth';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/my-trips';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError('');

    try {
      await loginUser(email, password);
      router.push(redirectUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoUser = async (demoEmail: string) => {
    setEmail(demoEmail);
    setIsSubmitting(true);
    setError('');
    try {
      await loginUser(demoEmail, 'voyage_demo_2026');
      router.push(redirectUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card max-w-md w-full p-8 relative">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
          <Compass className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display font-bold text-2xl text-white">
          Welcome to <span className="gradient-text">VOYAGE AI</span>
        </h1>
        <p className="text-dark-400 text-sm mt-1">
          {redirectUrl.includes('checkout')
            ? 'Sign in or create an account to proceed to checkout.'
            : 'Sign in to manage and sync your AI travel itineraries.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="traveler@example.com"
            className="input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">
            Password <span className="text-dark-500 font-normal lowercase">(optional for instant sign in)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>{redirectUrl.includes('checkout') ? 'Continue to Checkout' : 'Continue to My Trips'}</span>
            </>
          )}
        </button>
      </form>

      {/* Demo Quick Accounts for fast testing */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="text-[11px] text-dark-400 mb-2 text-center">Fast Testing Account:</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoUser('alex.explorer@voyageai.test')}
            disabled={isSubmitting}
            className="flex-1 py-1.5 px-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-dark-300 transition-colors text-center truncate border border-white/5"
          >
            alex@voyageai.test
          </button>
        </div>
      </div>

      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <span className="relative px-3 text-xs text-dark-500 bg-[#1e293b] rounded-full">
          Instant Access
        </span>
      </div>

      <button
        onClick={() => router.push('/create-trip')}
        className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
      >
        <Sparkles className="w-4 h-4 text-primary-400" />
        Start Planning as Guest
      </button>

      <div className="mt-6 text-center text-xs text-dark-500 flex items-center justify-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-primary-400" />
        <span>Private & securely encrypted</span>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <Suspense fallback={
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        }>
          <SignInContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

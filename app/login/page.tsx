"use client";

import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { signInWithRedirect } from "aws-amplify/auth";
import Link from "next/link";
import { Target, Zap, Shield, ChevronLeft } from "lucide-react";

// Google Icon SVG component - larger for prominent button
function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginContent() {
  const { user, authStatus } = useAuthenticator((context) => [context.user, context.authStatus]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/dashboard';

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      router.push(redirect);
    }
  }, [user, authStatus, router, redirect]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect({ provider: 'Google' });
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  // Custom components for Authenticator
  const components = {
    Header() {
      return (
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <Target className="w-8 h-8 text-[#00ff9d]" />
            <span className="text-2xl font-black tracking-tight text-white">
              FPS<span className="text-[#00ff9d]">Trainer</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to access your AI coaching dashboard</p>
        </div>
      );
    },
    Footer() {
      return (
        <div className="text-center mt-6 pt-6 border-t border-white/10">
          <p className="text-gray-500 text-xs">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-[#00ff9d] hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[#00ff9d] hover:underline">Privacy Policy</Link>
          </p>
        </div>
      );
    },
    SignIn: {
      Header() {
        return (
          <div className="mb-6">
            {/* Recommended Badge */}
            <div className="flex justify-center mb-3">
              <span className="px-3 py-1 text-xs font-semibold bg-[#00ff9d]/10 text-[#00ff9d] rounded-full border border-[#00ff9d]/20">
                ⚡ Fastest Way to Sign In
              </span>
            </div>
            
            {/* Google Sign-In Button - PROMINENT */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-4 px-6 py-4 rounded-xl 
                         bg-white hover:bg-gray-50 text-gray-800 font-bold text-lg
                         transition-all duration-200 mb-2
                         shadow-[0_4px_20px_rgba(255,255,255,0.15)] 
                         hover:shadow-[0_6px_30px_rgba(255,255,255,0.25)] 
                         hover:-translate-y-1 active:translate-y-0
                         border-2 border-white/50"
            >
              <GoogleIcon />
              <span>Sign in with Google</span>
            </button>
            <p className="text-center text-gray-500 text-xs mb-6">No password needed • Instant access</p>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0a0a0a] text-gray-600 text-xs">or use email</span>
              </div>
            </div>
          </div>
        );
      },
    },
    SignUp: {
      Header() {
        return (
          <div className="mb-6">
            {/* Recommended Badge */}
            <div className="flex justify-center mb-3">
              <span className="px-3 py-1 text-xs font-semibold bg-[#00ff9d]/10 text-[#00ff9d] rounded-full border border-[#00ff9d]/20">
                ⚡ Fastest Way to Sign Up
              </span>
            </div>
            
            {/* Google Sign-Up Button - PROMINENT */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-4 px-6 py-4 rounded-xl 
                         bg-white hover:bg-gray-50 text-gray-800 font-bold text-lg
                         transition-all duration-200 mb-2
                         shadow-[0_4px_20px_rgba(255,255,255,0.15)] 
                         hover:shadow-[0_6px_30px_rgba(255,255,255,0.25)] 
                         hover:-translate-y-1 active:translate-y-0
                         border-2 border-white/50"
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
            </button>
            <p className="text-center text-gray-500 text-xs mb-6">No password needed • Instant account</p>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0a0a0a] text-gray-600 text-xs">or use email</span>
              </div>
            </div>
          </div>
        );
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-gray-400 hover:text-[#00ff9d] transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff9d]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ff9d]/3 rounded-full blur-[150px]" />
          </div>

          {/* Authenticator with custom styling */}
          <div className="relative z-10">
            <Authenticator 
              components={components}
              hideSignUp={false}
            />
          </div>

          {/* Features reminder */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Zap className="w-5 h-5 text-[#00ff9d] mx-auto mb-2" />
              <p className="text-xs text-gray-500">AI Analysis</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Target className="w-5 h-5 text-[#00ff9d] mx-auto mb-2" />
              <p className="text-xs text-gray-500">Pro Coaching</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <Shield className="w-5 h-5 text-[#00ff9d] mx-auto mb-2" />
              <p className="text-xs text-gray-500">Secure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse text-[#00ff9d]">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

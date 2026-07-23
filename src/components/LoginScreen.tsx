import React from 'react';
import { Sparkles, Shield, UserCheck, ArrowRight, Globe } from 'lucide-react';

interface LoginScreenProps {
  onGoogleLogin: () => void;
  onGuestLogin: () => void;
}

export function LoginScreen({ onGoogleLogin, onGuestLogin }: LoginScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-center w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-6 text-blue-400">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-white">
          Nexus AI Workspace
        </h1>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          Your intelligent executive assistant for Google Calendar, Tasks, Gmail, Contacts, and Drive. Sign in with Google or explore instantly in Guest Mode.
        </p>

        <div className="space-y-4">
          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-100 transition-all duration-200 shadow-lg group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-xs text-zinc-500 uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <button
            onClick={onGuestLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-medium hover:bg-zinc-800 hover:text-white transition-all duration-200 group"
          >
            <UserCheck className="w-5 h-5 text-blue-400" />
            <span>Continue as Guest (Demo Mode)</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Secure OAuth 2.0
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            Sandbox Ready
          </span>
        </div>
      </div>
    </div>
  );
}

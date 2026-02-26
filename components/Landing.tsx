import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Shield, Layout, Zap, Keyboard, Hand, Sparkles } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center p-8 selection:bg-black/10 overflow-y-auto">
      <div className="max-w-5xl w-full space-y-24 py-16">
        
        {/* Hero Section */}
        <div className="text-center space-y-8">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter">
            7H<span className="text-4xl md:text-6xl align-top">.ai</span>
          </h1>
          <p className="text-2xl md:text-3xl font-medium text-black/60 leading-tight max-w-3xl mx-auto">
            A fully accessible, hand-tracking powered communication tool and AI assistant.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link 
              to="/auth" 
              className="px-8 py-4 bg-black text-white text-xl font-bold border-4 border-black hover:bg-white hover:text-black transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              Get Started
            </Link>
            <Link 
              to="/app" 
              className="px-8 py-4 bg-white text-black text-xl font-bold border-4 border-black hover:bg-black/5 transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              Try as Guest
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">Meet Mia AI</h2>
            <p className="text-xl font-bold uppercase tracking-widest mt-4">Your Smart Assistant. Hands-Free.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-2 transition-transform">
              <Hand className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-black uppercase mb-4">Hand Tracking</h3>
              <p className="text-black/70 font-medium">Navigate and type entirely using hand gestures. No mouse or keyboard required. Perfect for accessibility.</p>
            </div>

            <div className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-2 transition-transform">
              <Sparkles className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-black uppercase mb-4">Mia AI</h3>
              <p className="text-black/70 font-medium">Powered by Gemini AI. Ask questions, get answers, and have them spoken back to you instantly.</p>
            </div>

            <div className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-2 transition-transform">
              <Keyboard className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-black uppercase mb-4">Virtual Keyboard</h3>
              <p className="text-black/70 font-medium">A massive, easy-to-use virtual keyboard with dwell-clicking. Includes text-to-speech capabilities.</p>
            </div>

            <div className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-2 transition-transform">
              <Layout className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-black uppercase mb-4">Clean UI</h3>
              <p className="text-black/70 font-medium">Brutalist, high-contrast design. No clutter, just content. Easy to read and interact with.</p>
            </div>

            <div className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-2 transition-transform">
              <Shield className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-black uppercase mb-4">Secure & Private</h3>
              <p className="text-black/70 font-medium">Your data stays yours. Secure authentication system and local storage for preferences.</p>
            </div>

            <div className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-2 transition-transform">
              <Zap className="w-12 h-12 mb-6" />
              <h3 className="text-2xl font-black uppercase mb-4">Lightning Fast</h3>
              <p className="text-black/70 font-medium">Optimized performance with smooth 60fps animations and zero layout shifts during interactions.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

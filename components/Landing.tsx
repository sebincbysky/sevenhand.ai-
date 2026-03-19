import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Keyboard, Hand, Sparkles, Target, User, Radio, ArrowRight } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200 overflow-x-hidden">
      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter">7H<span className="text-zinc-900">.ai</span></div>
        <div className="flex gap-4">
          <Link to="/app" className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors duration-500 ease-out">Guest Mode</Link>
          <Link to="/auth" className="px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-all duration-500 ease-out flex items-center gap-2 group">Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-500 ease-out" /></Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 space-y-32">
        
        {/* Tracking Modes */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Three ways to interact.</h2>
            <p className="text-zinc-500 mt-4 text-lg">Seamlessly switch between tracking modes based on your environment and needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                <Hand className="w-6 h-6 text-zinc-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Hand Tracking</h3>
              <p className="text-zinc-500 leading-relaxed">Move your hand to control the cursor. Pinch your thumb and index finger to instantly select.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                <User className="w-6 h-6 text-zinc-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Head Tracking</h3>
              <p className="text-zinc-500 leading-relaxed">Use your nose as a precise pointer. Open your mouth quickly twice to double-click effortlessly.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                <Radio className="w-6 h-6 text-zinc-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Next Link</h3>
              <p className="text-zinc-500 leading-relaxed">Ideal for low-light environments. Use any red laser or LED to guide the cursor with high accuracy.</p>
            </div>
          </div>
        </section>

        {/* Features Bento */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Powerful features.</h2>
            <p className="text-zinc-500 mt-4 text-lg">Everything you need for seamless digital communication.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out">
              <Keyboard className="w-8 h-8 mb-6 text-zinc-900" />
              <h3 className="text-xl font-semibold mb-3">Virtual Keyboard</h3>
              <p className="text-zinc-500">A massive, highly optimized interface with dwell-clicking and instant gesture selection.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out">
              <Shield className="w-8 h-8 mb-6 text-zinc-900" />
              <h3 className="text-xl font-semibold mb-3">Privacy First</h3>
              <p className="text-zinc-500">Your data stays yours. Secure authentication and local storage for all your preferences.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm md:col-span-2 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ease-out">
              <Target className="w-8 h-8 mb-6 text-zinc-900" />
              <h3 className="text-2xl font-semibold mb-3">Our Mission</h3>
              <p className="text-zinc-500 text-lg max-w-xl">We believe everyone deserves seamless access to the digital world. 7H.ai is built to break down barriers through intuitive, hands-free technology.</p>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-2xl font-bold tracking-tighter">7H<span className="text-zinc-900">.ai</span></div>
        </div>
      </footer>
    </div>
  );
};

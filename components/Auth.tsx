import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      // Mock database save/login
      localStorage.setItem('7h_user', email);
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8 selection:bg-black/10">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-4xl font-black tracking-tighter mb-8 text-center uppercase">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 text-xl border-4 border-black bg-white focus:outline-none focus:bg-black/5 transition-colors placeholder-black/30 font-medium"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 text-xl border-4 border-black bg-white focus:outline-none focus:bg-black/5 transition-colors placeholder-black/30 font-medium"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-4 bg-black text-white text-xl font-bold border-4 border-black hover:bg-white hover:text-black transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4"
          >
            {isLogin ? 'Enter' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold uppercase tracking-wider text-black/60 hover:text-black underline underline-offset-4 decoration-2"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

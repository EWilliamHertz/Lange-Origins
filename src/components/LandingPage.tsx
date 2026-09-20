import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cloud, Axe, Hammer, Shield, Globe } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

interface LandingPageProps {
  onLoginSuccess: (user: any) => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState("");

  const QUOTES = [
    "So many quests!",
    "Digging the gold!",
    "Just one more block...",
    "Beware of the lava!",
    "Crafting the perfect pickaxe.",
    "The admin is always watching.",
    "Build, survive, thrive.",
    "Don't dig straight down!"
  ];

  useEffect(() => {

    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add a timeout to prevent hanging forever
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Authentication timed out (Popup might be blocked or hung). Try again.")), 30000));
      const user = await Promise.race([loginWithGoogle(), timeoutPromise]) as any;
      
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
      setLoading(false);
    }
    // Don't set loading to false in finally if it succeeded, because it's unmounting and we want the button to stay "Authenticating..." during the transition.
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-blue-400 via-blue-500 to-emerald-600 font-sans">
      
      
      {/* Sky & Clouds Background */}
      <div className="absolute inset-0 z-0">
        {/* Sun */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 360] }}
          transition={{ scale: { repeat: Infinity, duration: 10, ease: "easeInOut" }, rotate: { repeat: Infinity, duration: 200, ease: "linear" } }}
          className="absolute top-10 right-20 w-32 h-32 bg-yellow-300 rounded-full blur-[2px] shadow-[0_0_100px_40px_rgba(253,224,71,0.6)]"
        />

        <motion.div 
          animate={{ x: ['-10%', '110%'] }} 
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="absolute top-20 left-0 text-white/40"
        >
          <Cloud size={120} />
        </motion.div>
        
        <motion.div 
          animate={{ x: ['-20%', '120%'] }} 
          transition={{ repeat: Infinity, duration: 12, ease: "linear", delay: 10 }}
          className="absolute top-40 left-0 text-white/30"
        >
          <Cloud size={180} />
        </motion.div>
        <motion.div 
          animate={{ x: ['-15%', '115%'] }} 
          transition={{ repeat: Infinity, duration: 10, ease: "linear", delay: 25 }}
          className="absolute top-10 left-0 text-white/50"
        >
          <Cloud size={90} />
        </motion.div>
        
        {/* Additional slow moving clouds */}
        <motion.div 
          animate={{ x: ['-30%', '130%'] }} 
          transition={{ repeat: Infinity, duration: 16, ease: "linear", delay: 5 }}
          className="absolute top-32 left-0 text-white/20"
        >
          <Cloud size={200} />
        </motion.div>
      </div>

      {/* Animated Foreground Scene */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-emerald-900 to-transparent z-0">
        
        {/* Tree and players on the left */}
        <div className="absolute bottom-10 left-[15%] md:left-[20%] flex items-end gap-6 text-white/70">
          
          {/* Player standing by the tree */}
          <div className="flex flex-col items-center pb-0">
            <div className="w-5 h-5 bg-purple-200 rounded-sm mb-0.5 shadow-sm" />
            <div className="w-5 h-8 bg-purple-500 rounded-sm shadow-sm" />
          </div>

          {/* Player cutting tree */}
          <div className="flex items-end gap-1">
            <div className="flex flex-col items-center relative z-10 pb-0">
              <div className="w-5 h-5 bg-red-200 rounded-sm mb-0.5 shadow-sm" />
              <div className="w-5 h-8 bg-red-500 rounded-sm flex items-start justify-end shadow-sm" />
              <motion.div
                className="absolute top-2 left-4"
                animate={{ rotate: [0, -60, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                style={{ originX: 0, originY: 1 }}
              >
                <Axe size={20} className="text-stone-300" />
              </motion.div>
            </div>
            {/* The Tree */}
            <div className="w-8 h-32 bg-amber-900 rounded-t-sm relative ml-2 shadow-sm">
              <div className="absolute -top-14 -left-10 w-28 h-28 bg-emerald-600 rounded-full shadow-lg" />
              <div className="absolute -top-10 -right-6 w-20 h-20 bg-emerald-500 rounded-full shadow-lg" />
            </div>
          </div>
        </div>

        {/* Player building stairs and climbing */}
        <div className="absolute bottom-10 right-[15%] md:right-[25%] flex items-end gap-4 text-white/70">
          
          {/* Stairs */}
          <div className="flex items-end">
            <div className="w-8 h-8 bg-stone-400 border border-stone-500 rounded-sm shadow-sm" />
            <div className="w-8 h-16 bg-stone-400 border border-stone-500 rounded-sm shadow-sm" />
            <div className="w-8 h-24 bg-stone-400 border border-stone-500 rounded-sm shadow-sm relative">
               {/* Player climbing/hopping on top of stairs */}
               <motion.div 
                 className="absolute -top-14 left-1 flex flex-col items-center"
                 animate={{ y: [0, -15, 0] }}
                 transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
               >
                 <div className="w-5 h-5 bg-blue-200 rounded-sm mb-0.5 shadow-sm" />
                 <div className="w-5 h-8 bg-blue-500 rounded-sm shadow-sm" />
               </motion.div>
            </div>
          </div>

          {/* Builder on the ground */}
          <div className="flex flex-col gap-1 ml-4 pb-0 relative">
             <motion.div 
               animate={{ y: [0, -15, 0], rotate: [0, 45, 0] }} 
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
               className="absolute -top-6 -left-2 z-10"
             >
               <Hammer size={24} className="text-stone-300" />
             </motion.div>
             <div className="flex flex-col items-center">
               <div className="w-5 h-5 bg-amber-200 rounded-sm mb-0.5 shadow-sm" />
               <div className="w-5 h-8 bg-amber-600 rounded-sm shadow-sm" />
             </div>
          </div>
        </div>
      </div>

      {/* Center UI Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-neutral-900/60 backdrop-blur-2xl border border-white/10 p-10 md:p-14 rounded-[2.5rem] shadow-2xl max-w-2xl text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
            <Globe className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-400 mb-2 tracking-tight drop-shadow-sm">
            Lange: Origins
          </h1>
          <p className="text-emerald-300 italic mb-6 font-medium text-lg">"{quote}"</p>
          <p className="text-lg md:text-xl text-neutral-300 mb-10 leading-relaxed font-medium max-w-lg">
            Shape your world, claim your land, and survive together. A persistent multiplayer sandbox where every block mined belongs to you.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm text-neutral-300 font-semibold bg-white/5 p-4 rounded-2xl border border-white/5 w-full">
            <div className="flex items-center gap-2"><Globe size={18} className="text-blue-400" /> Persistent Worlds</div>
            <div className="flex items-center gap-2"><Hammer size={18} className="text-amber-400" /> Infinite Crafting</div>
            <div className="flex items-center gap-2"><Shield size={18} className="text-emerald-400" /> Land Protection</div>
          </div>

          {error && <div className="text-red-400 font-bold mb-6 bg-red-900/50 p-3 rounded-xl border border-red-500/30 w-full">{error}</div>}

          <div className="flex flex-col items-center justify-center w-full max-w-xs gap-3">
            <button 
              id="google-login-btn"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-8 py-3.5 bg-white text-neutral-900 font-bold rounded-2xl hover:bg-neutral-200 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              <GoogleIcon />
              {loading ? "Authenticating..." : "Login with Google"}
            </button>

            <button
              id="guest-play-btn"
              onClick={() => {
                const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
                const guestUser = {
                  uid: guestId,
                  displayName: 'Adventurer ' + Math.floor(1000 + Math.random() * 9000),
                  email: 'guest@langeorigins.local',
                  isAnonymous: true,
                  isGuest: true
                };
                onLoginSuccess(guestUser);
              }}
              disabled={loading}
              className="w-full py-3 px-6 bg-neutral-900/80 hover:bg-neutral-800/90 text-amber-300 border border-amber-500/30 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all hover:border-amber-400/60 active:scale-[0.98]"
            >
              Play as Guest (Quick Play)
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

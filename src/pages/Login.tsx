import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Package, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export const Login = () => {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore, if not create profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: 'Admin', // First user is Admin for this demo
          branchId: 'default-branch',
          createdAt: serverTimestamp()
        });

        // Also ensure a default branch exists
        await setDoc(doc(db, 'branches', 'default-branch'), {
          name: 'Main Showroom',
          location: 'Downtown HQ',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error(error);
      alert("Login failed. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full" />
      </div>

      {/* Left side: Branding/Visuals */}
      <div className="hidden lg:flex w-1/2 p-24 flex-col justify-between relative z-10">
        <div>
           <div className="flex items-center gap-3 mb-12">
             <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Package size={28} className="text-white" />
             </div>
             <span className="text-white font-black text-3xl tracking-tight">ProTrade<span className="text-indigo-400">.</span></span>
           </div>
           
           <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 max-w-lg"
           >
             <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter">
               Professional Inventory Management <span className="text-indigo-500">Simplified.</span>
             </h1>
             <p className="text-slate-400 text-xl font-medium leading-relaxed">
               Take full control of your business stock, sales, and multi-branch operations with our enterprise-grade POS system.
             </p>
           </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <Zap className="text-indigo-400 mb-2" size={20} />
            <p className="text-white font-bold text-sm">Real-time POS</p>
            <p className="text-slate-500 text-xs">Instant checkout sync</p>
          </div>
          <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <ShieldCheck className="text-emerald-400 mb-2" size={20} />
            <p className="text-white font-bold text-sm">Role Based</p>
            <p className="text-slate-500 text-xs">Secure permissioning</p>
          </div>
          <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <TrendingUp className="text-sky-400 mb-2" size={20} />
            <p className="text-white font-bold text-sm">Deep Analytics</p>
            <p className="text-slate-500 text-xs">Profit & loss tracking</p>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[32px] p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Elevate your business management today.</p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-white border-2 border-slate-100 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:border-indigo-100 transition-all group"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Sign in with Google
          </button>

          <div className="mt-10 pt-10 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">
              By signing in, you agree to our <br/>
              <span className="text-slate-900 font-bold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-slate-900 font-bold hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const TrendingUp = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ChevronRight, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../lib/api'; // Ensure axios instance is imported

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        // 🔥 CHANGE: URL eka '/api/admin/login' walata maru karanna
        const res = await api.post('/admin/login', { email, password });
        
        // Save Token & User
        localStorage.setItem('adminToken', res.data.token); 
        localStorage.setItem('adminUser', JSON.stringify(res.data.user));

        navigate('/admin/dashboard'); 
    } catch (err) {
        setError(err.response?.data?.error || 'Invalid Credentials');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                <Lock className="text-black" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-2">Enter your secure credentials</p>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Email Address</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition"
                    placeholder="admin@myguru.com"
                    required
                />
            </div>
            
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition"
                    placeholder="••••••••"
                    required
                />
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition group disabled:opacity-50"
            >
                {loading ? <Loader className="animate-spin" size={20}/> : 
                <>Secure Login <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
        </form>

        <div className="mt-8 text-center">
            <button onClick={() => navigate('/')} className="text-gray-500 text-sm hover:text-white transition">
                Return to Website
            </button>
        </div>
      </motion.div>
    </div>
  );
}
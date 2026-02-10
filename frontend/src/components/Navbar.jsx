import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User as UserIcon, LayoutDashboard, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png'; 

export default function Navbar() {
  const { user, logout, signInWithGoogle } = useAuth(); 
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/'); } catch (error) { console.error("Logout Error:", error); }
  };

  const handleGoogleLogin = async () => {
      try {
          await signInWithGoogle();
          setIsMobileMenuOpen(false);
      } catch (error) {
          console.error("Login Failed", error);
      }
  };

  const renderProfileImage = (size = "w-10 h-10", fontSize = "text-lg") => {
    if (user?.photoURL) {
      return <img src={user.photoURL} alt="Profile" className={`${size} rounded-full object-cover border-2 border-amber-500/50`} referrerPolicy="no-referrer" />;
    }
    return <div className={`${size} rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-black font-bold ${fontSize} border-2 border-white/10`}>{user?.email?.charAt(0).toUpperCase()}</div>;
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#050505]/80 backdrop-blur-md border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="MyGuru" className="w-10 h-10 object-contain group-hover:scale-105 transition-transform duration-300" />
          <span className="text-2xl font-black text-white tracking-tight">My <span className="text-amber-500">Guru</span></span>
        </Link>

        {/* DESKTOP */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link to="/" className="hover:text-amber-500 transition">Home</Link>
            {/* 🔥 Plans Link REMOVED */}
            <Link to="/services" className="hover:text-amber-500 transition">Services</Link>
            <Link to="/about" className="hover:text-amber-500 transition">About Us</Link>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/chat" className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition flex items-center gap-2 shadow-lg hover:scale-105">
                <MessageCircle size={18} /> Chat with Guru
              </Link>
              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="focus:outline-none transition-transform hover:scale-105">
                  {renderProfileImage()}
                </button>
                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-60 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                        <div className="px-4 py-3 border-b border-white/10 mb-2">
                          <p className="text-sm font-bold text-white truncate">{user.displayName || 'Student'}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"><UserIcon size={16} /> My Profile</Link>
                        {user.email === 'admin@codeaura.com' && <Link to="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"><LayoutDashboard size={16} /> Admin Panel</Link>}
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition mt-1"><LogOut size={16} /> Logout</button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <button 
                onClick={handleGoogleLogin} 
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-sm hover:shadow-lg hover:shadow-amber-500/20 transition hover:scale-105"
            >
                Get Started
            </button>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-[#0A0A0A] border-b border-white/10 overflow-hidden">
            <div className="px-6 py-8 space-y-6">
              <Link to="/" className="block text-lg font-medium text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
              {/* 🔥 Plans Link REMOVED in Mobile too */}
              <Link to="/services" className="block text-lg font-medium text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
              
              {user ? (
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-4 mb-6">
                    {renderProfileImage("w-12 h-12")}
                    <div>
                      <p className="font-bold text-white">{user.displayName || 'Student'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/chat" className="block w-full py-3 bg-blue-600 rounded-xl text-center font-bold text-white mb-3" onClick={() => setIsMobileMenuOpen(false)}>Chat with Guru</Link>
                  <Link to="/profile" className="block w-full py-3 bg-white/5 rounded-xl text-center font-bold text-white mb-3" onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
                  <button onClick={handleLogout} className="block w-full py-3 bg-red-500/10 rounded-xl text-center font-bold text-red-500">Logout</button>
                </div>
              ) : (
                <div className="pt-6 border-t border-white/10">
                  <button onClick={() => { handleGoogleLogin(); setIsMobileMenuOpen(false); }} className="w-full py-3 rounded-xl bg-amber-500 text-center font-bold text-black">Get Started</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
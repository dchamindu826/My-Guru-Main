import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Menu, X, Image as ImageIcon, Bot, User, 
  Sparkles, Zap, ChevronDown, LogOut, Plus, Crown, Star 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api'; // 🔥 Use API instead of Supabase direct
import logo from '../assets/logo.png'; 

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [userPlan, setUserPlan] = useState('free'); 
  const [credits, setCredits] = useState(3);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  
  // User Preferences
  const [selectedSubject, setSelectedSubject] = useState("Science");
  const [selectedMedium, setSelectedMedium] = useState("Sinhala");
  const [selectedGrade, setSelectedGrade] = useState("Grade 11");

  // Chat Data
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
        id: 1, 
        role: 'ai', 
        content: `ආයුබෝවන් ${user?.displayName?.split(' ')[0] || 'පුතේ'}! 👋 \nමම My Guru.\n\nඅද අපි ${selectedSubject} පාඩම පටන් ගමුද? ඔයාට අමාරු ඕනෑම ප්‍රශ්නයක් අහන්න.`, 
        timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // DATA LISTS
  const subjects = ["Science", "Mathematics", "History", "Buddhism", "ICT", "Commerce", "English", "Sinhala"];

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 🔥 FIX: Fetch Plan from Payments Table (Same as Profile Page)
  useEffect(() => {
    if (!user || !user.uid && !user.id) return;

    const fetchUserPlan = async () => {
        try {
            const userId = user.uid || user.id;
            // 1. Get Payments
            const res = await api.get(`/payments/user/${userId}`);
            const orders = res.data;

            // 2. Find Latest Approved Plan
            const sortedOrders = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const approvedOrder = sortedOrders.find(o => o.status === 'approved');

            if (approvedOrder) {
                // Map package name to plan code
                const pkgName = approvedOrder.package_name.toLowerCase();
                if (pkgName.includes('genius')) {
                    setUserPlan('genius');
                    setCredits(9999); // Unlimited
                } else if (pkgName.includes('scholar')) {
                    setUserPlan('scholar');
                    setCredits(100);
                }
            }
        } catch (error) {
            console.error("Plan Fetch Error:", error);
        }
    };

    fetchUserPlan();
  }, [user]);

  // --- SEND MESSAGE ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (userPlan === 'free' && credits <= 0) {
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: "🛑 අද දවසේ ප්‍රශ්න ප්‍රමාණය ඉවරයි.\nUnlimited Plan එක Upgrade කරන්න.", isSystem: true }]);
        return;
    }

    const userMsg = { id: Date.now(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
        const res = await fetch("https://myguru.lumi-automation.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: user.uid || user.id, // 🔥 Use correct ID
                message: userMsg.content,
                subject: selectedSubject,
                grade: selectedGrade,
                medium: selectedMedium
            })
        });
        const data = await res.json();

        if (data.status === "no_credits") {
            setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: data.answer || "පැකේජ් එක ඉවරයි.", isSystem: true }]);
        } else {
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: data.answer, image: data.image_url, timestamp: new Date() }]);
            if (data.credits_left !== undefined && userPlan === 'free') setCredits(data.credits_left);
        }
    } catch (e) {
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: "Server Error. පොඩ්ඩක් ඉඳලා ආයේ ට්‍රයි කරන්න." }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen font-sans bg-[#050505] text-white overflow-hidden selection:bg-amber-500/30">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#090909] border-r border-white/5 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* LOGO */}
        <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <img src={logo} alt="MyGuru" className="w-8 h-8 object-contain" />
                <span className="font-bold text-xl text-white">My Guru</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><X size={24} /></button>
        </div>

        {/* New Chat */}
        <div className="px-4 mb-6">
            <button onClick={() => setMessages([])} className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-xl transition text-sm font-medium text-gray-300">
                <Plus size={18} /> New Chat Session
            </button>
        </div>

        {/* History Area */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
             <div className="text-center text-gray-600 text-xs mt-10">Start a new conversation to see history here.</div>
        </div>

        {/* USER PROFILE FOOTER */}
        <div className="p-4 bg-[#0A0A0A] border-t border-white/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    {user?.photoURL ? (
                        <img src={user.photoURL} className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-black">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${userPlan !== 'free' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                </div>
                <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{user?.displayName || 'Student'}</p>
                    <p className={`text-xs font-medium capitalize flex items-center gap-1 ${userPlan !== 'free' ? 'text-amber-500' : 'text-gray-500'}`}>
                        {userPlan === 'genius' && <Crown size={12} />}
                        {userPlan === 'scholar' && <Star size={12} />}
                        {userPlan === 'free' ? 'Student Plan' : userPlan + ' Plan'}
                    </p>
                </div>
            </div>

            {userPlan === 'free' && (
                <div className="mb-3 bg-[#111] rounded-xl p-3 border border-white/5 cursor-pointer" onClick={() => navigate('/plans')}>
                    <div className="flex justify-between text-xs mb-1.5 text-gray-400">
                        <span>Daily Limit</span>
                        <span className="text-white font-bold">{credits}/3</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${(credits/3)*100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-amber-500 mt-2 text-center font-bold">Upgrade for Unlimited 🚀</p>
                </div>
            )}

            <button onClick={() => { logout(); navigate('/'); }} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 text-red-400/80 hover:bg-red-500/10 transition">
                <LogOut size={14} /> Log Out
            </button>
        </div>
      </aside>

      {/* CHAT AREA */}
      <main className="flex-1 flex flex-col md:ml-72 relative bg-black/50">
        
        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-[#050505] via-[#050505]/90 to-transparent">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 bg-[#111] rounded-lg text-gray-400"><Menu size={20}/></button>
                <div className="relative">
                    <button onClick={() => setShowSubjectMenu(!showSubjectMenu)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111]/80 border border-white/10 hover:border-amber-500/30 transition shadow-lg">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="font-bold text-sm text-gray-200">{selectedSubject}</span>
                        <ChevronDown size={14} className="text-gray-500 ml-1" />
                    </button>
                    <AnimatePresence>
                        {showSubjectMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSubjectMenu(false)}></div>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-20 p-2">
                                    {subjects.map(sub => (
                                        <button key={sub} onClick={() => { setSelectedSubject(sub); setShowSubjectMenu(false); }} className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-medium hover:bg-white/5 ${selectedSubject === sub ? 'text-amber-500' : 'text-gray-400'}`}>{sub}</button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            {userPlan !== 'free' && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Zap size={14} className="text-amber-500" fill="currentColor" />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{userPlan} ACTIVE</span>
                </div>
            )}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 pt-20 pb-36 md:px-20 lg:px-40 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border ${msg.role === 'ai' ? 'bg-[#111] border-amber-500/20 text-amber-500' : 'bg-transparent border-transparent'}`}>
                        {msg.role === 'ai' ? <Bot size={18} /> : 
                            user?.photoURL ? <img src={user.photoURL} className="w-9 h-9 rounded-full" /> : <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{user?.email?.charAt(0).toUpperCase()}</div>
                        }
                    </div>
                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-7 shadow-md whitespace-pre-wrap ${msg.role === 'user' ? 'bg-white text-gray-900 rounded-tr-sm' : 'bg-[#151515] border border-white/5 text-gray-200 rounded-tl-sm'}`}>
                        {msg.content}
                        {msg.image && <img src={msg.image} className="mt-3 rounded-xl w-full" />}
                    </div>
                </motion.div>
            ))}
            {isTyping && <div className="text-xs text-gray-500 ml-16 animate-pulse">My Guru is writing...</div>}
            <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-20">
            <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 p-2 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[28px] shadow-2xl transition-all focus-within:border-amber-500/40">
                    <button className="p-3 mb-0.5 rounded-full text-gray-400 hover:text-white"><ImageIcon size={20} /></button>
                    <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} placeholder={`Ask anything about ${selectedSubject}...`} className="w-full bg-transparent resize-none focus:outline-none py-3.5 px-2 text-[15px] text-white placeholder-gray-500 max-h-32 custom-scrollbar" rows={1} style={{ minHeight: '52px' }} />
                    <button onClick={handleSend} disabled={!input.trim() || isTyping} className={`p-3 mb-0.5 rounded-full transition shadow-lg ${input.trim() ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}><Send size={20} /></button>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}
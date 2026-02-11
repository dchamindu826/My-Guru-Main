import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Menu, X, Image as ImageIcon, Bot, User, 
  Sparkles, Zap, ChevronDown, LogOut, Plus, Crown, Star, Infinity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api'; 
import logo from '../assets/logo.png'; 

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [userPlan, setUserPlan] = useState('free'); 
  const [isUnlimited, setIsUnlimited] = useState(false); // 🔥 New State for Unlimited Check
  const [credits, setCredits] = useState(3);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  
  // User Preferences
  const [selectedSubject, setSelectedSubject] = useState("Science");
  const [selectedMedium, setSelectedMedium] = useState("Sinhala");

  // Chat Data
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
        id: 1, 
        role: 'ai', 
        content: `ආයුබෝවන් ${user?.displayName?.split(' ')[0] || 'පුතේ'}! 👋 \nමම My Guru.\n\nඅද අපි ${selectedSubject} පාඩම පටන් ගමුද? ඔයාට අමාරු ඕනෑම ප්‍රශ්නයක් මගෙන් අහන්න.`, 
        timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // DATA LISTS
  const subjects = ["Science", "Mathematics", "History", "Buddhism", "ICT", "Commerce", "English", "Sinhala", "Geography", "Civic"];

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 🔥 FETCH PLAN & CREDITS
  useEffect(() => {
    if (!user || (!user.uid && !user.id)) return;

    const fetchUserPlan = async () => {
        try {
            const userId = user.uid || user.id;
            // 1. Get Payments & Plan
            const res = await api.get(`/payments/user/${userId}`);
            const orders = res.data;

            // Find Latest Approved Plan
            const sortedOrders = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const approvedOrder = sortedOrders.find(o => o.status === 'approved');

            if (approvedOrder) {
                const pkgName = approvedOrder.package_name.toLowerCase();
                
                if (pkgName.includes('genius')) {
                    setUserPlan('genius');
                    setIsUnlimited(true); // 🔥 Unlimited Flag
                    setCredits(9999); 
                } else if (pkgName.includes('scholar')) {
                    setUserPlan('scholar');
                    setIsUnlimited(false);
                    setCredits(100);
                } else {
                    setUserPlan('free');
                    setIsUnlimited(false);
                }
            } else {
                setUserPlan('free');
                setIsUnlimited(false);
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

    // Check Credits (Only if NOT unlimited)
    if (!isUnlimited && credits <= 0) {
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: "🛑 අද දවසේ ප්‍රශ්න ප්‍රමාණය ඉවරයි පුතේ.\nUnlimited Plan එක Upgrade කරොත් දිගටම ඉගෙන ගන්න පුළුවන්.", isSystem: true }]);
        return;
    }

    // User Message UI Update
    const userMsg = { id: Date.now(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
        // 🔥 Call Python Brain API
        const res = await fetch("https://myguru.lumi-automation.com/brain/chat", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-api-key": "sk_7MYoNP9bT6l_aUKh8svMJEMFTY0vY7uv"
            },
            body: JSON.stringify({
                question: userMsg.content,
                subject: selectedSubject,
                medium: selectedMedium
            })
        });

        const data = await res.json();

        if (res.status !== 200) {
             setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: "පොඩි ගැටලුවක් ආවා පුතේ. ආයේ උත්සාහ කරන්න.", isSystem: true }]);
             return;
        }

        // AI Response UI Update
        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            role: 'ai', 
            content: data.answer, 
            image: data.image ? data.image.image_url : null, 
            timestamp: new Date() 
        }]);

        // 🔥 Update Credits Live
        if (data.credits_left !== undefined && data.credits_left !== "Unlimited") {
            setCredits(data.credits_left);
        }

    } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: "System busy. පොඩ්ඩක් ඉඳලා ආයේ ට්‍රයි කරන්න." }]);
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

        {/* New Chat Button */}
        <div className="px-4 mb-6">
            <button onClick={() => setMessages([])} className="w-full flex items-center gap-2 bg-gradient-to-r from-amber-600/20 to-amber-600/10 hover:from-amber-600/30 border border-amber-500/20 p-3 rounded-xl transition text-sm font-bold text-amber-500">
                <Plus size={18} /> අලුත් පාඩමක් (New Chat)
            </button>
        </div>

        {/* Subject & Medium Selector (Sidebar) */}
        <div className="px-4 mb-6 space-y-4">
             <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">විෂය (Subject)</label>
                <div className="relative">
                    <button onClick={() => setShowSubjectMenu(!showSubjectMenu)} className="w-full flex justify-between items-center px-3 py-2 bg-[#111] border border-white/10 rounded-lg text-sm text-gray-300 hover:border-amber-500/50 transition">
                        {selectedSubject}
                        <ChevronDown size={14} />
                    </button>
                    {showSubjectMenu && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#151515] border border-white/10 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                            {subjects.map(sub => (
                                <div key={sub} onClick={() => { setSelectedSubject(sub); setShowSubjectMenu(false); }} className="px-3 py-2 hover:bg-white/5 cursor-pointer text-xs text-gray-300">
                                    {sub}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>

             <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">මාධ්‍යය (Medium)</label>
                <div className="flex gap-2">
                    {["Sinhala", "English"].map(m => (
                        <button key={m} onClick={() => setSelectedMedium(m)} className={`flex-1 py-1.5 text-xs font-bold rounded-md border transition ${selectedMedium === m ? 'bg-amber-500 text-black border-amber-500' : 'bg-[#111] text-gray-400 border-white/10 hover:border-white/20'}`}>
                            {m}
                        </button>
                    ))}
                </div>
             </div>
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
                            {(user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${isUnlimited ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                </div>
                <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{user?.displayName || 'Student'}</p>
                    <p className={`text-xs font-medium capitalize flex items-center gap-1 ${isUnlimited ? 'text-amber-500' : 'text-gray-500'}`}>
                        {isUnlimited ? <><Crown size={12} /> Genius Plan</> : 'Student Plan'}
                    </p>
                </div>
            </div>

            {/* 🔥 Plan Display Logic */}
            {isUnlimited ? (
                <div className="mb-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-xl p-3 border border-amber-500/20">
                    <div className="flex items-center gap-2 justify-center text-amber-500 font-bold text-xs">
                         <Infinity size={16} /> 
                         <span>UNLIMITED ACCESS</span>
                    </div>
                </div>
            ) : (
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
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111]/80 border border-white/10 shadow-lg">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="font-bold text-sm text-gray-200">{selectedSubject}</span>
                    <span className="text-xs text-gray-500 border-l border-white/10 pl-2 ml-1">{selectedMedium} Medium</span>
                </div>
            </div>
            
            {isUnlimited && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Zap size={14} className="text-amber-500" fill="currentColor" />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">GENIUS ACTIVE</span>
                </div>
            )}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 pt-20 pb-36 md:px-20 lg:px-40 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border ${msg.role === 'ai' ? 'bg-[#111] border-amber-500/20 text-amber-500' : 'bg-transparent border-transparent'}`}>
                        {msg.role === 'ai' ? <Bot size={18} /> : 
                            user?.photoURL ? <img src={user.photoURL} className="w-9 h-9 rounded-full" /> : <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{(user?.email || "U").charAt(0).toUpperCase()}</div>
                        }
                    </div>
                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-7 shadow-md whitespace-pre-wrap ${msg.role === 'user' ? 'bg-white text-gray-900 rounded-tr-sm' : 'bg-[#151515] border border-white/5 text-gray-200 rounded-tl-sm'}`}>
                        {msg.content}
                        {msg.image && <img src={msg.image} className="mt-3 rounded-xl w-full border border-white/10" />}
                    </div>
                </motion.div>
            ))}
            {isTyping && <div className="text-xs text-gray-500 ml-16 animate-pulse flex items-center gap-1">My Guru is writing <span className="text-amber-500">...</span></div>}
            <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-20">
            <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 p-2 bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[28px] shadow-2xl transition-all focus-within:border-amber-500/40">
                    <button className="p-3 mb-0.5 rounded-full text-gray-400 hover:text-white"><ImageIcon size={20} /></button>
                    <textarea 
                        ref={textareaRef} 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} 
                        placeholder={`Ask anything about ${selectedSubject} (${selectedMedium})...`} 
                        className="w-full bg-transparent resize-none focus:outline-none py-3.5 px-2 text-[15px] text-white placeholder-gray-500 max-h-32 custom-scrollbar" 
                        rows={1} 
                        style={{ minHeight: '52px' }} 
                    />
                    <button onClick={handleSend} disabled={!input.trim() || isTyping} className={`p-3 mb-0.5 rounded-full transition shadow-lg ${input.trim() ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}><Send size={20} /></button>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}
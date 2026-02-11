import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Menu, X, Image as ImageIcon, Bot, User, 
  Sparkles, Zap, ChevronDown, LogOut, Plus, Crown, Star, Infinity, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api'; 
import logo from '../assets/logo.png'; 

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [userPlan, setUserPlan] = useState('free'); 
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [credits, setCredits] = useState(3);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

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

  // 🔥 FULL SUBJECT LIST
  const subjects = [
    "Science", "Mathematics", "History", "Buddhism", "Sinhala", "English", 
    "Health", "Civic", "Commerce", "Geography", "ICT", "Media", "Tamil"
  ];

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
            const res = await api.get(`/payments/user/${userId}`);
            const orders = res.data;

            const sortedOrders = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const approvedOrder = sortedOrders.find(o => o.status === 'approved');

            if (approvedOrder) {
                const pkgName = approvedOrder.package_name.toLowerCase();
                
                if (pkgName.includes('genius')) {
                    setUserPlan('genius');
                    setIsUnlimited(true);
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

  // --- IMAGE HANDLERS ---
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- CONVERT IMAGE TO BASE64 (Optional Helper) ---
  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  // --- SEND MESSAGE ---
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    // Check Credits
    if (!isUnlimited && credits <= 0) {
        setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: "🛑 අද දවසේ ප්‍රශ්න ප්‍රමාණය ඉවරයි පුතේ.\nUnlimited Plan එක Upgrade කරොත් දිගටම ඉගෙන ගන්න පුළුවන්.", isSystem: true }]);
        return;
    }

    // User Message UI
    const userMsg = { 
        id: Date.now(), 
        role: 'user', 
        content: input, 
        image: imagePreview, // Display locally
        timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    const imageToSend = selectedImage; // Keep ref to send
    clearImage(); // Clear UI
    setIsTyping(true);

    try {
        let payload = {
            question: userMsg.content,
            subject: selectedSubject,
            medium: selectedMedium
        };

        // If image exists, convert to Base64 and send (Backend support needed)
        if (imageToSend) {
            const base64Img = await toBase64(imageToSend);
            payload.image_data = base64Img; // Sending base64 string
        }

        const res = await fetch("https://myguru.lumi-automation.com/brain/chat", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-api-key": "sk_7MYoNP9bT6l_aUKh8svMJEMFTY0vY7uv"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.status !== 200) {
             setMessages(prev => [...prev, { id: Date.now(), role: 'ai', content: "පොඩි ගැටලුවක් ආවා පුතේ. ආයේ උත්සාහ කරන්න.", isSystem: true }]);
             return;
        }

        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            role: 'ai', 
            content: data.answer, 
            image: data.image ? data.image.image_url : null, 
            timestamp: new Date() 
        }]);

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

        {/* New Chat */}
        <div className="px-4 mb-6">
            <button onClick={() => setMessages([])} className="w-full flex items-center gap-2 bg-gradient-to-r from-amber-600/20 to-amber-600/10 hover:from-amber-600/30 border border-amber-500/20 p-3 rounded-xl transition text-sm font-bold text-amber-500">
                <Plus size={18} /> අලුත් පාඩමක් (New Chat)
            </button>
        </div>

        {/* SETTINGS AREA */}
        <div className="px-4 mb-6 space-y-4">
             {/* Subject */}
             <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider">විෂය (Subject)</label>
                <div className="relative">
                    <button onClick={() => setShowSubjectMenu(!showSubjectMenu)} className="w-full flex justify-between items-center px-3 py-2.5 bg-[#111] border border-white/10 rounded-xl text-sm text-gray-200 hover:border-amber-500/50 transition shadow-inner">
                        <span className="flex items-center gap-2"><Sparkles size={14} className="text-amber-500"/> {selectedSubject}</span>
                        <ChevronDown size={14} className="text-gray-500" />
                    </button>
                    {showSubjectMenu && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-20 max-h-56 overflow-y-auto custom-scrollbar p-1">
                            {subjects.map(sub => (
                                <div key={sub} onClick={() => { setSelectedSubject(sub); setShowSubjectMenu(false); }} className={`px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs font-medium ${selectedSubject === sub ? 'text-amber-500 bg-amber-500/10' : 'text-gray-400'}`}>
                                    {sub}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>

             {/* Medium */}
             <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider">මාධ්‍යය (Medium)</label>
                <div className="flex gap-2 p-1 bg-[#111] rounded-xl border border-white/5">
                    {["Sinhala", "English"].map(m => (
                        <button key={m} onClick={() => setSelectedMedium(m)} className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${selectedMedium === m ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                            {m}
                        </button>
                    ))}
                </div>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar"></div>

        {/* USER PROFILE & PLAN */}
        <div className="p-4 bg-[#0A0A0A] border-t border-white/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    {user?.photoURL ? (
                        <img src={user.photoURL} className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-white">
                            {(user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                    )}
                    {/* Online Status Dot */}
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${isUnlimited ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                </div>
                <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate text-white">{user?.displayName || 'Student'}</p>
                    <p className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isUnlimited ? 'text-amber-500' : 'text-gray-500'}`}>
                        {isUnlimited ? <><Crown size={10} /> Genius Plan</> : 'Student Plan'}
                    </p>
                </div>
            </div>

            {isUnlimited ? (
                <div className="mb-3 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 rounded-xl p-3 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <div className="flex items-center gap-2 justify-center text-amber-500 font-black text-xs tracking-wide">
                         <Infinity size={16} /> 
                         <span>UNLIMITED ACCESS</span>
                    </div>
                </div>
            ) : (
                <div className="mb-3 bg-[#111] rounded-xl p-3 border border-white/5 cursor-pointer hover:border-white/10 transition" onClick={() => navigate('/plans')}>
                    <div className="flex justify-between text-xs mb-2 text-gray-400 font-medium">
                        <span>Daily Limit</span>
                        <span className="text-white font-bold">{credits}/3</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${(credits/3)*100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-amber-500 mt-2.5 text-center font-bold flex items-center justify-center gap-1">
                        Upgrade for Unlimited <Zap size={10} />
                    </p>
                </div>
            )}

            <button onClick={() => { logout(); navigate('/'); }} className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition">
                <LogOut size={14} /> Log Out
            </button>
        </div>
      </aside>

      {/* CHAT MAIN */}
      <main className="flex-1 flex flex-col md:ml-72 relative bg-black">
        
        {/* HEADER */}
        <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-black via-black/90 to-transparent">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 bg-[#111] rounded-lg text-gray-400"><Menu size={20}/></button>
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {selectedSubject}
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 font-normal">{selectedMedium}</span>
                    </h2>
                    <p className="text-xs text-gray-500">Your AI Tutor</p>
                </div>
            </div>
            
            {isUnlimited && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                    <Crown size={14} className="text-amber-500" fill="currentColor" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">PRO MEMBER</span>
                </div>
            )}
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 pt-24 pb-40 md:px-32 lg:px-48 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${msg.role === 'ai' ? 'bg-[#111] border-amber-500/20 text-amber-500' : 'bg-transparent border-transparent'}`}>
                        {msg.role === 'ai' ? <Bot size={18} /> : 
                            user?.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{(user?.email || "U").charAt(0).toUpperCase()}</div>
                        }
                    </div>
                    <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[15px] leading-7 shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#212121] text-white rounded-tr-sm' : 'bg-[#111] border border-white/5 text-gray-200 rounded-tl-sm'}`}>
                        {msg.content}
                        {msg.image && <img src={msg.image} className="mt-3 rounded-xl w-full border border-white/10 shadow-lg" />}
                    </div>
                </motion.div>
            ))}
            {isTyping && <div className="text-xs text-gray-600 ml-14 animate-pulse flex items-center gap-1">Thinking<span className="text-amber-500">...</span></div>}
            <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black to-transparent z-20">
            <div className="max-w-3xl mx-auto">
                
                {/* Image Preview */}
                {imagePreview && (
                    <div className="mb-2 relative inline-block">
                        <img src={imagePreview} className="h-16 rounded-lg border border-white/20 shadow-lg" alt="Upload" />
                        <button onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition"><X size={12}/></button>
                    </div>
                )}

                <div className="relative flex items-end gap-2 p-1.5 bg-[#111] border border-white/10 rounded-[24px] shadow-2xl transition-all focus-within:border-amber-500/30 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                    
                    {/* Hidden File Input */}
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                    
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 mb-0.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition">
                        <ImageIcon size={20} />
                    </button>
                    
                    <textarea 
                        ref={textareaRef} 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} 
                        placeholder={`Ask anything about ${selectedSubject}...`} 
                        className="w-full bg-transparent resize-none focus:outline-none py-3.5 px-2 text-[15px] text-white placeholder-gray-600 max-h-32 custom-scrollbar" 
                        rows={1} 
                        style={{ minHeight: '50px' }} 
                    />
                    
                    <button onClick={handleSend} disabled={(!input.trim() && !selectedImage) || isTyping} className={`p-3 mb-0.5 rounded-full transition shadow-lg ${input.trim() || selectedImage ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}>
                        <Send size={18} fill={input.trim() ? "currentColor" : "none"} />
                    </button>
                </div>
                <p className="text-center text-[10px] text-gray-700 mt-3">My Guru can make mistakes. Check important info.</p>
            </div>
        </div>

      </main>
    </div>
  );
}
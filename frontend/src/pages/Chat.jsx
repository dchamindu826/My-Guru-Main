import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Menu, X, Image as ImageIcon, Bot, 
  Zap, LogOut, Crown, Infinity, BookOpen, Trash2, GraduationCap, ChevronRight, MessageSquare, Sparkles, Search, Layers, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api'; 
import { supabase } from '../lib/supabase'; // Database එකෙන් Credits ගන්න ඕන නිසා මේක දැම්මා
import logo from '../assets/logo.png'; 
import { FaWhatsapp } from 'react-icons/fa'; // WhatsApp අයිකන් එකට

const SUBJECT_THEMES = {
  "Science": "from-blue-600 to-cyan-500",
  "Mathematics": "from-red-600 to-orange-500",
  "History": "from-amber-600 to-yellow-500",
  "Buddhism": "from-orange-500 to-amber-400",
  "Sinhala": "from-emerald-600 to-green-500",
  "English": "from-purple-600 to-pink-500",
  "ICT": "from-indigo-600 to-blue-500",
  "Commerce": "from-teal-600 to-emerald-500",
  "Health": "from-rose-500 to-red-400",
  "Geography": "from-green-600 to-lime-500",
  "Civic": "from-slate-600 to-gray-500",
  "Media": "from-violet-600 to-purple-500",
  "Tamil": "from-fuchsia-600 to-pink-500",
  "Agriculture": "from-lime-500 to-green-600"
};

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [input, setInput] = useState(""); 
  const [userPlan, setUserPlan] = useState('free'); 
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [maxCredits, setMaxCredits] = useState(3);
  const [creditsLeft, setCreditsLeft] = useState(3); // වෙනස් කළා
  const [isSidebarOpen, setSidebarOpen] = useState(true); 
  const [isTyping, setIsTyping] = useState(false);
  
  const [activeStream, setActiveStream] = useState('OL'); 
  const [activeSubject, setActiveSubject] = useState(null); 
  const [medium, setMedium] = useState("Sinhala");

  const [showWAPopup, setShowWAPopup] = useState(false); // Popup State

  const [sessions, setSessions] = useState(() => {
      const saved = localStorage.getItem(`myguru_sessions_${user?.uid || 'guest'}`);
      return saved ? JSON.parse(saved) : {};
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const [loadingStep, setLoadingStep] = useState(0);

  const loadingTexts = [
      { icon: <Search size={14} className="text-blue-400"/>, text: "ප්‍රශ්නය විශ්ලේෂණය කරමින්..." },
      { icon: <BookOpen size={14} className="text-amber-400"/>, text: "Past Papers සහ Marking Scheme පරීක්ෂා කරමින්..." },
      { icon: <Layers size={14} className="text-green-400"/>, text: "පෙළපොත් වලින් කරුණු ගොනු කරමින්..." },
      { icon: <Sparkles size={14} className="text-purple-400"/>, text: "විභාගයට ගැලපෙන පිළිතුරක් නිර්මාණය කරමින්..." }
  ];

  // Show Popup on Load
  useEffect(() => {
      const hasSeenPopup = sessionStorage.getItem('myguru_wa_popup_seen');
      if (!hasSeenPopup) {
          setTimeout(() => setShowWAPopup(true), 1500); // තත්පර 1.5 කින් එන්න
      }
  }, []);

  const closeWAPopup = () => {
      setShowWAPopup(false);
      sessionStorage.setItem('myguru_wa_popup_seen', 'true');
  };

  useEffect(() => {
      let interval;
      if (isTyping) {
          setLoadingStep(0);
          interval = setInterval(() => {
              setLoadingStep((prev) => (prev + 1) % 4);
          }, 2000); 
      }
      return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
      if(user?.uid) localStorage.setItem(`myguru_sessions_${user.uid}`, JSON.stringify(sessions));
  }, [sessions, user]);

  const currentMessages = activeSubject ? (sessions[activeSubject] || []) : [];
  const activeTheme = activeSubject ? SUBJECT_THEMES[activeSubject] : "from-gray-700 to-gray-600";

  // 🔥 Database එකෙන් Credits ගන්න එක (Syncs with WhatsApp)
  const fetchUserCredits = async () => {
      if (!user) return;
      try {
          const userId = user.uid || user.id;
          
          // 1. Check Plan from Payments table
          const res = await api.get(`/payments/user/${userId}`);
          const approvedOrder = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).find(o => o.status === 'approved');

          // 2. Fetch Usage from profiles table (This is where Backend updates!)
          const { data: profileData } = await supabase.from('profiles').select('credits_used, last_reset_date').eq('id', userId).single();
          
          let usedDB = profileData?.credits_used || 0;
          let lastReset = profileData?.last_reset_date;
          let todayStr = new Date().toISOString().split('T')[0];

          // Daily reset logic on Frontend too just in case
          if (lastReset !== todayStr) {
             usedDB = 0;
          }

          if (approvedOrder) {
              const pkgName = approvedOrder.package_name.toLowerCase();
              if (pkgName.includes('genius')) { 
                  setUserPlan('genius'); 
                  setIsUnlimited(true); 
                  setCreditsLeft("Unlimited"); 
              }
              else if (pkgName.includes('scholar')) { 
                  setUserPlan('scholar'); 
                  setIsUnlimited(false); 
                  const totalAllowed = 100; 
                  setMaxCredits(totalAllowed);
                  setCreditsLeft(Math.max(0, totalAllowed - usedDB)); 
              }
          } else { 
              setUserPlan('free'); 
              setIsUnlimited(false); 
              setMaxCredits(3);
              setCreditsLeft(Math.max(0, 3 - usedDB)); 
          }
      } catch (error) { console.error("Credit Fetch Error:", error); }
  };

  useEffect(() => {
      fetchUserCredits();
  }, [user]);

  // Refresh credits every 10 seconds just in case they used WhatsApp while having the site open
  useEffect(() => {
      const interval = setInterval(fetchUserCredits, 10000);
      return () => clearInterval(interval);
  }, [user]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isTyping, activeSubject]);

  const handleSubjectSelect = (subject) => {
      setActiveSubject(subject);
      setSidebarOpen(false); 
      
      setSessions(prev => {
          const subjectHistory = prev[subject] || [];
          if (subjectHistory.length === 0) {
              const firstName = user?.displayName?.split(' ')[0] || 'පුතේ';
              const welcomeMsg = {
                  id: 'init-welcome',
                  role: 'ai',
                  content: `ආයුබෝවන් ${firstName}! 👋\n\nමම My Guru. ලංකාවේ පළවෙනි AI ගුරුවරයා 🎓\n\nඅද අපි ${subject} පාඩම පටන් ගමු. 📚\n\nඔයාට තියෙන ඕනෑම ප්‍රශ්නයක් මගෙන් අහන්න. මම ලෑස්තියි ඔයාට සරලව කියලා දෙන්න.`,
                  timestamp: new Date()
              };
              return { ...prev, [subject]: [welcomeMsg] };
          }
          return prev;
      });
  };

  const handleClearSession = (e, subject) => {
      e.stopPropagation();
      if(window.confirm(`Are you sure you want to clear ${subject} history?`)) {
          setSessions(prev => ({ ...prev, [subject]: [] }));
          if (activeSubject === subject) setActiveSubject(null);
      }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedImage(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const clearImage = () => {
    setSelectedImage(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || !activeSubject) return;

    if (!isUnlimited && creditsLeft <= 0) {
        addMessageToSession(activeSubject, { 
            id: Date.now(), 
            role: 'ai', 
            content: userPlan === 'free' 
                ? "🛑 අද දවසේ ඔයාට අහන්න පුළුවන් ප්‍රශ්න ප්‍රමාණය (3/3) ඉවරයි පුතේ. තව ප්‍රශ්න අහන්න අපේ Unlimited Plan එකකට Upgrade කරන්න. 👇\n\n[Upgrade Now](/plans)"
                : "🛑 ඔයාගේ පැකේජයේ ප්‍රශ්න ප්‍රමාණය අවසන් වී ඇත. කරුණාකර නැවත Upgrade කරන්න.", 
            isSystem: true 
        });
        return;
    }

    let base64String = null;
    let imgPrevUrl = imagePreview; 

    if (selectedImage) {
        base64String = await toBase64(selectedImage);
    }

    const userMsg = { 
        id: Date.now(), 
        role: 'user', 
        content: input, 
        image: imgPrevUrl, 
        timestamp: new Date() 
    };
    
    addMessageToSession(activeSubject, userMsg);
    
    setInput("");
    clearImage();
    setIsTyping(true);

    // 🔥 Update DB usage immediately for instant UI feedback
    const userId = user?.uid || user?.id;
    if (!isUnlimited && userId) {
        setCreditsLeft(prev => prev - 1);
        supabase.rpc('increment_credits', { userid: userId }).catch(console.error);
    }

    try {
        let payload = { question: userMsg.content, subject: activeSubject, medium: medium, session_id: userId }; 
        if (base64String) {
            payload.image_data = base64String;
        }

        const res = await fetch("https://myguru.lumi-automation.com/brain/chat", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.status !== 200) throw new Error("API Error");

        addMessageToSession(activeSubject, { 
            id: Date.now() + 1, 
            role: 'ai', 
            content: data.answer, 
            image: null, 
            timestamp: new Date() 
        });

    } catch (e) {
        addMessageToSession(activeSubject, { id: Date.now(), role: 'ai', content: "⚠️ System busy. පොඩ්ඩක් ඉඳලා ආයේ ට්‍රයි කරන්න." });
        // Optional: Revert credit if failed
    } finally { setIsTyping(false); }
  };

  const addMessageToSession = (subject, msg) => {
      setSessions(prev => ({
          ...prev,
          [subject]: [...(prev[subject] || []), msg] 
      }));
  };

  return (
    <div className="flex h-screen font-sans bg-[#050505] text-white overflow-hidden selection:bg-amber-500/30">
      
      {/* --- WHATSAPP POPUP MODAL --- */}
      <AnimatePresence>
        {showWAPopup && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-[#111] border border-[#25D366]/30 shadow-2xl shadow-[#25D366]/20 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4"><button onClick={closeWAPopup} className="text-gray-400 hover:text-white"><X size={20}/></button></div>
                    
                    <div className="w-20 h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-[#25D366]/30">
                        <FaWhatsapp className="text-white text-4xl"/>
                    </div>
                    
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">දැන් WhatsApp එකෙනුත්!</h2>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        My Guru දැන් ඔයාගේ WhatsApp එකෙත් ඉන්නවා. Web එකට එන්නෙ නැතුව කෙලින්ම WhatsApp එකෙන් ප්‍රශ්න අහන්න.
                    </p>

                    <a 
                        href="https://wa.me/94713747070" 
                        target="_blank" rel="noopener noreferrer"
                        className="w-full py-3.5 bg-[#25D366] hover:bg-[#1DA851] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                        onClick={closeWAPopup}
                    >
                        <FaWhatsapp className="text-xl"/> Open WhatsApp
                    </a>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#090909] border-r border-white/5 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <img src={logo} alt="MyGuru" className="w-8 h-8 object-contain" />
                <span className="font-bold text-xl text-white">My Guru</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400"><X size={24} /></button>
        </div>

        <div className="px-4 mb-4">
            <div className="bg-[#111] p-1 rounded-xl flex border border-white/5">
                <button onClick={() => setActiveStream('OL')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${activeStream === 'OL' ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}><GraduationCap size={14}/> O/L Stream</button>
                <button onClick={() => setActiveStream('AL')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${activeStream === 'AL' ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-white'}`}><BookOpen size={14}/> A/L Stream</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {activeStream === 'OL' ? (
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-2">Subjects</p>
                    {Object.keys(SUBJECT_THEMES).map(subject => (
                        <div key={subject} className="group relative">
                            <button onClick={() => handleSubjectSelect(subject)} className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition flex items-center gap-3 border ${activeSubject === subject ? `bg-gradient-to-r ${SUBJECT_THEMES[subject]} border-transparent text-white shadow-lg` : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
                                {activeSubject === subject ? <MessageSquare size={16} fill="currentColor"/> : <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${SUBJECT_THEMES[subject]}`}></div>}
                                {subject}
                            </button>
                            {(sessions[subject]?.length > 0) && (
                                <button onClick={(e) => handleClearSession(e, subject)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition" title="Clear Chat History"><Trash2 size={14}/></button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                    <Zap size={32} className="mb-2 opacity-20"/>
                    <p className="text-xs font-bold">A/L Stream</p>
                    <p className="text-[10px]">Coming Soon...</p>
                </div>
            )}
        </div>

        <div className="p-4 bg-[#0A0A0A] border-t border-white/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    {user?.photoURL ? <img src={user.photoURL} className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-white">{(user?.email || "U").charAt(0).toUpperCase()}</div>}
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${isUnlimited ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                </div>
                <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate text-white">{user?.displayName || 'Student'}</p>
                    <p className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isUnlimited ? 'text-amber-500' : 'text-gray-500'}`}>{isUnlimited ? <><Crown size={10} /> Genius Plan</> : 'Student Plan'}</p>
                </div>
            </div>

            {isUnlimited ? (
                <div className="mb-3 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 rounded-xl p-3 border border-amber-500/30 flex items-center gap-2 justify-center text-amber-500 font-black text-xs tracking-wide"><Infinity size={16} /> <span>UNLIMITED ACCESS</span></div>
            ) : (
                <div className="mb-3 bg-[#111] rounded-xl p-3 border border-white/5 cursor-pointer hover:border-white/10 transition" onClick={() => navigate('/plans')}>
                    <div className="flex justify-between text-xs mb-2 text-gray-400 font-medium"><span>{userPlan === 'free' ? 'Daily Free Limit' : 'Package Limit'}</span><span className={`font-bold ${creditsLeft === 0 ? 'text-red-500' : 'text-white'}`}>{creditsLeft}/{maxCredits} Left</span></div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((creditsLeft/maxCredits)*100, 100)}%` }} className={`h-full ${creditsLeft === 0 ? 'bg-red-500' : 'bg-amber-500'}`}/></div>
                    <p className="text-[10px] text-amber-500 mt-2.5 text-center font-bold flex items-center justify-center gap-1">Upgrade To Premium <Zap size={10} /></p>
                </div>
            )}
            <button onClick={() => { logout(); navigate('/'); }} className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition"><LogOut size={14} /> Log Out</button>
        </div>
      </aside>

      {/* --- CHAT AREA --- */}
      <main className="flex-1 flex flex-col md:ml-72 relative bg-black">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-[#050505] via-[#050505]/95 to-transparent">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 bg-[#111] rounded-lg text-gray-400"><Menu size={20}/></button>
                {activeSubject ? (
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <div className={`px-4 py-2 rounded-2xl bg-gradient-to-r ${activeTheme} shadow-lg shadow-${activeTheme.split('-')[1]}/20 flex items-center gap-3 transform transition-all hover:scale-105`}>
                            <span className="text-lg md:text-xl font-black text-white tracking-wide flex items-center gap-2">
                                <Sparkles size={18} className="text-white/80"/> {activeSubject}
                            </span>
                            <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">O/L</span>
                        </div>

                        {/* Medium Selector */}
                        <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 p-1 rounded-xl flex gap-1">
                            {['Sinhala', 'English', 'Tamil'].map((m) => (
                                <button 
                                    key={m}
                                    onClick={() => setMedium(m)}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${medium === m ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="font-bold text-gray-500 text-lg flex items-center gap-2"><Bot size={20}/> My Guru Brain</div>
                )}
            </div>
        </div>

        {/* Content Area */}
        {!activeSubject ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20"><Bot size={40} className="text-white"/></div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-4">ආයුබෝවන් <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{user?.displayName?.split(' ')[0] || 'පුතේ'}!</span> 👋</h1>
                <p className="text-gray-400 max-w-md mb-8 leading-relaxed">මම ලංකාවේ පළවෙනි AI ගුරුවරයා. පටන් ගන්න පහත පියවර අනුගමනය කරන්න.</p>
                
                <div className="grid gap-4 max-w-md w-full text-left">
                    <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex items-center gap-4 group hover:border-amber-500/30 transition cursor-pointer" onClick={() => setSidebarOpen(true)}>
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-lg group-hover:scale-110 transition">1</div>
                        <div>
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">Stream එක තෝරන්න <ChevronRight size={14} className="opacity-50"/></h3>
                            <p className="text-xs text-gray-500 mt-0.5">වම් පැත්තේ ඇති මෙනුවෙන් O/L තෝරන්න.</p>
                        </div>
                    </div>
                    
                    <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex items-center gap-4 group hover:border-blue-500/30 transition cursor-pointer" onClick={() => setSidebarOpen(true)}>
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-lg group-hover:scale-110 transition">2</div>
                        <div>
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">විෂය (Subject) තෝරන්න <ChevronRight size={14} className="opacity-50"/></h3>
                            <p className="text-xs text-gray-500 mt-0.5">ඔයාට ප්‍රශ්න අහන්න ඕන විෂය click කරන්න.</p>
                        </div>
                    </div>

                    <div className="bg-[#111] p-4 rounded-2xl border border-white/5 flex items-center gap-4 group hover:border-green-500/30 transition">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold text-lg group-hover:scale-110 transition">3</div>
                        <div>
                            <h3 className="font-bold text-white text-sm">ප්‍රශ්නය අහන්න!</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Sinhala, English, Tamil හෝ Singlish වලින් අහන්න.</p>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <>
                <div className="flex-1 overflow-y-auto px-4 pt-24 pb-48 md:px-32 lg:px-48 space-y-6 custom-scrollbar font-sans">
                    {currentMessages.map((msg) => (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${msg.role === 'ai' ? `bg-[#111] border-white/10 text-white` : 'bg-transparent border-transparent'}`}>
                                {msg.role === 'ai' ? <div className={`w-full h-full rounded-full bg-gradient-to-br ${activeTheme} flex items-center justify-center`}><Bot size={16} /></div> : user?.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{(user?.email || "U").charAt(0).toUpperCase()}</div>}
                            </div>

                            <div className={`max-w-[90%] px-4 py-3 md:px-5 md:py-4 rounded-2xl text-[16px] leading-tight shadow-sm flex flex-col gap-2 ${msg.role === 'user' ? 'bg-[#212121] text-white rounded-tr-sm' : 'bg-[#111] border border-white/5 text-gray-200 rounded-tl-sm'}`}>
                                
                                {msg.image && msg.role === 'user' && (
                                    <div className="relative group">
                                        <img src={msg.image} alt="Attached" className="max-w-xs md:max-w-sm rounded-xl border border-white/10 shadow-lg mb-2" />
                                    </div>
                                )}
                                
                                {msg.content && (
                                    <span className="whitespace-pre-wrap">{msg.content}</span>
                                )}

                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 font-sans">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${activeTheme} flex items-center justify-center shadow-lg`}>
                                <Bot size={16} className="text-white animate-pulse"/>
                            </div>
                            <div className="bg-[#111] border border-white/5 px-5 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-3 shadow-sm">
                                <div className="animate-spin-slow">
                                    {loadingTexts[loadingStep].icon}
                                </div>
                                <span className="text-[14px] text-gray-400 font-medium animate-pulse tracking-wide">
                                    {loadingTexts[loadingStep].text}
                                </span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black to-transparent z-20">
                    <div className="max-w-3xl mx-auto">
                        {imagePreview && (
                            <div className="mb-2 relative inline-block">
                                <img src={imagePreview} className="h-20 rounded-xl border-2 border-amber-500/50 shadow-lg object-cover" alt="Upload Preview" />
                                <button onClick={clearImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition z-10"><X size={14}/></button>
                            </div>
                        )}
                        
                        <div className={`relative flex items-end gap-2 p-1.5 bg-[#111] border rounded-[24px] shadow-2xl transition-all ${(!isUnlimited && creditsLeft <= 0) ? 'border-red-500/50 bg-red-900/10 opacity-80' : 'border-white/10 focus-within:border-white/20 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)]'}`}>
                            
                            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={(!isUnlimited && creditsLeft <= 0) || isTyping}
                                className={`p-3 mb-0.5 rounded-full transition ${(!isUnlimited && creditsLeft <= 0) ? 'text-red-500/50 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <ImageIcon size={20} />
                            </button>
                            
                            <textarea 
                                ref={textareaRef} 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} 
                                placeholder={(!isUnlimited && creditsLeft <= 0) ? "Your Daily Limit Reached. Upgrade Plan." : `Ask anything in ${medium}...`} 
                                disabled={(!isUnlimited && creditsLeft <= 0) || isTyping}
                                className="w-full bg-transparent resize-none focus:outline-none py-3.5 px-2 text-[16px] font-sans text-white placeholder-gray-600 max-h-32 custom-scrollbar disabled:cursor-not-allowed" 
                                rows={1} 
                                style={{ minHeight: '50px' }} 
                            />
                            
                            <button 
                                onClick={handleSend} 
                                disabled={(!input.trim() && !selectedImage) || isTyping || (!isUnlimited && creditsLeft <= 0)} 
                                className={`p-3 mb-0.5 rounded-full transition shadow-lg ${(!isUnlimited && creditsLeft <= 0) ? 'bg-red-500/20 text-red-500 cursor-not-allowed' : (input.trim() || selectedImage) ? `bg-gradient-to-r ${activeTheme} text-white hover:scale-105` : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
                            >
                                {(!isUnlimited && creditsLeft <= 0) ? <Lock size={18} /> : <Send size={18} fill={input.trim() ? "currentColor" : "none"} />}
                            </button>
                        </div>
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
}
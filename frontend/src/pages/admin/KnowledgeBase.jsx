import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api'; // Make sure this path is correct
import { Database, Search, BookOpen, Eye, X, FileText, Filter, RotateCcw, Trash2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KnowledgeBase() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null); // Modal state
  
  // 🔥 DELETE STATE
  const [selectedPages, setSelectedPages] = useState([]); // Array of page numbers to delete
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterMedium, setFilterMedium] = useState('All');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  // Modal එක close වෙනකොට selection එක reset කරන්න
  useEffect(() => {
    if (!selectedDoc) {
        setSelectedPages([]);
    }
  }, [selectedDoc]);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/knowledge/summary');
      if(Array.isArray(res.data)) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge base:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 DELETE FUNCTION (FIXED)
  const handleDeletePages = async () => {
      if(selectedPages.length === 0) return;
      if(!window.confirm(`Are you sure you want to delete ${selectedPages.length} pages from ${selectedDoc.subject}?`)) return;

      setIsDeleting(true);
      try {
          // 👇👇👇 මෙතන තමයි වෙනස. කෙලින්ම Brain URL එකට යවනවා.
          const res = await fetch('https://myguru.lumi-automation.com/brain/knowledge/delete_pages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  subject: selectedDoc.subject,
                  grade: selectedDoc.grade,
                  medium: selectedDoc.medium,
                  category: selectedDoc.category || selectedDoc.type,
                  pages: selectedPages
              })
          });

          if (!res.ok) throw new Error("Failed to delete pages from Brain Engine");

          // සාර්ථක නම් UI එක update කරන්න
          alert("Pages deleted successfully!");
          setSelectedPages([]);
          setSelectedDoc(null); // Close modal
          fetchData(); // Refresh data
      } catch (error) {
          console.error("Delete failed:", error);
          alert("Failed to delete pages. Check console.");
      } finally {
          setIsDeleting(false);
      }
  };

  const togglePageSelection = (page) => {
      if (selectedPages.includes(page)) {
          setSelectedPages(selectedPages.filter(p => p !== page));
      } else {
          setSelectedPages([...selectedPages, page]);
      }
  };

  // --- FILTER LOGIC ---
  const filteredData = data.filter(item => {
    const matchesSearch = item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = filterGrade === 'All' || item.grade?.toString() === filterGrade;
    const matchesMedium = filterMedium === 'All' || item.medium === filterMedium;
    const matchesType = filterType === 'All' || (item.type || item.category) === filterType;

    return matchesSearch && matchesGrade && matchesMedium && matchesType;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setFilterGrade('All');
    setFilterMedium('All');
    setFilterType('All');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
                <Database className="text-amber-500"/> Knowledge Base
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage Uploaded Content & Pages</p>
        </div>
        
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-3 text-gray-500" size={18} />
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Subjects..." 
                className="w-full md:w-64 bg-[#111] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-amber-500 outline-none transition"
            />
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-[#111] border border-white/10 p-4 rounded-2xl mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mr-2">
            <Filter size={16} /> Filters:
        </div>

        <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="bg-black border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-500">
            <option value="All">All Grades</option>
            {[6,7,8,9,10,11,12,13].map(g => <option key={g} value={g.toString()}>Grade {g}</option>)}
        </select>

        <select value={filterMedium} onChange={(e) => setFilterMedium(e.target.value)} className="bg-black border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-500">
            <option value="All">All Mediums</option>
            <option value="Sinhala">Sinhala</option>
            <option value="English">English</option>
            <option value="Tamil">Tamil</option>
        </select>

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-black border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-500">
            <option value="All">All Types</option>
            <option value="textbook">Textbook</option>
            <option value="paper_marking">Past Paper/Marking</option>
            <option value="open_resource">Open Sources</option>
        </select>

        <button onClick={resetFilters} className="ml-auto flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition">
            <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* GRID VIEW */}
      {loading ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-2">
            <Database className="animate-bounce text-amber-500"/>
            Loading Database Records...
          </div>
      ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
            <p>No documents found matching your filters.</p>
            <button onClick={resetFilters} className="text-amber-500 text-sm mt-2 hover:underline">Clear Filters</button>
          </div>
      ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((doc, idx) => (
                <div key={idx} className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition group flex flex-col h-full">
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${doc.type === 'textbook' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                            {doc.type === 'textbook' ? <BookOpen size={24} /> : <FileText size={24}/>}
                        </div>
                        <span className="bg-white/5 border border-white/10 text-[10px] font-bold px-2 py-1 rounded text-gray-400 uppercase tracking-wider">
                            {doc.medium}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{doc.subject}</h3>
                    <div className="flex gap-2 mb-4">
                        <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400 border border-white/5">Grade {doc.grade}</span>
                        <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400 border border-white/5 capitalize">{doc.type?.replace('_', ' ')}</span>
                    </div>

                    <div className="bg-[#050505] rounded-xl p-4 border border-white/5 mb-4 flex-1">
                        <div className="flex justify-between text-xs text-gray-400 mb-3 border-b border-white/5 pb-2">
                            <span>Total Pages</span>
                            <span className="text-white font-bold text-sm">{doc.total_pages}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 content-start">
                            {doc.pages_list.slice(0, 12).map(p => (
                                <span key={p} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">
                                    {p}
                                </span>
                            ))}
                            {doc.pages_list.length > 12 && (
                                <span className="text-[10px] text-gray-500 px-1 pt-0.5">+{doc.pages_list.length - 12} more...</span>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => setSelectedDoc(doc)}
                        className="w-full py-3 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 mt-auto"
                    >
                        <Eye size={18}/> Manage Pages
                    </button>
                </div>
            ))}
          </div>
      )}

      {/* 🔥 DETAIL & DELETE MODAL 🔥 */}
      <AnimatePresence>
        {selectedDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedDoc(null)}
                />
                
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative z-10 shadow-2xl shadow-black"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-3xl font-black text-white">{selectedDoc.subject}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded border border-amber-500/20">Grade {selectedDoc.grade}</span>
                                <span className="text-gray-400 text-sm capitalize">{selectedDoc.medium} • {selectedDoc.type?.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedDoc(null)} className="p-2 bg-white/5 hover:bg-gray-800 rounded-full transition"><X size={24} /></button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="bg-[#050505] p-5 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14}/> Page Manager
                                </h3>
                                <span className="text-[10px] text-gray-500">Click pages to select for deletion</span>
                            </div>
                            
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                {selectedDoc.pages_list.map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => togglePageSelection(p)}
                                        className={`border rounded-lg py-2 text-center text-xs font-bold transition ${
                                            selectedPages.includes(p) 
                                            ? 'bg-red-500 text-white border-red-500 scale-105 shadow-lg shadow-red-900/50' 
                                            : 'bg-blue-600/10 text-blue-400 border-blue-600/20 hover:bg-blue-600/20'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer with Delete Action */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                        <div className="text-xs text-gray-500 font-mono">
                           {selectedPages.length > 0 ? (
                               <span className="text-red-400 font-bold">{selectedPages.length} Pages Selected</span>
                           ) : (
                               <span>Select pages to remove them from knowledge base.</span>
                           )}
                        </div>

                        {selectedPages.length > 0 && (
                            <button 
                                onClick={handleDeletePages}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition disabled:opacity-50"
                            >
                                {isDeleting ? <RotateCcw className="animate-spin" size={16}/> : <Trash2 size={16}/>}
                                {isDeleting ? "Deleting..." : "Delete Selected"}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}
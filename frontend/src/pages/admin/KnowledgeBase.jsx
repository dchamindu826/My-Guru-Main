import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Database, Search, BookOpen, Eye, X, FileText, Filter, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KnowledgeBase() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null); // Modal state

  // --- FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterMedium, setFilterMedium] = useState('All');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

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

  // --- FILTER LOGIC ---
  const filteredData = data.filter(item => {
    const matchesSearch = item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = filterGrade === 'All' || item.grade?.toString() === filterGrade;
    const matchesMedium = filterMedium === 'All' || item.medium === filterMedium;
    const matchesType = filterType === 'All' || (item.type || item.category) === filterType;

    return matchesSearch && matchesGrade && matchesMedium && matchesType;
  });

  // Reset Filters
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
        
        {/* SEARCH BAR */}
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-3 text-gray-500" size={18} />
            <input 
                type="text" 
                value={searchTerm}
                placeholder="Search Subjects..." 
                className="w-full md:w-64 bg-[#111] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-amber-500 outline-none transition"
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* 🔥 FILTERS BAR 🔥 */}
      <div className="bg-[#111] border border-white/10 p-4 rounded-2xl mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mr-2">
            <Filter size={16} /> Filters:
        </div>

        {/* Grade Filter */}
        <select 
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="bg-black border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-500"
        >
            <option value="All">All Grades</option>
            <option value="10">Grade 06</option>
            <option value="10">Grade 07</option>
            <option value="10">Grade 08</option>
            <option value="10">Grade 09</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
        </select>

        {/* Medium Filter */}
        <select 
            value={filterMedium}
            onChange={(e) => setFilterMedium(e.target.value)}
            className="bg-black border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-500"
        >
            <option value="All">All Mediums</option>
            <option value="Sinhala">Sinhala</option>
            <option value="English">English</option>
            <option value="Tamil">Tamil</option>
        </select>

        {/* Type Filter */}
        <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-amber-500"
        >
            <option value="All">All Types</option>
            <option value="textbook">Textbook</option>
            <option value="paper">Past Paper</option>
            <option value="marking_scheme">Marking Scheme</option>
            <option value="open_sources">Open Sources</option>
        </select>

        {/* Reset Button */}
        <button 
            onClick={resetFilters}
            className="ml-auto flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition"
        >
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
                        <div className={`p-3 rounded-xl ${
                            doc.type === 'textbook' ? 'bg-blue-500/10 text-blue-400' : 
                            doc.type === 'paper' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-green-500/10 text-green-400'
                        }`}>
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

                    {/* Stats Box */}
                    <div className="bg-[#050505] rounded-xl p-4 border border-white/5 mb-4 flex-1">
                        <div className="flex justify-between text-xs text-gray-400 mb-3 border-b border-white/5 pb-2">
                            <span>Total Pages Uploaded</span>
                            <span className="text-white font-bold text-sm">{doc.total_pages}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 content-start">
                            {doc.pages_list.slice(0, 12).map(p => (
                                <span key={p} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">
                                    {p}
                                </span>
                            ))}
                            {doc.pages_list.length > 12 && (
                                <span className="text-[10px] text-gray-500 px-1 pt-0.5">
                                    +{doc.pages_list.length - 12} more...
                                </span>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => setSelectedDoc(doc)}
                        className="w-full py-3 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 mt-auto"
                    >
                        <Eye size={18}/> View Full Details
                    </button>
                </div>
            ))}
          </div>
      )}

      {/* 🔥 DETAIL MODAL (POPUP) 🔥 */}
      <AnimatePresence>
        {selectedDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedDoc(null)}
                />
                
                {/* Modal Content */}
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-[#111] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative z-10 shadow-2xl shadow-black"
                >
                    {/* Modal Header */}
                    <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-3xl font-black text-white">{selectedDoc.subject}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded border border-amber-500/20">
                                    Grade {selectedDoc.grade}
                                </span>
                                <span className="text-gray-400 text-sm capitalize">
                                    {selectedDoc.medium} Medium • {selectedDoc.type?.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedDoc(null)} 
                            className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Modal Body - Scrollable Page List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="bg-[#050505] p-5 rounded-2xl border border-white/5">
                            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14}/> Uploaded Page Index
                            </h3>
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                {selectedDoc.pages_list.map(p => (
                                    <div key={p} className="bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg py-2 text-center text-xs font-bold hover:bg-blue-600/20 transition cursor-default">
                                        {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-xs text-gray-500 font-mono">
                        <span>SOURCE: {selectedDoc.file_name}</span>
                        <span>TOTAL PAGES: {selectedDoc.total_pages}</span>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}
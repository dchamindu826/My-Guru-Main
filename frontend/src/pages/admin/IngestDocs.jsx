import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Play, Terminal, CheckCircle, Loader, RefreshCw, Square } from 'lucide-react';

export default function IngestDocs() {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ grade: '11', subject: '', medium: 'Sinhala', category: 'textbook' });
  const [pages, setPages] = useState({ start: 1, end: 1 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [controller, setController] = useState(null); // Controller State
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleIngest = async (e) => {
    e.preventDefault();
    if(!file || !meta.subject) return alert("Please fill all fields");

    setLoading(true);
    setLogs(["🚀 Initializing System...", "⏳ Uploading File..."]);

    const abortCtrl = new AbortController(); // New Controller
    setController(abortCtrl);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('grade', meta.grade);
    formData.append('subject', meta.subject);
    formData.append('medium', meta.medium);
    formData.append('category', meta.category);
    formData.append('startPage', pages.start);
    formData.append('endPage', pages.end);

    try {
        const response = await fetch('http://localhost:5000/api/ingest', {
            method: 'POST',
            body: formData,
            signal: abortCtrl.signal, // Connect Signal
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            const lines = text.split('\n').filter(line => line.trim() !== '');
            setLogs(prev => [...prev, ...lines]);
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            setLogs(prev => [...prev, "🛑 Process Stopped by User."]);
        } else {
            setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
        }
    } finally {
        setLoading(false);
        setController(null);
    }
  };

  const handleStop = () => {
      if (controller) {
          controller.abort();
          setLoading(false);
      }
  };

  return (
    <div className="w-full text-white min-h-screen p-6">
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
        <FileText className="text-blue-500"/> Knowledge Ingestion System
      </h1>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* LEFT: FORM */}
        <div className="lg:col-span-4 bg-[#111] p-6 rounded-3xl border border-white/10 h-fit">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-200">
                <Upload size={18} className="text-green-500"/> Upload & Config
            </h2>
            
            <form onSubmit={handleIngest} className="space-y-5">
                {/* File Drop */}
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-blue-500/50 transition bg-black/40 relative group">
                    <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center group-hover:scale-105 transition duration-300">
                        {file ? (
                            <div className="text-green-400 font-bold text-sm break-all">
                                <CheckCircle size={24} className="mx-auto mb-2"/> {file.name}
                            </div>
                        ) : (
                            <>
                                <Upload className="text-gray-500 mb-2" size={28}/>
                                <p className="text-xs font-bold text-gray-400">Upload PDF</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Grade</label>
                            <select className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-amber-500"
                                value={meta.grade} onChange={e => setMeta({...meta, grade: e.target.value})}>
                                <option>10</option>
                                <option>11</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Medium</label>
                            <select className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-amber-500"
                                value={meta.medium} onChange={e => setMeta({...meta, medium: e.target.value})}>
                                <option>Sinhala</option>
                                <option>English</option>
                                <option>Tamil</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Resource Type</label>
                        <select className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-amber-500"
                            value={meta.category} onChange={e => setMeta({...meta, category: e.target.value})}>
                            <option value="textbook">Textbook</option>
                            <option value="paper">Past Paper</option>
                            <option value="marking_scheme">Marking Scheme</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Subject Name</label>
                        <input type="text" placeholder="e.g. History" className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-amber-500"
                            value={meta.subject} onChange={e => setMeta({...meta, subject: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Start Page</label>
                            <input type="number" className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-amber-500"
                                value={pages.start} onChange={e => setPages({...pages, start: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">End Page</label>
                            <input type="number" className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-amber-500"
                                value={pages.end} onChange={e => setPages({...pages, end: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* Buttons: Start & Stop */}
                <div className="flex gap-2">
                    {!loading ? (
                        <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/20">
                            <Play size={18} fill="currentColor"/> Start Ingestion
                        </button>
                    ) : (
                        <button type="button" onClick={handleStop} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-red-500/20 animate-pulse">
                            <Square size={18} fill="currentColor"/> Stop Process
                        </button>
                    )}
                </div>
            </form>
        </div>

        {/* RIGHT: TERMINAL */}
        <div className="lg:col-span-8 flex flex-col h-[600px]">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-t-3xl p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-amber-500"/> 
                    <span className="font-mono text-sm font-bold text-gray-300">Live Ingestion Logs</span>
                </div>
                <button onClick={() => setLogs([])} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                    <RefreshCw size={12}/> Clear
                </button>
            </div>
            
            <div className="flex-1 bg-[#050505] border-x border-b border-white/10 rounded-b-3xl p-6 overflow-y-auto font-mono text-sm space-y-3 custom-scrollbar shadow-inner">
                {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-2 opacity-50">
                        <Terminal size={40}/>
                        <p>Waiting for process to start...</p>
                    </div>
                )}
                
                {logs.map((log, i) => (
                    <div key={i} className={`pl-3 border-l-2 leading-relaxed break-words ${
                        log.includes('ERROR') || log.includes('❌') ? 'text-red-400 border-red-500' : 
                        log.includes('✅') ? 'text-green-400 border-green-500' :
                        log.includes('📝') ? 'text-gray-400 border-gray-600 text-xs italic' :
                        'text-blue-300 border-blue-500/30'
                    }`}>
                        {log}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>

      </div>
    </div>
  );
}
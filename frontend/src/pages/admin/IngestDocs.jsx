import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Play, Terminal, CheckCircle, RefreshCw, Square } from 'lucide-react';

export default function IngestDocs() {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ grade: '11', subject: '', medium: 'Sinhala', category: 'textbook' });
  const [pages, setPages] = useState({ start: 1, end: 1 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [controller, setController] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleIngest = async (e) => {
    e.preventDefault();
    if(!file || !meta.subject) return alert("Please fill all fields");

    setLoading(true);
    setLogs(["🚀 Initializing System...", "📂 Reading PDF File...", "⏳ Connecting to Brain Engine..."]);

    const abortCtrl = new AbortController();
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
        // 🔥 FIXED: Updated to Production Domain URL
        const response = await fetch('https://myguru.lumi-automation.com/ingest', { 
            method: 'POST',
            body: formData,
            signal: abortCtrl.signal,
        });

        if (!response.ok) throw new Error(`Server Error: ${response.status}`);
        if (!response.body) throw new Error("ReadableStream not supported.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        setLogs(prev => [...prev, "✅ Connected! Starting Extraction..."]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
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

  const handleStop = (e) => {
      if (e) e.preventDefault(); // 🔥 Form එක auto submit වෙන එක නවත්තනවා
      if (controller) {
          controller.abort();
          setLoading(false);
          setLogs(prev => [...prev, "🛑 Force Stopped!"]);
      }
  };

  return (
    <div className="w-full text-white min-h-screen p-6 bg-[#050505]">
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        <FileText className="text-blue-500"/> Knowledge Ingestion Engine
      </h1>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-[#111] p-6 rounded-3xl border border-white/10 h-fit shadow-2xl">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-200">
                <Upload size={18} className="text-green-500"/> Config & Upload
            </h2>
            <form onSubmit={handleIngest} className="space-y-5">
                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-blue-500/50 transition bg-black/40 relative group">
                    <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center">
                        {file ? <div className="text-green-400 font-bold text-sm"><CheckCircle size={24} className="mx-auto mb-2"/> {file.name}</div> : <><Upload className="text-gray-500 mb-2" size={28}/><p className="text-xs font-bold text-gray-400">Drop PDF Here</p></>}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {/* 🔥 Grade Dropdown Update කරා O/L, A/L එක්ක */}
                        <div><label className="text-[10px] text-gray-500 uppercase font-bold">Grade</label><select className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white" value={meta.grade} onChange={e => setMeta({...meta, grade: e.target.value})}><option value="O/L">O/L</option><option value="A/L">A/L</option>{[6,7,8,9,10,11].map(g => <option key={g} value={g}>Grade {g}</option>)}</select></div>
                        <div><label className="text-[10px] text-gray-500 uppercase font-bold">Medium</label><select className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white" value={meta.medium} onChange={e => setMeta({...meta, medium: e.target.value})}><option>Sinhala</option><option>English</option><option>Tamil</option></select></div>
                    </div>
                    {/* 🔥 Category එකට Picture PDF add කරා 🔥 */}
                    <div><label className="text-[10px] text-gray-500 uppercase font-bold">Category</label><select className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white" value={meta.category} onChange={e => setMeta({...meta, category: e.target.value})}><option value="textbook">Text Book</option><option value="paper_marking">Paper & Marking</option><option value="open_resource">Open Resource</option><option value="picture_pdf">Picture PDF</option></select></div>
                    <div><label className="text-[10px] text-gray-500 uppercase font-bold">Subject</label><input type="text" className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white" value={meta.subject} onChange={e => setMeta({...meta, subject: e.target.value})} placeholder="Subject Name" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-gray-500 uppercase font-bold">Start Page</label><input type="number" className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white" value={pages.start} onChange={e => setPages({...pages, start: e.target.value})} /></div>
                        <div><label className="text-[10px] text-gray-500 uppercase font-bold">End Page</label><input type="number" className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white" value={pages.end} onChange={e => setPages({...pages, end: e.target.value})} /></div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    {!loading ? <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Play size={18}/> Start Ingest</button> : <button type="button" onClick={handleStop} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 animate-pulse"><Square size={18}/> STOP</button>}
                </div>
            </form>
        </div>

        <div className="lg:col-span-8 flex flex-col h-[650px]">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-t-3xl p-4 flex items-center justify-between"><div className="flex items-center gap-2"><Terminal size={18} className="text-amber-500"/> <span className="font-mono text-sm font-bold text-gray-300">Live Logs</span></div><button onClick={() => setLogs([])} className="text-xs text-gray-500 flex items-center gap-1"><RefreshCw size={12}/> Clear</button></div>
            <div className="flex-1 bg-black border-x border-b border-white/10 rounded-b-3xl p-6 overflow-y-auto font-mono text-xs md:text-sm space-y-2 custom-scrollbar">
                {logs.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-800"><Terminal size={48} className="opacity-20"/><p className="opacity-40">Ready...</p></div>}
                {logs.map((log, i) => <div key={i} className={`p-2 rounded border-l-2 break-words ${log.includes('❌') ? 'bg-red-900/10 text-red-400 border-red-500' : log.includes('✅') ? 'bg-green-900/10 text-green-400 border-green-500' : 'text-gray-300 border-gray-700'}`}>{log}</div>)}
                <div ref={logsEndRef} />
            </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { AlertTriangle, Star, Trash2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

export default function StudentFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/feedbacks?page=${page}`);
      setFeedbacks(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, [page]);

  const handleDelete = async (id) => {
    if(window.confirm("Delete this?")) {
        await api.delete(`/feedbacks/${id}`);
        fetchFeedbacks();
    }
  };

  return (
    <div className="w-full text-white">
      <h1 className="text-3xl font-black mb-8">Student Reports & Reviews</h1>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
            <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : (
            <div className="divide-y divide-white/5">
                {feedbacks.map((fb) => (
                    <div key={fb.id} className="p-6 flex flex-col md:flex-row justify-between gap-4 hover:bg-white/5 transition">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1 ${fb.type === 'Bot Issue' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                    {fb.type === 'Bot Issue' ? <AlertTriangle size={12}/> : <Star size={12}/>}
                                    {fb.type}
                                </span>
                                <span className="text-gray-500 text-xs">{new Date(fb.created_at).toLocaleDateString()}</span>
                                <span className="text-gray-400 text-xs font-mono">{fb.user_email}</span>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed">"{fb.message}"</p>
                            
                            {fb.type === 'Appreciation' && (
                                <div className="flex gap-0.5 mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={12} className={i < fb.rating ? "text-amber-500 fill-amber-500" : "text-gray-800"} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Copy Button removed - Admin can manually copy if they want */}
                            <button onClick={() => handleDelete(fb.id)} className="p-2 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                ))}
                {feedbacks.length === 0 && <div className="p-8 text-center text-gray-500">No feedbacks yet.</div>}
            </div>
        )}

        {/* Pagination */}
        <div className="p-4 bg-[#0A0A0A] border-t border-white/10 flex justify-between items-center">
            <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="text-sm flex items-center gap-1 text-gray-400 hover:text-white disabled:opacity-50">
                <ArrowLeft size={16}/> Previous
            </button>
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p+1)} className="text-sm flex items-center gap-1 text-gray-400 hover:text-white disabled:opacity-50">
                Next <ArrowRight size={16}/>
            </button>
        </div>
      </div>
    </div>
  );
}
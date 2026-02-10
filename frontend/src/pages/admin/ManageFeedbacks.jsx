import React, { useState, useEffect } from 'react';
import { Star, Trash2, User, MessageSquare, Plus } from 'lucide-react';
import { api } from '../../lib/api';

export default function ManageFeedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [formData, setFormData] = useState({ student_name: '', message: '', rating: 5, role: 'Student' });

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    const res = await api.get('/testimonials');
    setFeedbacks(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/testimonials', formData);
    setFormData({ student_name: '', message: '', rating: 5, role: 'Student' });
    fetchFeedbacks();
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this feedback?")) {
        await api.delete(`/testimonials/${id}`);
        fetchFeedbacks();
    }
  };

  return (
    <div className="w-full text-white">
      <h1 className="text-3xl font-black mb-8">Manage Testimonials</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* FORM SECTION */}
        <div className="bg-[#111] p-6 rounded-2xl border border-white/10 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="text-amber-500"/> Add New Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Name</label>
                    <input type="text" className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none" 
                        value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} required />
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Role</label>
                    <select className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                        value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                        <option>Student</option>
                        <option>Teacher</option>
                        <option>Parent</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Message</label>
                    <textarea className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none h-24" 
                        value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Rating</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                                key={star} size={24} 
                                className={`cursor-pointer transition ${star <= formData.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-600'}`}
                                onClick={() => setFormData({...formData, rating: star})}
                            />
                        ))}
                    </div>
                </div>
                <button type="submit" className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 transition">Publish Feedback</button>
            </form>
        </div>

        {/* LIST SECTION */}
        <div className="lg:col-span-2 space-y-4">
            {feedbacks.map((fb) => (
                <div key={fb.id} className="bg-[#111] p-5 rounded-xl border border-white/10 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400">
                            {fb.student_name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white">{fb.student_name}</h3>
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">{fb.role}</span>
                            </div>
                            <div className="flex gap-0.5 my-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} className={i < fb.rating ? "text-amber-500 fill-amber-500" : "text-gray-700"} />
                                ))}
                            </div>
                            <p className="text-gray-400 text-sm mt-1">"{fb.message}"</p>
                        </div>
                    </div>
                    <button onClick={() => handleDelete(fb.id)} className="text-red-500 hover:text-red-400 bg-red-500/10 p-2 rounded-lg"><Trash2 size={16}/></button>
                </div>
            ))}
            {feedbacks.length === 0 && <p className="text-gray-500">No feedbacks added yet.</p>}
        </div>

      </div>
    </div>
  );
}
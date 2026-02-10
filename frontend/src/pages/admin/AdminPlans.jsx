import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, X } from 'lucide-react';
import { api } from '../../lib/api'; 
import { motion } from 'framer-motion';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State (Keys match Supabase Columns)
  const [formData, setFormData] = useState({
    name: '', price: '', period: '', features: '', is_popular: false 
  });

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // String -> Array Conversion (Clean up extra spaces)
      const featureArray = formData.features.split(',').map(f => f.trim()).filter(f => f !== '');
      
      // Send to Backend
      await api.post('/plans', { ...formData, features: featureArray });
      
      setShowModal(false);
      setFormData({ name: '', price: '', period: '', features: '', is_popular: false });
      fetchPlans(); // Refresh Grid
    } catch (err) {
      alert("Error adding plan. Make sure backend is running.");
      console.error(err);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
        try {
            await api.delete(`/plans/${id}`);
            fetchPlans();
        } catch (err) {
            alert("Error deleting plan");
        }
    }
  };

  return (
    <div className="w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
              <h1 className="text-3xl font-black text-white">Manage Pricing</h1>
              <p className="text-gray-400 text-sm mt-1">Create and manage your subscription packages.</p>
          </div>
          <button 
              onClick={() => setShowModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
          >
              <Plus size={20} /> Add New Plan
          </button>
      </div>

      {/* PLANS GRID */}
      {loading ? (
          <div className="text-center text-gray-500 py-20">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
                <div key={plan.id} className="group relative bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                            <span className="text-xs text-gray-500 font-mono uppercase">{plan.period}</span>
                        </div>
                        {plan.is_popular && <span className="bg-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-1 rounded">POPULAR</span>}
                    </div>
                    
                    {/* Price */}
                    <div className="text-3xl font-black text-white mb-6">{plan.price}</div>
                    
                    {/* Features List (Limit to 3) */}
                    <div className="space-y-2 mb-6 min-h-[80px]">
                        {Array.isArray(plan.features) && plan.features.slice(0, 3).map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div> {feat}
                            </div>
                        ))}
                        {Array.isArray(plan.features) && plan.features.length > 3 && (
                            <div className="text-xs text-gray-600 pl-4">+{plan.features.length - 3} more features</div>
                        )}
                    </div>

                    {/* Delete Button */}
                    <div className="pt-4 border-t border-white/5 flex justify-end">
                        <button 
                            onClick={() => handleDelete(plan.id)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition"
                            title="Delete Plan"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* MODAL: ADD PLAN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#151515] border border-white/10 w-full max-w-lg rounded-2xl p-8 shadow-2xl relative"
            >
                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
                <h2 className="text-2xl font-bold mb-6 text-white">Create New Package</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Plan Name</label>
                            <input 
                                type="text" placeholder="e.g. Scholar" 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Price</label>
                            <input 
                                type="text" placeholder="e.g. Rs. 1500" 
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Billing Period</label>
                        <input 
                            type="text" placeholder="e.g. Per Month / Per Term" 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                            value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} required
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-bold uppercase block mb-1">Features (Comma Separated)</label>
                        <textarea 
                            placeholder="100 Questions, All Subjects, Teacher Support" 
                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500 outline-none h-24 resize-none"
                            value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} required
                        />
                    </div>

                    {/* Popular Checkbox */}
                    <div 
                        className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition" 
                        onClick={() => setFormData({...formData, is_popular: !formData.is_popular})}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${formData.is_popular ? 'bg-amber-500 border-amber-500' : 'border-gray-500'}`}>
                            {formData.is_popular && <CheckCircle size={14} className="text-black" />}
                        </div>
                        <span className="text-sm font-bold text-amber-500">Mark as "Best Value"</span>
                    </div>

                    <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl mt-4 hover:bg-gray-200 transition">
                        Publish Plan
                    </button>
                </form>
            </motion.div>
        </div>
      )}

    </div>
  );
}
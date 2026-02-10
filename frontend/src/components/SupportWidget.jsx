import React, { useState } from 'react';
import { MessageSquare, X, Send, Star, AlertTriangle, ThumbsUp } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('Appreciation'); // 'Appreciation' or 'Bot Issue'
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);

    try {
        await api.post('/feedbacks', {
            user_email: user?.email || 'Guest',
            message,
            rating,
            type
        });
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setIsOpen(false);
            setMessage('');
        }, 2000);
    } catch (error) {
        console.error(error);
    } finally {
        setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
        
        {/* Toggle Button */}
        {!isOpen && (
            <motion.button 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                onClick={() => setIsOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black p-4 rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-110"
            >
                <MessageSquare size={24} fill="currentColor" />
            </motion.button>
        )}

        {/* Form Modal */}
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="bg-[#111] border border-white/10 w-80 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-[#151515] p-4 flex justify-between items-center border-b border-white/5">
                        <h3 className="font-bold text-white text-sm">Feedback & Support</h3>
                        <button onClick={() => setIsOpen(false)}><X size={18} className="text-gray-400 hover:text-white"/></button>
                    </div>

                    {sent ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ThumbsUp size={24}/>
                            </div>
                            <p className="text-white font-bold">Thank You!</p>
                            <p className="text-xs text-gray-400 mt-1">We received your feedback.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            
                            {/* Type Selector */}
                            <div className="flex bg-black p-1 rounded-lg border border-white/10">
                                <button type="button" onClick={() => setType('Appreciation')} className={`flex-1 py-2 text-xs font-bold rounded-md transition flex items-center justify-center gap-1 ${type === 'Appreciation' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}>
                                    <Star size={12}/> Review
                                </button>
                                <button type="button" onClick={() => setType('Bot Issue')} className={`flex-1 py-2 text-xs font-bold rounded-md transition flex items-center justify-center gap-1 ${type === 'Bot Issue' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                                    <AlertTriangle size={12}/> Issue
                                </button>
                            </div>

                            {/* Star Rating (Only for Reviews) */}
                            {type === 'Appreciation' && (
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star 
                                            key={star} 
                                            size={20} 
                                            className={`cursor-pointer transition ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-700'}`}
                                            onClick={() => setRating(star)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Message Area */}
                            <textarea 
                                placeholder={type === 'Bot Issue' ? "Describe the bug..." : "How was your experience?"}
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none h-24 resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />

                            <button disabled={sending} className="w-full bg-white text-black font-bold py-2 rounded-lg text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2">
                                {sending ? "Sending..." : <><Send size={16}/> Send Feedback</>}
                            </button>
                        </form>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
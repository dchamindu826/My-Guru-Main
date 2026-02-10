import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatsAppWidget() {
  // Replace with your WhatsApp Number
  const WA_NUMBER = "94701234567"; 

  return (
    <a 
      href={`https://wa.me/${WA_NUMBER}?text=Hi MyGuru Support, I need help.`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-6 z-50 group" // bottom-24 damme ara anith feedback widget eka bottom-6 nisa (e deka hapunoth kathai)
    >
        <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            className="bg-[#25D366] text-white p-4 rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center relative"
        >
            <MessageCircle size={28} fill="white" className="text-white" />
            
            {/* Tooltip Effect */}
            <span className="absolute right-full mr-4 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                Chat on WhatsApp
            </span>
        </motion.div>
    </a>
  );
}
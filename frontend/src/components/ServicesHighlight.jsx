import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Cpu, Sparkles, ArrowRight } from 'lucide-react';

export default function ServicesHighlight() {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
                whileHover={{ scale: 1.01 }}
                className="bg-gradient-to-r from-[#111] via-[#151515] to-[#111] border border-white/10 p-10 md:p-16 rounded-[3rem] text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl hover:border-indigo-500/50 transition-all duration-500 group"
            >
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-400 text-xs font-bold uppercase mb-6">
                        <Sparkles size={14} /> New Service
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                        Need a Custom AI <br/> for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Company?</span>
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        We build tailored AI Agents trained on your own data. Perfect for Customer Support, Internal Knowledge Bases, and Automated Workflows.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                            <Bot className="text-indigo-500" size={18}/> 24/7 Support Bot
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300 bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                            <Cpu className="text-purple-500" size={18}/> Custom Training
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="w-64 h-64 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full blur-2xl opacity-20 absolute top-0 right-0"></div>
                    <button className="relative bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-50 hover:gap-5 transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]">
                        Get a Quote <ArrowRight size={20}/>
                    </button>
                </div>
            </motion.div>
        </div>
    </section>
  );
}
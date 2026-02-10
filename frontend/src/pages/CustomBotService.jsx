import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BrainCircuit, MessageSquare, FileText, Server, Bot, ArrowRight, Check } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function CustomBotService() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
      
      {/* HERO SECTION - Pure Black & Centered */}
      <section className="py-32 px-6 text-center max-w-5xl mx-auto">
        <motion.div 
            initial="hidden" animate="visible" variants={fadeInUp}
        >
            <div className="inline-block px-4 py-1.5 mb-6 border border-white/20 rounded-full text-xs font-bold tracking-widest uppercase text-gray-400">
                AI Automation Solutions
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-white">
                Future of <span className="text-gray-500">Business Logic.</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                We build intelligent AI agents that automate your institute's workflow. 
                From slip verification to student support—completely automated.
            </p>

            <button 
                onClick={() => window.open('https://wa.me/94701234567', '_blank')}
                className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-full font-bold text-lg transition flex items-center gap-3 mx-auto"
            >
                Start Automation <ArrowRight size={20}/>
            </button>
        </motion.div>
      </section>

      {/* SERVICES GRID - Clean Cards */}
      <section className="px-6 pb-32 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ServiceCard 
                title="Auto Slip Verification"
                desc="Automatically verify bank slips, cross-check amounts, and approve student enrollments instantly without human intervention."
                icon={ShieldCheck}
            />
            <ServiceCard 
                title="RAG Knowledge Base"
                desc="Train custom AI on your institute's PDF documents and data. It answers student queries accurately based on your material."
                icon={BrainCircuit}
            />
            <ServiceCard 
                title="WhatsApp Agents"
                desc="Deploy 24/7 WhatsApp bots that handle inquiries, register students, and provide class schedules automatically."
                icon={MessageSquare}
            />
            <ServiceCard 
                title="AI Paper Grading"
                desc="Upload student answer sheets and let our AI grade them against your marking scheme, providing instant feedback."
                icon={FileText}
            />
            <ServiceCard 
                title="Payment Reconciliation"
                desc="Sync your bank SMS alerts with uploaded slips to ensure 100% accurate financial tracking and fraud prevention."
                icon={Server}
            />
            <ServiceCard 
                title="Custom Dashboards"
                desc="Get a powerful admin panel to monitor your AI agents, view analytics, and manage student data in one place."
                icon={Bot}
            />
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="border-t border-white/10 py-20 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to scale?</h2>
          <p className="text-gray-500 mb-8">Join the institutes powered by Code Aura.</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2"><Check size={16} className="text-white"/> Fast Setup</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-white"/> Secure Data</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-white"/> 24/7 Support</span>
          </div>
      </section>

    </div>
  );
}

// Clean Minimal Card Component
function ServiceCard({ title, desc, icon: Icon }) {
    return (
        <div className="bg-[#0A0A0A] hover:bg-[#111] border border-white/10 p-8 rounded-2xl transition duration-300 group">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition">
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Code, Globe, User, Cpu, ShieldCheck, Zap, Users, Rocket } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500/30">
      
      {/* HERO HEADER */}
      <section className="relative py-24 px-6 text-center border-b border-white/5 bg-gradient-to-b from-[#111] to-black">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="relative z-10 max-w-4xl mx-auto">
            <span className="text-amber-500 font-bold tracking-widest text-xs uppercase mb-4 block">Our Story</span>
            <h1 className="text-5xl md:text-7xl font-black mb-6">
                Revolutionizing <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Education</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                MyGuru is Sri Lanka's first AI-powered educational assistant, designed to make personalized learning accessible to everyone.
            </p>
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section className="py-12 border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                  <h3 className="text-4xl font-black text-white mb-1">10k+</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase">Students</p>
              </div>
              <div>
                  <h3 className="text-4xl font-black text-white mb-1">500+</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase">Institutes</p>
              </div>
              <div>
                  <h3 className="text-4xl font-black text-white mb-1">24/7</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase">AI Support</p>
              </div>
              <div>
                  <h3 className="text-4xl font-black text-white mb-1">99%</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase">Satisfaction</p>
              </div>
          </div>
      </section>

      {/* TEAM SECTION */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Meet The <span className="text-amber-500">Visionaries</span></h2>
            <p className="text-gray-400">The minds behind the magic.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
            {/* FOUNDER CARD */}
            <div className="group bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl hover:border-amber-500/50 transition duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition"></div>
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                        <User size={32} className="text-gray-400"/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Mr. Founder Name</h3>
                        <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">Founder & CEO</p>
                    </div>
                </div>
                <p className="text-gray-400 leading-relaxed text-sm">
                    "We are not just building software; we are building the future of how students learn in Sri Lanka. MyGuru is the bridge between technology and education."
                </p>
            </div>

            {/* CHAMINDU CARD */}
            <div className="group bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl hover:border-blue-500/50 transition duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition"></div>
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                        <Code size={32} className="text-gray-400"/>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Chamindu Dilshan</h3>
                        <p className="text-blue-500 text-xs font-bold uppercase tracking-widest">Senior Developer & AI Engineer</p>
                    </div>
                </div>
                <p className="text-gray-400 leading-relaxed text-sm">
                    "Building intelligent systems that can think, learn, and assist is my passion. MyGuru utilizes state-of-the-art RAG architecture to deliver accurate knowledge."
                </p>
                <div className="flex gap-3 mt-4">
                    <span className="p-1.5 bg-white/5 rounded text-gray-500"><Globe size={16}/></span>
                    <span className="p-1.5 bg-white/5 rounded text-gray-500"><Cpu size={16}/></span>
                </div>
            </div>
        </div>
      </section>

      {/* WHY US GRID */}
      <section className="py-24 bg-[#080808] border-t border-white/5">
          <div className="max-w-6xl mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-6">
                      <Zap className="text-amber-500 mb-4" size={32} />
                      <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
                      <p className="text-gray-500 text-sm">Powered by Gemini 2.0 for instant responses.</p>
                  </div>
                  <div className="p-6">
                      <ShieldCheck className="text-green-500 mb-4" size={32} />
                      <h3 className="text-xl font-bold mb-2">Verified Content</h3>
                      <p className="text-gray-500 text-sm">All answers are cross-checked with school syllabus.</p>
                  </div>
                  <div className="p-6">
                      <Users className="text-blue-500 mb-4" size={32} />
                      <h3 className="text-xl font-bold mb-2">Student First</h3>
                      <p className="text-gray-500 text-sm">Designed specifically for Sri Lankan curriculum.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 text-center px-6">
          <h2 className="text-3xl font-bold mb-6">Join the Revolution</h2>
          <button onClick={() => window.open('https://wa.me/94701234567', '_blank')} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition flex items-center gap-2 mx-auto">
              Contact Us <Rocket size={20}/>
          </button>
      </section>

    </div>
  );
}
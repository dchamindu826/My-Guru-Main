import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Facebook, Mail, Phone, ExternalLink } from 'lucide-react';

// Custom TikTok Icon (Since generic Lucide doesn't always have it)
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
);

export default function Footer() {
  const navigate = useNavigate();

  const socialLinks = [
    { icon: <Facebook size={20} />, href: "#", color: "hover:text-blue-500" },
    { icon: <TikTokIcon />, href: "#", color: "hover:text-pink-500" },
    { icon: <Phone size={20} />, href: "https://wa.me/94701234567", color: "hover:text-green-500" }, // WhatsApp
    { icon: <Mail size={20} />, href: "mailto:support@myguru.lk", color: "hover:text-red-500" },
  ];

  return (
    <footer className="bg-[#020202] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* BRAND */}
            <div className="col-span-2">
                <h2 className="text-2xl font-black text-white mb-4">My Guru <span className="text-amber-500">.</span></h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                    Empowering Sri Lankan students with AI-driven education. 
                    Personalized learning, simplified for O/L & A/L success.
                </p>
            </div>

            {/* QUICK LINKS */}
            <div>
                <h3 className="text-white font-bold mb-4">Explore</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                    <li><button onClick={() => navigate('/')} className="hover:text-amber-500 transition">Home</button></li>
                    <li><button onClick={() => navigate('/about')} className="hover:text-amber-500 transition">About Us</button></li>
                    <li><button onClick={() => navigate('/#pricing')} className="hover:text-amber-500 transition">Pricing Plans</button></li>
                    <li><button onClick={() => navigate('/chat')} className="hover:text-amber-500 transition">Chat Bot</button></li>
                </ul>
            </div>

            {/* LEGAL */}
            <div>
                <h3 className="text-white font-bold mb-4">Legal</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                    <li><button onClick={() => navigate('/privacy')} className="hover:text-amber-500 transition">Privacy Policy</button></li>
                    <li><button onClick={() => navigate('/terms')} className="hover:text-amber-500 transition">Terms & Conditions</button></li>
                </ul>
            </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">© 2026 Code Aura. All rights reserved.</p>
            
            <div className="flex gap-6">
                {socialLinks.map((social, index) => (
                    <a key={index} href={social.href} target="_blank" rel="noreferrer" className={`text-gray-400 transition ${social.color}`}>
                        {social.icon}
                    </a>
                ))}
            </div>
        </div>

      </div>
    </footer>
  );
}
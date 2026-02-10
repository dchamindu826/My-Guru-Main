import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApiSection() {
  // Replace this with your actual WhatsApp number (without +)
  const WA_NUMBER = "94701234567"; 

  const handleRequest = (planName) => {
    const message = `Hello MyGuru, I am interested in the *${planName}*. Please send me the API details.`;
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const apiPlans = [
    { name: "Starter API", price: "Rs. 5,000", limit: "5,000 Req/mo", target: "For Testing", color: "blue" },
    { name: "Growth API", price: "Rs. 15,000", limit: "20,000 Req/mo", target: "For Classes", color: "amber", popular: true },
    { name: "Enterprise", price: "Rs. 45,000", limit: "100k Req/mo", target: "For Institutes", color: "purple" }
  ];

  return (
    <section className="py-24 bg-black relative overflow-hidden" id="api">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
            <span className="text-amber-500 font-bold tracking-widest uppercase text-xs">For Developers</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-6">MyGuru <span className="text-amber-500">API</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Integrate our brain into your LMS or Website.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
            {apiPlans.map((plan, i) => (
                <motion.div 
                    key={i}
                    whileHover={{ y: -10 }}
                    className={`bg-[#111] border ${plan.popular ? 'border-amber-500' : 'border-white/10'} p-8 rounded-3xl relative flex flex-col`}
                >
                    {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase">Best Value</span>}
                    
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-gray-500 text-xs uppercase font-bold mt-1">{plan.target}</p>
                    
                    <div className="my-6">
                        <span className="text-3xl font-black text-white">{plan.price}</span>
                        <span className="text-gray-500 text-sm">/mo</span>
                    </div>

                    <div className="space-y-3 mb-8 flex-1">
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Check size={16} className={`text-${plan.color}-500`} /> {plan.limit}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Check size={16} className={`text-${plan.color}-500`} /> Full Access
                        </div>
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <Check size={16} className={`text-${plan.color}-500`} /> 99.9% Uptime
                        </div>
                    </div>

                    <button 
                        onClick={() => handleRequest(plan.name)}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition ${plan.popular ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        Request Key
                    </button>
                </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🔥 අලුතින් එකතු කළා
import { Check, Crown, Zap, Building2, GraduationCap, Star, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Plans() {
  const [activeTab, setActiveTab] = useState('student');
  const navigate = useNavigate(); // 🔥 අලුතින් එකතු කළා

  // 🔥 STUDENT PLANS (Hardcoded - No Backend Needed)
  const studentPlans = [
    {
      id: 'free',
      name: 'Starter Plan',
      price: 'Free',
      color: 'green',
      desc_en: 'Perfect for trying out MyGuru.',
      desc_si: 'MyGuru අත්හදා බැලීමට සුදුසුයි.',
      features: ['3 Questions Per Day', 'Basic AI Answers', 'No Past Papers'],
      link: 'chat'
    },
    {
      id: 'scholar',
      name: 'Scholar Plan',
      price: 'Rs. 1500',
      period: '/month',
      color: 'red',
      popular: true,
      desc_en: 'Daily help for serious students.',
      desc_si: 'දිනපතා ඉගෙන ගන්නා සිසුන් සඳහා.',
      features: ['100 Questions Per Day', 'Faster AI Responses', 'Access Past Papers', 'Priority Support'],
      link: '/checkout' // 🔥 වෙනස් කළා
    },
    {
      id: 'genius',
      name: 'Genius Plan',
      price: 'Rs. 4500',
      period: '/month',
      color: 'amber', // Gold
      desc_en: 'Unlimited access to everything.',
      desc_si: 'සීමාවකින් තොරව සියල්ල ලබාගන්න.',
      features: ['Unlimited Questions', 'Teacher Verification', 'WhatsApp Bot Access', 'Personalized Study Plan'],
      link: '/checkout' // 🔥 වෙනස් කළා
    }
  ];

  // 🔥 INSTITUTE PLANS
  const institutePlans = [
    {
      id: 'inst-starter',
      name: 'Institute Starter',
      price: 'Rs. 15,000',
      type: 'One-time',
      color: 'blue',
      desc_en: 'Basic automation for small classes.',
      desc_si: 'කුඩා පන්ති සඳහා මූලික ස්වයංක්‍රීයකරණය.',
      features: ['Simple Chatbot', 'WhatsApp Integration', 'Email Support'],
      link: 'https://wa.me/94714941559?text=I need Institute Starter Plan'
    },
    {
      id: 'inst-pro',
      name: 'Institute Pro',
      price: 'Custom',
      type: 'Monthly',
      color: 'purple',
      desc_en: 'Full AI suite for large institutes.',
      desc_si: 'විශාල ආයතන සඳහා සම්පූර්ණ AI විසඳුම.',
      features: ['Advanced RAG Bot', 'Auto Slip Verification', 'Full Database Sync', '24/7 Priority Support'],
      link: 'https://wa.me/94714941559?text=I need Institute Pro Plan'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
        case 'green': return 'border-green-500/50 shadow-green-900/20';
        case 'red': return 'border-red-500/50 shadow-red-900/20';
        case 'amber': return 'border-amber-500/50 shadow-amber-900/20'; // Gold
        case 'blue': return 'border-blue-500/50 shadow-blue-900/20';
        case 'purple': return 'border-purple-500/50 shadow-purple-900/20';
        default: return 'border-white/10';
    }
  };

  const getButtonColor = (color) => {
    switch (color) {
        case 'green': return 'bg-green-600 hover:bg-green-500';
        case 'red': return 'bg-red-600 hover:bg-red-500';
        case 'amber': return 'bg-amber-500 hover:bg-amber-400 text-black';
        case 'blue': return 'bg-blue-600 hover:bg-blue-500';
        case 'purple': return 'bg-purple-600 hover:bg-purple-500';
        default: return 'bg-white text-black';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 font-sans selection:bg-amber-500/30">
      
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Choose Your <span className="text-amber-500">Power</span></h1>
        <p className="text-gray-400">Unlock unlimited knowledge or automate your business.</p>
        
        {/* TOGGLE SWITCH */}
        <div className="flex justify-center mt-8">
            <div className="bg-[#111] p-1 rounded-full border border-white/10 flex relative">
                <div 
                    className={`absolute top-1 bottom-1 w-[140px] bg-white/10 rounded-full transition-all duration-300 ${activeTab === 'student' ? 'left-1' : 'left-[148px]'}`}
                ></div>
                <button 
                    onClick={() => setActiveTab('student')}
                    className={`relative z-10 px-8 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${activeTab === 'student' ? 'text-white' : 'text-gray-500'}`}
                >
                    <GraduationCap size={16}/> Students
                </button>
                <button 
                    onClick={() => setActiveTab('institute')}
                    className={`relative z-10 px-8 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${activeTab === 'institute' ? 'text-white' : 'text-gray-500'}`}
                >
                    <Building2 size={16}/> Institutes
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
            
            {/* STUDENT PLANS */}
            {activeTab === 'student' && (
                <motion.div 
                    key="students"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="grid md:grid-cols-3 gap-8"
                >
                    {studentPlans.map((plan) => (
                    <div key={plan.id} className={`bg-[#0A0A0A] border rounded-3xl p-8 flex flex-col transition duration-300 relative overflow-hidden group hover:scale-105 ${getColorClasses(plan.color)} shadow-2xl`}>
                        
                        {/* Popular Badge */}
                        {plan.popular && (
                            <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                Most Popular
                            </div>
                        )}

                        <div className="mb-4">
                            {plan.color === 'amber' ? <Crown className={`text-${plan.color}-500`} size={40}/> : <Zap className={`text-${plan.color}-500`} size={40}/>}
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-4xl font-black">{plan.price}</span>
                            <span className="text-sm text-gray-500">{plan.period}</span>
                        </div>

                        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-sm text-gray-300 italic">"{plan.desc_en}"</p>
                            <p className="text-sm text-gray-400 mt-1 font-sinhala">"{plan.desc_si}"</p>
                        </div>
                        
                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex gap-3 text-sm text-gray-300">
                                    <Check className={`text-${plan.color}-500 flex-shrink-0`} size={18}/> {feature}
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => {
                                // 🔥 Free එක නම් WhatsApp යයි, අනිත් ඒවා Checkout එකට යයි
                                if (plan.id === 'free') {
                                    window.open(plan.link, '_blank');
                                } else {
                                    // මෙතනදී අපි checkout page එකට plan එකේ විස්තරත් යවනවා, එතකොට ඒ page එකට ලේසියි අඳුරගන්න ළමයා මොකක්ද select කරේ කියලා
                                    navigate('/checkout', { state: { selectedPlan: plan.name, price: plan.price } });
                                }
                            }}
                            className={`w-full py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 ${getButtonColor(plan.color)}`}
                        >
                            Select Plan <ArrowRight size={18}/>
                        </button>
                    </div>
                    ))}
                </motion.div>
            )}

            {/* INSTITUTE PLANS */}
            {activeTab === 'institute' && (
                <motion.div 
                    key="institutes"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="grid md:grid-cols-2 gap-8 justify-center max-w-4xl mx-auto"
                >
                    {institutePlans.map((plan) => (
                        <div key={plan.id} className={`bg-[#0A0A0A] border rounded-3xl p-8 flex flex-col transition duration-300 relative overflow-hidden group hover:scale-105 ${getColorClasses(plan.color)} shadow-2xl`}>
                            
                            <div className="mb-4">
                                <Building2 className={`text-${plan.color}-500`} size={40}/>
                            </div>
                            
                            <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-black">{plan.price}</span>
                                <span className="text-sm text-gray-500">/ {plan.type}</span>
                            </div>

                             <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-sm text-gray-300 italic">"{plan.desc_en}"</p>
                                <p className="text-sm text-gray-400 mt-1 font-sinhala">"{plan.desc_si}"</p>
                            </div>
                            
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-300">
                                        <Check className={`text-${plan.color}-500 flex-shrink-0`} size={18}/> {feature}
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => window.open(plan.link, '_blank')}
                                className={`w-full py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 ${getButtonColor(plan.color)}`}
                            >
                                Contact Sales <ArrowRight size={18}/>
                            </button>
                        </div>
                    ))}
                </motion.div>
            )}

        </AnimatePresence>
      </div>
    </div>
  );
}
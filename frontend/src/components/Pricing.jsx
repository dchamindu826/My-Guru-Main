import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, Building2, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Pricing() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState('student');

  const studentPlans = [
    {
      id: 'free',
      name: 'Starter Plan',
      price: 'Free',
      period: 'Forever',
      color: 'green',
      desc_en: 'Perfect for trying out MyGuru.',
      desc_si: 'MyGuru අත්හදා බැලීමට සුදුසුයි.',
      features: ['3 Questions/Day', 'Basic AI Help', 'Limited Access'],
      btnText: 'Start Learning',
      action: 'chat'
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
      features: ['100 Questions/Day', 'Faster AI Responses', 'Access Past Papers'],
      btnText: 'Get Started',
      action: 'checkout'
    },
    {
      id: 'genius',
      name: 'Genius Plan',
      price: 'Rs. 4500',
      period: '/month',
      color: 'amber',
      desc_en: 'Unlimited access to everything.',
      desc_si: 'සීමාවකින් තොරව සියල්ල ලබාගන්න.',
      features: ['Unlimited Questions', 'WhatsApp Bot Access', 'Personalized Plan'],
      btnText: 'Go Unlimited',
      action: 'checkout'
    }
  ];

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
      btnText: 'Contact Sales',
      action: 'whatsapp'
    },
    {
      id: 'inst-pro',
      name: 'Institute Pro',
      price: 'Custom',
      type: 'Monthly',
      color: 'purple',
      desc_en: 'Full AI suite for large institutes.',
      desc_si: 'විශාල ආයතන සඳහා සම්පූර්ණ AI විසඳුම.',
      features: ['Advanced RAG Bot', 'Auto Slip Verification', 'Full Database Sync'],
      btnText: 'Contact Sales',
      action: 'whatsapp'
    }
  ];

  const handlePlanClick = async (plan) => {
    if (plan.action === 'whatsapp') {
      window.open(`https://wa.me/94701234567?text=I am interested in ${plan.name}`, '_blank');
      return;
    }

    if (!user) {
      try {
        await signInWithGoogle();
        return;
      } catch (error) { return; }
    }

    if (plan.action === 'chat') {
      navigate('/chat');
    } else {
      navigate('/checkout', { state: { planName: plan.name, price: plan.price } });
    }
  };

  return (
    <section className="py-24 bg-[#050505]" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Simple <span className="text-amber-500">Pricing</span></h2>
          <div className="flex justify-center mt-8">
            <div className="bg-[#111] p-1 rounded-full border border-white/10 flex relative">
                <div className={`absolute top-1 bottom-1 w-[140px] bg-white/10 rounded-full transition-all duration-300 ${activeTab === 'student' ? 'left-1' : 'left-[148px]'}`}></div>
                <button onClick={() => setActiveTab('student')} className={`relative z-10 px-8 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${activeTab === 'student' ? 'text-white' : 'text-gray-500'}`}>
                    <GraduationCap size={16}/> Students
                </button>
                <button onClick={() => setActiveTab('institute')} className={`relative z-10 px-8 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${activeTab === 'institute' ? 'text-white' : 'text-gray-500'}`}>
                    <Building2 size={16}/> Institutes
                </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {(activeTab === 'student' ? studentPlans : institutePlans).map((plan) => (
            <div key={plan.id} className={`bg-[#0A0A0A] border rounded-3xl p-8 flex flex-col transition hover:scale-[1.02] border-${plan.color}-500/30 shadow-2xl`}>
              <div className="mb-4">
                {plan.color === 'amber' ? <Crown className="text-amber-500" size={32}/> : <Zap className={`text-${plan.color}-500`} size={32}/>}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-4xl font-black text-white mb-4">{plan.price} <span className="text-sm text-gray-500 font-normal">{plan.period || `/ ${plan.type}`}</span></div>
              <p className="text-xs text-gray-400 mb-6 italic leading-relaxed">"{plan.desc_en}"<br/>"{plan.desc_si}"</p>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <Check className={`text-${plan.color}-500`} size={18}/> {feat}
                  </li>
                ))}
              </ul>
              <button onClick={() => handlePlanClick(plan)} className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 
                ${plan.color === 'amber' ? 'bg-amber-500 text-black' : `bg-${plan.color}-600 text-white`}`}>
                {plan.btnText} <ArrowRight size={18}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
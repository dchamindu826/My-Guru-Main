import React from 'react';
import { Brain, Clock, Shield, Zap, BookOpen, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      icon: <Brain className="text-amber-500" size={32} />,
      title: "AI-Powered Answers",
      desc: "Get instant, accurate answers to your questions using Gemini 1.5 technology."
    },
    {
      icon: <Clock className="text-blue-500" size={32} />,
      title: "24/7 Availability",
      desc: "Your personal tutor never sleeps. Study whenever you want, day or night."
    },
    {
      icon: <BookOpen className="text-green-500" size={32} />,
      title: "Exam Focused",
      desc: "Specialized content for A/L and O/L students to help you ace your exams."
    },
    {
      icon: <Shield className="text-purple-500" size={32} />,
      title: "Secure & Private",
      desc: "Your data is encrypted and safe. We prioritize your privacy above all."
    },
    {
      icon: <Zap className="text-yellow-400" size={32} />,
      title: "Instant Feedback",
      desc: "Upload your answers and get immediate corrections and suggestions."
    },
    {
      icon: <Users className="text-red-500" size={32} />,
      title: "Community Growth",
      desc: "Join thousands of students improving their grades with MyGuru."
    }
  ];

  return (
    <section className="py-24 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
            Why Choose <span className="text-amber-500">MyGuru?</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Experience the future of education with tools designed to make learning faster, easier, and more effective.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="bg-[#111] border border-white/5 p-8 rounded-2xl hover:border-amber-500/20 transition-colors"
            >
              <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
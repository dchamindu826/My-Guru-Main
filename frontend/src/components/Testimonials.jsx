import React, { useEffect, useState } from 'react';
import { api } from "../lib/api";
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Backend එකෙන් Feedbacks අදිනවා
    api.get('/testimonials')
      .then(res => setReviews(res.data))
      .catch(err => console.error("Error fetching testimonials:", err));
  }, []);

  if(reviews.length === 0) return null;

  return (
    <section className="py-24 bg-[#050505] overflow-hidden">
      <div className="text-center mb-16 px-6">
        <h2 className="text-4xl font-black text-white">Loved by Students</h2>
        <p className="text-gray-400 mt-2">Don't just take our word for it.</p>
      </div>

      {/* Marquee Effect Container */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-[#050505] to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-[#050505] to-transparent z-10"></div>

        <motion.div 
            className="flex gap-6 w-max"
            animate={{ x: ["0%", "-50%"] }} // Infinite Scroll Logic
            transition={{ repeat: Infinity, ease: "linear", duration: 20 }} // Adjust speed here
        >
            {/* Duplicate list to create seamless loop */}
            {[...reviews, ...reviews].map((review, index) => (
                <div key={index} className="w-[350px] bg-[#111] border border-white/5 p-8 rounded-2xl relative flex-shrink-0">
                    <Quote className="absolute top-6 right-6 text-white/5" size={40}/>
                    <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < review.rating ? "text-amber-500 fill-amber-500" : "text-gray-800"} />
                        ))}
                    </div>
                    <p className="text-gray-300 text-lg mb-6 leading-relaxed">"{review.message}"</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-white text-sm">
                            {/* 🔥 FIX: නම නැත්නම් 'U' අකුර ගන්නවා */}
                            {(review.student_name || "User").charAt(0)}
                        </div>
                        <div>
                            {/* 🔥 FIX: නම නැත්නම් 'Student' කියලා පෙන්නනවා */}
                            <h4 className="font-bold text-white text-sm">{review.student_name || "Student"}</h4>
                            <span className="text-xs text-amber-500 font-bold uppercase">{review.role}</span>
                        </div>
                    </div>
                </div>
            ))}
        </motion.div>
      </div>
    </section>
  );
}
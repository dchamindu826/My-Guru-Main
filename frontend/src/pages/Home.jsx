import React from 'react';
import Hero from '../components/Hero';
import ChatDemo from '../components/ChatDemo';
import ServicesHighlight from '../components/ServicesHighlight';
import Features from '../components/Features';
import ApiSection from '../components/ApiSection';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
// import SupportWidget... <-- Meka AIN KARANNA (Already in App.jsx)

export default function Home() {
  return (
    <>
      <Hero />
      <ChatDemo />
      <Pricing />
      <Features />
      <Testimonials />
    </>
  );
}
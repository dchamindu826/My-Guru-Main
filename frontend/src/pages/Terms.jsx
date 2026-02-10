import React from 'react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black mb-2 text-amber-500">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm mb-12">Effective Date: February 9, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p>By accessing and using My Guru AI, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">2. Educational Use Only</h2>
                <p>My Guru AI is an educational tool. While we strive for accuracy, AI responses may occasionally be incorrect. Students should always verify information with their official textbooks and teachers.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">3. Subscriptions & Refunds</h2>
                <p>Payments for premium plans are non-refundable once the plan is activated. Account sharing is strictly prohibited and may result in account termination.</p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Code of Conduct</h2>
                <p>Users must not use the chat service to generate harmful, illegal, or inappropriate content. We reserve the right to ban users who violate this policy.</p>
            </section>
        </div>
      </div>
    </div>
  );
}
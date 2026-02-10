import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black mb-2 text-amber-500">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-12">Last Updated: February 9, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
                <p>We collect minimal information to provide our service. This includes:</p>
                <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-400">
                    <li>Account Information: Name, Email address, and Profile picture (via Google Login).</li>
                    <li>Usage Data: Chat history (to provide context for answers) and payment records.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">2. How We Use Your Data</h2>
                <p>Your data is used solely for:</p>
                <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-400">
                    <li>Providing AI-generated answers to your questions.</li>
                    <li>Processing subscription payments and verifying bank slips.</li>
                    <li>Improving the accuracy of our AI model.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">3. Data Security</h2>
                <p>We use industry-standard encryption to protect your data. We do not sell your personal information to third parties. All bank slip images are stored securely and accessed only for verification.</p>
            </section>
        </div>
      </div>
    </div>
  );
}
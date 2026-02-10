import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  useEffect(() => {
    api.get('/admin/feedbacks').then(res => setFeedbacks(res.data));
  }, []);

  return (
    <div className="text-white">
        <h1 className="text-3xl font-black mb-8">User Feedbacks</h1>
        <div className="grid gap-4">
            {feedbacks.map(f => (
                <div key={f.id} className="bg-[#111] p-4 rounded-xl border border-white/10">
                    <p className="text-gray-300">"{f.message}"</p>
                    <p className="text-xs text-amber-500 mt-2">- {f.student_name}</p>
                </div>
            ))}
            {feedbacks.length === 0 && <p className="text-gray-500">No feedbacks yet.</p>}
        </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(res.data));
  }, []);

  return (
    <div className="text-white">
        <h1 className="text-3xl font-black mb-8">Registered Students</h1>
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            {users.map(u => (
                <div key={u.id} className="flex justify-between border-b border-white/5 py-3">
                    <div>
                        <div className="font-bold">{u.email}</div>
                        <div className="text-xs text-gray-500">{u.full_name || 'No Name'}</div>
                    </div>
                    <div className="text-sm text-amber-500">{u.plan_type}</div>
                </div>
            ))}
        </div>
    </div>
  );
}
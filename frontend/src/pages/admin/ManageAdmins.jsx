import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Shield, Trash2, Plus, User, Key } from 'lucide-react';

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'Editor', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
        const res = await api.get('/admin/users');
        if(res.data) setAdmins(res.data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if(!newAdmin.password) return alert("Password Required");
    
    setLoading(true);
    try {
        await api.post('/admin/create-admin', newAdmin);
        alert("Admin Added Successfully!");
        setNewAdmin({ name: '', email: '', role: 'Editor', password: '' }); // Reset form
        fetchAdmins(); // Refresh List
    } catch (err) {
        alert("Failed to add admin: " + (err.response?.data?.error || err.message));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
        <Shield className="text-amber-500"/> Manage Admins
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* ADD NEW ADMIN FORM */}
        <div className="bg-[#111] p-6 rounded-3xl border border-white/10 h-fit">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Plus size={18} className="text-green-500"/> Add New Admin
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Full Name</label>
                    <input type="text" className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-amber-500"
                        value={newAdmin.name}
                        onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} required/>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Email Address</label>
                    <input type="email" className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none focus:border-amber-500"
                        value={newAdmin.email}
                        onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} required/>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Password</label>
                    <div className="relative">
                        <Key size={16} className="absolute left-3 top-3.5 text-gray-500"/>
                        <input type="password" className="w-full bg-black border border-white/10 rounded-lg p-3 pl-10 text-white outline-none focus:border-amber-500"
                            value={newAdmin.password}
                            onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} required/>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">Role</label>
                    <select className="w-full bg-black border border-white/10 rounded-lg p-3 text-white outline-none"
                        value={newAdmin.role}
                        onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}>
                        <option>Super Admin</option>
                        <option>Editor</option>
                        <option>Viewer</option>
                    </select>
                </div>
                <button disabled={loading} className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 transition disabled:opacity-50">
                    {loading ? "Creating..." : "Create Account"}
                </button>
            </form>
        </div>

        {/* ADMIN LIST */}
        <div className="lg:col-span-2">
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Created At</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {admins.length > 0 ? admins.map((admin) => (
                            <tr key={admin.id} className="hover:bg-white/5 transition">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                        <User size={16} className="text-gray-400"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">{admin.full_name || 'Admin'}</p>
                                        <p className="text-xs text-gray-500">{admin.email}</p>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-300">{admin.role}</td>
                                <td className="p-4 text-xs text-gray-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                    <button className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition" title="Delete (Logic pending)">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-500">No admins found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
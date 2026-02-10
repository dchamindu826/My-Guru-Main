import React from 'react';
// IMPORT FIXED: Shield, Database added. Users removed.
import { LayoutDashboard, CreditCard, MessageSquare, LogOut, Star, FileText, Shield, Database } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth(); 

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
    
    // Students removed as requested
    // { name: 'Students', path: '/admin/users', icon: <Users size={20} /> }, 

    { name: 'Admins', path: '/admin/admins', icon: <Shield size={20} /> }, // Now works
    { name: 'Knowledge Base', path: '/admin/knowledge', icon: <Database size={20} /> }, // Now works
    { name: 'Student Feedback', path: '/admin/student-feedback', icon: <MessageSquare size={20} /> },
    { name: 'Site Testimonials', path: '/admin/testimonials', icon: <Star size={20} /> },
    { name: 'RAG Ingestion', path: '/admin/ingest', icon: <FileText size={20} /> },
  ];

  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-white/5 p-6 hidden md:flex flex-col h-screen fixed left-0 top-0">
      
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-10">
         <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-xl">G</div>
         <span className="font-bold text-xl text-white tracking-tight">Admin Pro</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 w-full p-3 rounded-xl font-bold transition ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition font-bold mt-auto"
      >
        <LogOut size={20} /> Logout
      </button>
    </div>
  );
}
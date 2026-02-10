import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, History, Clock, CheckCircle, XCircle, Loader, MessageCircle, Zap, Star, Crown } from 'lucide-react';

// Package details helper
const getPackageDetails = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('genius')) return { icon: <Crown size={18} className="text-amber-500"/>, credits: 'Unlimited', features: ['All Subjects', 'Teacher Support'], color: 'text-amber-500' };
    if (n.includes('scholar')) return { icon: <Star size={18} className="text-blue-400"/>, credits: '100/Day', features: ['All Subjects', 'Priority Support'], color: 'text-blue-400' };
    return { icon: <Zap size={18} className="text-gray-400"/>, credits: '3/Day', features: ['Basic Access'], color: 'text-gray-400' };
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ credits: 3, plan: 'Free Plan' }); 

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // FIX: Use uid consistently
        const userId = user.uid || user.id; 
        
        // 1. Get Payment History
        const resOrders = await api.get(`/payments/user/${userId}`);
        setOrders(resOrders.data);

        // 2. Calculate Current Plan based on approved orders
        // Sort by date (newest first) to get latest plan
        const sortedOrders = resOrders.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const approvedOrder = sortedOrders.find(o => o.status === 'approved');
        
        if(approvedOrder) {
            setUserStats({ 
                plan: approvedOrder.package_name, 
                credits: getPackageDetails(approvedOrder.package_name).credits 
            });
        }
      } catch (error) {
        console.error("Profile Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Helper to render Profile Image
  const renderProfileImage = () => {
      if (user?.photoURL) {
          return (
              <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full border-4 border-[#111] shadow-xl object-cover"
              />
          );
      }
      return (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-black font-black text-3xl shadow-lg border-4 border-[#111]">
              {user?.email?.charAt(0).toUpperCase()}
          </div>
      );
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-amber-500"><Loader className="animate-spin" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      
      {/* FIX: Added `pt-28` (Padding Top) and `pb-10` to clear the fixed Navbar. 
          Also added a container with max-width to center content.
      */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-10 space-y-8">
        
        {/* TOP CARD: USER INFO */}
        <div className="bg-gradient-to-r from-[#111] to-[#151515] p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition duration-700"></div>
            
            <div className="flex flex-col md:flex-row items-center gap-6 z-10 text-center md:text-left">
                {renderProfileImage()}
                
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                        {user?.displayName || 'Student'}
                        {userStats.plan !== 'Free Plan' && (
                            <span className="bg-amber-500 text-black text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">PRO</span>
                        )}
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">{user?.email}</p>
                    
                    <div className={`mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wide ${
                        userStats.plan.toLowerCase().includes('genius') ? 'text-amber-500 border-amber-500/30' : 
                        userStats.plan.toLowerCase().includes('scholar') ? 'text-blue-400 border-blue-400/30' : 'text-gray-400'
                    }`}>
                        {userStats.plan.toLowerCase().includes('genius') && <Crown size={14} fill="currentColor"/>}
                        {userStats.plan.toLowerCase().includes('scholar') && <Star size={14} fill="currentColor"/>}
                        {userStats.plan}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 z-10 w-full md:w-auto">
                <button onClick={handleLogout} className="w-full md:w-auto py-3 px-6 rounded-xl bg-[#222] hover:bg-[#333] border border-white/5 hover:border-white/20 text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg">
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#111] p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-amber-500/20 transition group">
                <div className="flex justify-between items-start">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Available Credits</p>
                    <Zap className="text-amber-500 group-hover:scale-110 transition" size={20} fill="currentColor"/>
                </div>
                <p className="text-4xl font-black text-white mt-2">{userStats.credits}</p>
            </div>

            <div className="bg-[#111] p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-blue-500/20 transition group">
                <div className="flex justify-between items-start">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Orders</p>
                    <History className="text-blue-500 group-hover:scale-110 transition" size={20}/>
                </div>
                <p className="text-4xl font-black text-white mt-2">{orders.length}</p>
            </div>

            <div className="bg-gradient-to-br from-green-900/20 to-black p-6 rounded-2xl border border-green-500/20 flex flex-col justify-center items-start relative overflow-hidden">
                <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-green-500/20 blur-2xl rounded-full"></div>
                <p className="text-green-500 text-xs font-bold uppercase mb-3 relative z-10">Need Assistance?</p>
                <a 
                    href="https://wa.me/94701234567?text=Hello MyGuru Admin, I have an issue with my account." 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-green-900/20 relative z-10"
                >
                    <MessageCircle size={18} /> Chat on WhatsApp
                </a>
            </div>
        </div>

        {/* ORDER HISTORY */}
        <div>
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-white/90">
                <History className="text-amber-500"/> Payment History
            </h2>
            
            <div className="space-y-4">
                {orders.length > 0 ? orders.map((order) => {
                    const details = getPackageDetails(order.package_name);
                    return (
                        <div key={order.id || order._id} className="bg-[#111] border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-white/20 transition group">
                            
                            {/* Left: Info */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#1a1a1a] border border-white/5 group-hover:scale-105 transition`}>
                                    {details.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{order.package_name}</h3>
                                    <p className="text-gray-500 text-xs font-mono mt-0.5">{new Date(order.created_at).toLocaleDateString()} • Rs. {order.amount}</p>
                                </div>
                            </div>

                            {/* Middle: Features (Only if approved) */}
                            {order.status === 'approved' && (
                                <div className="hidden md:flex gap-2">
                                    {details.features.map((f, i) => (
                                        <span key={i} className="text-[10px] bg-white/5 px-2.5 py-1 rounded-md border border-white/10 text-gray-400">{f}</span>
                                    ))}
                                </div>
                            )}

                            {/* Right: Status */}
                            <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-4">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 border
                                    ${order.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                      order.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                    {order.status === 'approved' && <CheckCircle size={14}/>}
                                    {order.status === 'rejected' && <XCircle size={14}/>}
                                    {order.status === 'pending' && <Clock size={14}/>}
                                    {order.status}
                                </span>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-16 text-center bg-[#111] rounded-3xl border border-white/5 border-dashed">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                            <Clock size={32}/>
                        </div>
                        <p className="text-gray-500 font-medium">No payment history found.</p>
                        <button onClick={() => navigate('/plans')} className="mt-4 text-amber-500 text-sm font-bold hover:underline">
                            View Plans & Pricing
                        </button>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
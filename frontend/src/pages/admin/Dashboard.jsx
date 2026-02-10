import React, { useEffect, useState } from 'react';
import { 
  Users, DollarSign, MessageSquare, 
  TrendingUp, AlertCircle, Code, Star, Loader 
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';

const COLORS = ['#3b82f6', '#fbbf24', '#10b981', '#f97316'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]); // <-- New State
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Monthly');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Stats
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data);

        // 2. Fetch Recent Feedbacks (Limit 5)
        const fbRes = await api.get('/feedbacks?page=1'); // Backend pagination handles limit
        // Assuming backend returns { data: [...] }
        setRecentFeedbacks(fbRes.data.data ? fbRes.data.data.slice(0, 5) : []); 

      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader className="animate-spin text-amber-500" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-8 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-400 text-sm">Real-time Data from Supabase</p>
        </div>
        
        <div className="flex bg-[#111] p-1 rounded-lg border border-white/10">
          {['Daily', 'Weekly', 'Monthly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition ${
                timeRange === range ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Revenue" value={`Rs. ${stats?.totalRevenue.toLocaleString()}`} icon={<DollarSign />} color="text-green-400" sub="Verified Payments" />
        <StatCard title="Active Students" value={stats?.studentCount} icon={<Users />} color="text-blue-400" sub="Registered Profiles" />
        <StatCard title="API Usage" value="0 Req" icon={<Code />} color="text-purple-400" sub="Coming Soon" />
        <StatCard title="Pending Approvals" value={stats?.pendingCount} icon={<AlertCircle />} color="text-amber-500" sub="Action Required" />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        
        {/* MAIN SALES CHART */}
        <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-500"/> Revenue Analysis
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []}>
                <defs>
                  <linearGradient id="colorStudent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#555" tick={{fill: '#888', fontSize: 12}} />
                <YAxis stroke="#555" tick={{fill: '#888', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <Area type="monotone" dataKey="student" stroke="#fbbf24" fillOpacity={1} fill="url(#colorStudent)" name="Student Plans" />
                <Area type="monotone" dataKey="api" stroke="#3b82f6" fillOpacity={1} fill="url(#colorApi)" name="API Sales" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-6">User Distribution</h3>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.userDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.userDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                   itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-3xl font-black text-white">{stats?.studentCount}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 text-xs text-gray-400 mt-4">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Free</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Scholar</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Genius</div>
          </div>
        </div>

      </div>

      {/* FEEDBACKS & RECENT ACTIVITY */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* REAL FEEDBACKS PANEL */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><MessageSquare size={18} className="text-blue-400"/> Recent Feedbacks</h3>
            </div>
            <div className="space-y-4">
                {recentFeedbacks.length > 0 ? recentFeedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-xs">
                            {fb.user_email ? fb.user_email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div className="flex justify-between items-start w-full">
                                <h4 className="font-bold text-sm text-gray-200">{fb.user_email}</h4>
                                <span className="text-[10px] text-gray-500">{new Date(fb.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{fb.message}</p>
                            <div className="flex gap-1 mt-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${fb.type === 'Bot Issue' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                    {fb.type}
                                </span>
                                {fb.type === 'Appreciation' && (
                                    <div className="flex gap-0.5 ml-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} className={i < fb.rating ? "text-yellow-500" : "text-gray-700"} fill="currentColor" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-gray-500 text-center py-4">No feedbacks received yet.</p>
                )}
            </div>
        </div>

        {/* API Sales Overview */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
             <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Code size={18} className="text-purple-400"/> API Sales Overview</h3>
             <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                    <div>
                        <p className="text-xs text-purple-400 font-bold uppercase">This Month</p>
                        <p className="text-2xl font-black text-white">Rs. 0</p>
                    </div>
                    <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center text-black font-bold">
                        <DollarSign size={20} />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-bold uppercase">Top Clients</p>
                    <p className="text-sm text-gray-500 italic">No API clients yet.</p>
                </div>

                <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition text-sm">
                    Manage API Keys
                </button>
             </div>
        </div>

      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color, sub }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-lg">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-white/5 ${color} border border-white/5`}>{icon}</div>
    </div>
    <p className="text-[10px] text-gray-500">{sub}</p>
  </motion.div>
);
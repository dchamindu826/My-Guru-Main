import React, { useEffect, useState } from 'react';
import { 
  Users, DollarSign, MessageSquare, 
  TrendingUp, AlertCircle, Code, Star, Loader, Database, DownloadCloud, RefreshCw
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
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [tokenStats, setTokenStats] = useState({ totalTokens: 0, totalCost: 0 }); 
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Monthly');

  // Backup States
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);

  // Fetch Node Backend Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data);

        const fbRes = await api.get('/feedbacks?page=1'); 
        setRecentFeedbacks(fbRes.data.data ? fbRes.data.data.slice(0, 5) : []); 

      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch Token Stats from Python AI Backend based on filter
  useEffect(() => {
    const fetchTokenStats = async () => {
      try {
        const tokenRes = await api.get(`/admin/token-stats?filter=${timeRange}`);
        if (tokenRes.data && tokenRes.data.summary) {
            setTokenStats(tokenRes.data.summary);
        }
      } catch (error) {
        console.error("Token Stats Error:", error);
      }
    };
    fetchTokenStats();
  }, [timeRange]);

  // Handle Manual Backup Creation
  const handleCreateBackup = async () => {
    if(!window.confirm("Are you sure you want to generate a new backup? Oldest backups will be deleted.")) return;
    
    setIsCreatingBackup(true);
    try {
        const res = await api.post('/admin/create-backup');
        if(res.data.success) {
            alert(res.data.message);
        } else {
            alert("Backup creation failed.");
        }
    } catch (error) {
        console.error(error);
        alert("Server error while creating backup.");
    }
    setIsCreatingBackup(false);
  };

  // Handle Backup Download
  const handleDownloadBackup = async () => {
    setIsDownloadingBackup(true);
    try {
        const res = await api.get('/admin/latest-backup');
        if(res.data.success && res.data.downloadUrl) {
            // ෆයිල් එක fetch කරලා blob එකක් විදිහට ගන්නවා (බලහත්කාරයෙන් Download වෙන්න)
            const response = await fetch(res.data.downloadUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = res.data.fileName || 'Database_Backup.json';
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Memory එක clear කරනවා
            window.URL.revokeObjectURL(blobUrl);
        } else {
            alert("No backup found! Please create a backup first.");
        }
    } catch (error) {
        console.error(error);
        alert("Failed to download backup.");
    }
    setIsDownloadingBackup(false);
  };


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
        <StatCard title="API Tokens" value={tokenStats.totalTokens.toLocaleString()} icon={<Code />} color="text-purple-400" sub={`${timeRange} Usage`} />
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

      {/* BOTTOM SECTION */}
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

        {/* GEMINI USAGE & DATABASE BACKUP */}
        <div className="space-y-8">
            {/* Gemini API Usage */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Code size={18} className="text-purple-400"/> API Usage & Cost</h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                        <div>
                            <p className="text-xs text-purple-400 font-bold uppercase">{timeRange} Cost</p>
                            <p className="text-2xl font-black text-white">${tokenStats.totalCost.toFixed(4)}</p>
                        </div>
                        <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center text-black font-bold">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-bold uppercase">Tokens Used ({timeRange})</p>
                        <p className="text-sm text-gray-300 font-bold">{tokenStats.totalTokens.toLocaleString()} Tokens</p>
                    </div>
                </div>
            </div>

            {/* Database Backup Manager */}
            <div className="bg-[#111] border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>

                <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Database size={18} className="text-amber-500"/> System Backup</h3>
                <p className="text-xs text-gray-400 mb-6">Create manual backups or download the latest system database snapshot.</p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={handleCreateBackup}
                        disabled={isCreatingBackup}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold rounded-xl transition text-sm disabled:opacity-50"
                    >
                        {isCreatingBackup ? <RefreshCw className="animate-spin" size={16}/> : <Database size={16}/>}
                        {isCreatingBackup ? 'Creating...' : 'Create Backup'}
                    </button>
                    
                    <button 
                        onClick={handleDownloadBackup}
                        disabled={isDownloadingBackup}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition text-sm disabled:opacity-50"
                    >
                        {isDownloadingBackup ? <Loader className="animate-spin" size={16}/> : <DownloadCloud size={16}/>}
                        {isDownloadingBackup ? 'Fetching...' : 'Download Latest'}
                    </button>
                </div>
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
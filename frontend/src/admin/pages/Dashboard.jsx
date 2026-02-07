import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Users, DollarSign, FileText, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center shadow-lg">
    <div className={`p-4 rounded-full ${color} bg-opacity-20 mr-4`}>
      <Icon size={24} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock Data for Chart (Real API එකෙන් එනකම්)
  const chartData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 5000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 6390 },
    { name: 'Sun', sales: 3490 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats'); // Backend එකෙන් දත්ත ගන්නවා
        setStats(res.data);
      } catch (error) {
        console.error("Stats Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-white p-10">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`Rs. ${stats?.total_revenue || 0}`} icon={DollarSign} color="text-green-400" />
        <StatCard title="Active Students" value={stats?.active_students || 0} icon={Users} color="text-blue-400" />
        <StatCard title="Pending Slips" value={stats?.pending_slips || 0} icon={FileText} color="text-yellow-400" />
        <StatCard title="Online Now" value={stats?.online_users || 0} icon={Activity} color="text-red-400" />
      </div>

      {/* Charts Section */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mt-8">
        <h3 className="text-xl font-bold text-white mb-6">Weekly Revenue</h3>
        <div className="h-80 w-full">
            
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
              <Line type="monotone" dataKey="sales" stroke="#06B6D4" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
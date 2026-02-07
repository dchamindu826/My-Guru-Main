import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; // Path eka hariyata balanna
import { Lock } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        await supabase.auth.signOut();
        setError("Admin Access Denied.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
            <Lock size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-6">Admin Portal</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Login Access'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
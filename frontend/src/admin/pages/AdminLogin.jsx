import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("1. Login Button Clicked"); // Debug Log
    setLoading(true);
    setError(null);

    try {
      // 1. Auth Check
      console.log("2. Attempting Supabase Auth...", email);
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Auth Error:", authError);
        throw authError;
      }
      console.log("3. Auth Success! User ID:", user?.id);

      // 2. Profile Check
      console.log("4. Checking Profiles Table...");
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*') // 'role' වෙනුවට '*' දැම්මා RLS බලන්න
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Profile Fetch Error:", profileError);
        // Error එක ආවට අපි බලමු ඩේටා මොනවා හරි ආවද කියලා
      }

      console.log("5. Profile Data Received:", profile);

      if (profile?.role === 'admin') {
        console.log("6. Admin Confirmed. Navigating...");
        navigate('/admin/dashboard');
      } else {
        console.warn("7. Not an Admin. Role is:", profile?.role);
        await supabase.auth.signOut();
        setError(`Access Denied. Your role is: ${profile?.role || 'None'}`);
      }

    } catch (err) {
      console.error("CRITICAL ERROR:", err);
      setError(err.message || "Unknown Error");
    } finally {
      console.log("8. Process Finished. Stopping Loading.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400"><Lock size={32} /></div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-6">Admin Debug Login</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-700 text-white p-2 rounded" required
          />
          <input
            type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-700 text-white p-2 rounded" required
          />
          <button type="submit" disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">
            {loading ? 'Checking... (Look at Console)' : 'Login Access'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
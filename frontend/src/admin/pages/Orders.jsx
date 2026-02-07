import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Check, X, Eye, Loader } from 'lucide-react';

const Orders = () => {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = async () => {
    try {
      const res = await api.get('/pending-slips');
      setSlips(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, userId, action, packageName) => {
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    setProcessing(id);
    
    try {
      await api.post('/process-slip', {
        payment_id: id,
        user_id: userId,
        action: action,
        package_name: packageName // Backend එකට යවනවා User Upgrade කරන්න
      });
      
      // ලිස්ට් එකෙන් අයින් කරන්න
      setSlips(slips.filter(slip => slip.id !== id));
      alert(`Successfully ${action}ed!`);
    } catch (error) {
      alert("Error processing slip");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="text-white">Loading Slips...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Pending Slip Verifications</h2>
      
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
            <tr>
              <th className="p-4">Student Name</th>
              <th className="p-4">Package</th>
              <th className="p-4">Slip</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {slips.length === 0 ? (
                <tr><td colSpan="4" className="p-4 text-center">No pending slips</td></tr>
            ) : (
                slips.map((slip) => (
                <tr key={slip.id} className="hover:bg-gray-750">
                    <td className="p-4 font-medium text-white">
                        {slip.profiles?.full_name || 'Unknown'} <br/>
                        <span className="text-xs text-gray-500">{slip.profiles?.email}</span>
                    </td>
                    <td className="p-4">
                        <span className="bg-blue-900 text-blue-300 py-1 px-2 rounded text-xs">
                             Package Request
                        </span>
                    </td>
                    <td className="p-4">
                        <a href={slip.slip_url} target="_blank" rel="noreferrer" className="flex items-center text-cyan-400 hover:underline">
                            <Eye size={16} className="mr-2" /> View Slip
                        </a>
                    </td>
                    <td className="p-4 flex space-x-2">
                        <button 
                            onClick={() => handleAction(slip.id, slip.user_id, 'approve', 'Genius')} // Package name eka dynamic ganna puluwan nam hodai
                            disabled={processing === slip.id}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition"
                        >
                            {processing === slip.id ? <Loader className="animate-spin" size={18}/> : <Check size={18} />}
                        </button>
                        <button 
                            onClick={() => handleAction(slip.id, slip.user_id, 'reject')}
                            disabled={processing === slip.id}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                        >
                            <X size={18} />
                        </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
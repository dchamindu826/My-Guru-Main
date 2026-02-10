import React, { useEffect, useState } from 'react';
import { Check, X, Eye, Search, Filter } from 'lucide-react';
import { api } from '../../lib/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null); // For Modal

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments'); // Make sure backend returns all payments
      setPayments(res.data);
    } catch (error) {
      console.error("Error fetching payments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    if(!window.confirm(`Are you sure you want to ${newStatus} this payment?`)) return;
    try {
      await api.put(`/payments/${id}`, { status: newStatus });
      fetchPayments(); // Refresh UI
    } catch (error) {
      alert("Update failed");
    }
  };

  return (
    <div className="text-white min-h-screen">
      <h1 className="text-3xl font-black mb-8">Manage Payments</h1>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
            <tr>
              <th className="p-4">User / WhatsApp</th>
              <th className="p-4">Package</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
              <th className="p-4">Slip</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {payments.map((pay) => (
              <tr key={pay.id} className="hover:bg-white/5 transition">
                <td className="p-4">
                  <div className="font-bold">{pay.user_email || "Unknown User"}</div>
                  <div className="text-xs text-gray-500">{pay.whatsapp_number}</div>
                </td>
                <td className="p-4 text-amber-500 font-bold">{pay.package_name}</td>
                <td className="p-4">Rs. {pay.amount}</td>
                <td className="p-4 text-gray-400">{new Date(pay.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <button 
                    onClick={() => setSelectedSlip(pay.slip_url)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded"
                  >
                    <Eye size={14} /> View Slip
                  </button>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    pay.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                    pay.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                    'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {pay.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {pay.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleStatusUpdate(pay.id, 'approved')} className="p-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30" title="Approve"><Check size={16}/></button>
                      <button onClick={() => handleStatusUpdate(pay.id, 'rejected')} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30" title="Reject"><X size={16}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <div className="p-8 text-center text-gray-500">No payments found.</div>}
      </div>

      {/* SLIP MODAL */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSlip(null)}>
          <img src={selectedSlip} alt="Slip" className="max-h-[90vh] max-w-full rounded-lg shadow-2xl border border-white/20" />
        </div>
      )}
    </div>
  );
}
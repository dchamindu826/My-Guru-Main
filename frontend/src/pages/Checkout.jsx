import React, { useState } from 'react';
import { Upload, CheckCircle, Copy, ShieldCheck, Lock, AlertTriangle, Building, User, Hash, MapPin } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase'; 
import { api } from '../lib/api'; 
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const planName = location.state?.planName || "Scholar Plan";
  const planPrice = location.state?.price || "Rs. 1500";

  const [file, setFile] = useState(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  const bankDetails = {
    name: "C. D. M. Perera",
    bank: "Commercial Bank",
    account: "8001234567",
    branch: "Colombo Fort"
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setMsg({ type: 'error', text: 'Please log in first.' });
    if (!file) return setMsg({ type: 'error', text: 'Please upload the slip.' });

    setLoading(true);
    try {
      const userId = user.uid || user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      
      const { error: upError } = await supabase.storage.from('slips').upload(fileName, file);
      if (upError) throw upError;

      const { data: { publicUrl } } = supabase.storage.from('slips').getPublicUrl(fileName);

      await api.post('/payments', {
        user_id: userId,
        user_email: user.email,
        amount: parseFloat(planPrice.replace('Rs. ', '').replace(',', '')),
        package_name: planName,
        slip_url: publicUrl,
        whatsapp_number: whatsapp,
        status: 'pending'
      });

      setMsg({ type: 'success', text: 'Payment submitted! AI is verifying your slip...' });
      setTimeout(() => navigate('/profile'), 2500);
    } catch (err) {
      setMsg({ type: 'error', text: 'Submission failed. Try again.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-12 px-6">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12">
        
        {/* LEFT: BANK DETAILS */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-black mb-2">Checkout</h1>
            <p className="text-gray-400">Transfer the amount and upload your slip below.</p>
          </div>

          <div className="bg-gradient-to-br from-[#111] to-[#080808] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Building size={120}/></div>
            <h2 className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-6">Official Bank Details</h2>
            
            <div className="space-y-5 relative z-10">
              {[
                { label: 'Account Name', value: bankDetails.name, icon: <User size={18}/>, id: 'name' },
                { label: 'Bank Name', value: bankDetails.bank, icon: <Building size={18}/>, id: 'bank' },
                { label: 'Account Number', value: bankDetails.account, icon: <Hash size={18}/>, id: 'acc' },
                { label: 'Branch', value: bankDetails.branch, icon: <MapPin size={18}/>, id: 'branch' },
              ].map((item) => (
                <div key={item.id} className="group bg-black/40 border border-white/5 p-4 rounded-2xl flex justify-between items-center hover:border-amber-500/30 transition">
                  <div className="flex gap-4">
                    <div className="text-gray-500 group-hover:text-amber-500 transition">{item.icon}</div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">{item.label}</p>
                      <p className="text-white font-bold">{item.value}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(item.value, item.id)}
                    className={`p-2 rounded-lg transition ${copiedField === item.id ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                  >
                    {copiedField === item.id ? <CheckCircle size={18}/> : <Copy size={18}/>}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-xl">!</div>
            <p className="text-sm text-amber-200/80 leading-relaxed">
              Please include your <b>Email</b> or <b>WhatsApp Number</b> as the reference in your bank app.
            </p>
          </div>
        </div>

        {/* RIGHT: UPLOAD FORM */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-3xl h-fit">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3"><Upload className="text-amber-500"/> Confirm Payment</h2>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Selected Plan</p>
              <p className="text-amber-500 font-black">{planName}</p>
            </div>
          </div>

          {msg && (
            <div className={`p-4 rounded-2xl mb-6 text-sm flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {msg.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">WhatsApp Number</label>
              <input 
                type="tel" placeholder="07X XXX XXXX" required 
                value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white focus:border-amber-500 outline-none transition shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Payment Receipt (Slip)</label>
              <div className="relative group">
                <input 
                  type="file" accept="image/*" required onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all bg-black/40 ${file ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 group-hover:border-amber-500/50'}`}>
                  {file ? <CheckCircle className="text-green-500 mx-auto mb-3" size={40}/> : <Upload className="text-gray-600 mx-auto mb-3" size={40}/>}
                  <p className="text-sm font-bold text-gray-300">{file ? file.name : "Drop your slip here or Browse"}</p>
                  <p className="text-[10px] text-gray-500 mt-2">Maximum file size: 5MB (PNG, JPG)</p>
                </div>
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full py-5 rounded-2xl font-black text-black bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-xl shadow-amber-500/20"
            >
              {loading ? "VERIFYING SLIP..." : "CONFIRM & UPGRADE NOW"}
            </button>
            <p className="text-center text-[10px] text-gray-600 flex items-center justify-center gap-2 uppercase tracking-widest">
              <ShieldCheck size={12}/> Secure 256-bit Encrypted Transaction
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
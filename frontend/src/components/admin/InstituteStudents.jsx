import React, { useState, useEffect } from 'react';
import { Upload, Users, DollarSign, Search, Trash2, Edit2, Check, X, Plus, Save, FileSpreadsheet, Loader } from 'lucide-react';
import * as XLSX from 'xlsx'; // අලුතින් එකතු කළා
import { api } from '../../lib/api';

export default function InstituteStudents() {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // නවතම Bulk Upload සහ Manual Entry State එක
    const [parsedStudents, setParsedStudents] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', whatsapp: '', planType: 'Monthly', startDate: '', endDate: '', price: ''
    });
    
    // පරණ Edit State එක
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState("");

    // Fetch Students on Load
    const fetchStudents = async () => {
        try {
            const res = await api.get('/institute/students');
            setStudents(res.data);
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    // 1. Manual Entry Submit
    const handleManualSubmit = (e) => {
        e.preventDefault();
        // Validation - Start Date must be before End Date
        if(new Date(formData.startDate) > new Date(formData.endDate)) {
            return alert("End Date must be after Start Date!");
        }

        setParsedStudents([{...formData}, ...parsedStudents]);
        // Form එක clear කරනවා
        setFormData({ name: '', email: '', whatsapp: '', planType: 'Monthly', startDate: '', endDate: '', price: '' });
    };

    // 2. Handle EXCEL File Selection & Parsing (කලින් තිබ්බ CSV එක වෙනුවට)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const excelData = XLSX.utils.sheet_to_json(worksheet);
            
            // Excel Format: Name, Email, WhatsApp, PlanType, StartDate, EndDate, Price
            const formattedData = excelData.map(row => ({
                name: row.Name || '',
                email: row.Email || '',
                whatsapp: row.WhatsApp || '',
                planType: row.PlanType || 'Monthly',
                startDate: row.StartDate || '',
                endDate: row.EndDate || '',
                price: row.Price || 0
            }));

            setParsedStudents([...formattedData, ...parsedStudents]);
            alert(`✅ Successfully loaded ${formattedData.length} records from Excel!`);
        };
        reader.readAsArrayBuffer(file);
        e.target.value = null; // Input එක රීසෙට් කරනවා
    };

    // 3. Submit Bulk Data (Database එකට යැවීම)
    const handleBulkUpload = async () => {
        if (parsedStudents.length === 0) return alert("No data to save!");
        setIsSaving(true);
        try {
            // නිවැරදි API Endpoint එකට (institute/bulk-add) Data Array එක යවනවා
            await api.post('/institute/bulk-add', {
                students: parsedStudents
            });
            alert("✅ Students added successfully!");
            setParsedStudents([]);
            fetchStudents(); // Refresh list
        } catch (error) {
            alert("❌ Error uploading students.");
            console.error(error);
        }
        setIsSaving(false);
    };

    // Delete Student
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this student?")) {
            try {
                await api.delete(`/institute/students/${id}`);
                fetchStudents();
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    // Update Date
    const handleUpdateDate = async (id) => {
        try {
            await api.put(`/institute/students/${id}`, { expiry_date: editDate });
            setEditingId(null);
            fetchStudents();
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    // Remove item from Pending List
    const handleRemoveFromPending = (indexToRemove) => {
        setParsedStudents(parsedStudents.filter((_, idx) => idx !== indexToRemove));
    };

    // Metrics Calculations
    const activeStudents = students.filter(s => new Date(s.expiry_date || s.end_date) > new Date());
    const totalRevenue = students.reduce((acc, curr) => acc + (Number(curr.amount) || Number(curr.price) || 0), 0);

    // Search Filter (දැනට තියෙන ළමයි ලිස්ට් එක)
    const filteredStudents = students.filter(s => 
        (s.student_name || s.name)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.user_email || s.email)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.whatsapp_number?.includes(searchTerm)
    );

    return (
        <div className="p-6 bg-[#050505] min-h-screen text-white font-sans">
            <h1 className="text-3xl font-black text-amber-500 mb-8">Institute Management</h1>

            {/* Top Dashboard Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#111] border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 bg-blue-500/10 text-blue-500 rounded-xl"><Users size={28} /></div>
                    <div>
                        <p className="text-gray-400 text-sm">Active Students</p>
                        <p className="text-2xl font-bold">{activeStudents.length}</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 bg-green-500/10 text-green-500 rounded-xl"><DollarSign size={28} /></div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Revenue Generated</p>
                        <p className="text-2xl font-bold text-green-400">Rs. {totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* ADD NEW STUDENTS SECTION (MANUAL & EXCEL) */}
            {/* ========================================================================= */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
                
                {/* MANUAL ENTRY FORM */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="text-green-400"/> Add Student Manually</h3>
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded-lg p-2 text-sm focus:border-amber-500 outline-none"/>
                            <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded-lg p-2 text-sm focus:border-amber-500 outline-none"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="WhatsApp Number" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded-lg p-2 text-sm focus:border-amber-500 outline-none"/>
                            <select value={formData.planType} onChange={e => setFormData({...formData, planType: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded-lg p-2 text-sm focus:border-amber-500 outline-none">
                                <option value="Monthly">Monthly Plan</option>
                                <option value="Full">Full Plan</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <input type="date" title="Start Date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded-lg p-2 text-sm text-gray-400 focus:border-amber-500 outline-none"/>
                            <input type="date" title="End Date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded-lg p-2 text-sm text-gray-400 focus:border-amber-500 outline-none"/>
                            <input type="number" placeholder="Price (Rs)" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded-lg p-2 text-sm focus:border-amber-500 outline-none"/>
                        </div>
                        <button type="submit" className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold py-2 rounded-lg transition text-sm flex justify-center items-center gap-2">
                            Add to Pending List
                        </button>
                    </form>
                </div>

                {/* BULK UPLOAD (EXCEL) */}
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><FileSpreadsheet className="text-blue-400"/> Bulk Import Students</h3>
                    <p className="text-xs text-gray-400 mb-6">Upload an Excel (.xlsx) file with columns:<br/><b>Name, Email, WhatsApp, PlanType, StartDate, EndDate, Price</b></p>
                    
                    <label className="cursor-pointer bg-[#222] border-2 border-dashed border-gray-600 hover:border-amber-500 rounded-xl p-8 w-full flex flex-col items-center justify-center transition">
                        <Upload className="text-gray-400 mb-2" size={32}/>
                        <span className="text-sm font-bold text-gray-300">Click to upload Excel File</span>
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* PENDING LIST TO SAVE */}
            {/* ========================================================================= */}
            {parsedStudents.length > 0 && (
                <div className="bg-[#111] border border-amber-500/50 rounded-2xl overflow-hidden mb-8 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-lg font-bold text-amber-500">Pending Uploads ({parsedStudents.length} Students)</h2>
                        <button 
                            onClick={handleBulkUpload} 
                            disabled={isSaving} 
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader size={16} className="animate-spin"/> : <Save size={16}/>} 
                            {isSaving ? 'Saving to Database...' : 'Save All to Database'}
                        </button>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="text-gray-400 border-b border-white/10">
                                    <th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Plan</th><th className="pb-2">Period</th><th className="pb-2">Price</th><th className="pb-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                {parsedStudents.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02]">
                                        <td className="py-2">{student.name}</td>
                                        <td className="py-2">{student.email}</td>
                                        <td className="py-2"><span className="text-xs bg-white/10 px-2 py-1 rounded font-bold">{student.planType}</span></td>
                                        <td className="py-2 text-xs">{student.startDate} <br/><span className="text-gray-500">to</span> {student.endDate}</td>
                                        <td className="py-2 text-green-400 font-bold">Rs. {student.price}</td>
                                        <td className="py-2 text-right">
                                            <button onClick={() => handleRemoveFromPending(idx)} className="text-red-500 hover:text-red-400"><X size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* ========================================================================= */}
            {/* EXISTING STUDENTS LIST */}
            {/* ========================================================================= */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold">Manage Existing Students</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input 
                            type="text" placeholder="Search by name, email, or number..." 
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[#222] border border-white/10 rounded-xl text-sm focus:border-amber-500 outline-none w-full md:w-[300px]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1a1a1a] text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4">Student Info</th>
                                <th className="p-4">WhatsApp Number</th>
                                <th className="p-4">Plan / Paid</th>
                                <th className="p-4">Expiry Date</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.map(student => {
                                const expiryDate = student.expiry_date || student.end_date;
                                const isExpired = new Date(expiryDate) < new Date();
                                const amountPaid = student.amount || student.price || 0;
                                const planName = student.plan_type || 'Unknown Plan';

                                return (
                                <tr key={student.id} className="hover:bg-white/[0.02] transition">
                                    <td className="p-4">
                                        <p className="font-bold text-sm text-white">{student.student_name || student.name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{student.user_email || student.email}</p>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300">{student.whatsapp_number || student.whatsapp}</td>
                                    <td className="p-4">
                                        <p className="text-xs bg-white/10 inline-block px-2 py-1 rounded font-bold mb-1">{planName}</p>
                                        <p className="text-sm font-medium text-green-400">Rs. {amountPaid}</p>
                                    </td>
                                    <td className="p-4">
                                        {editingId === student.id ? (
                                            <div className="flex items-center gap-2">
                                                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="bg-[#222] text-sm text-white px-2 py-1 rounded border border-amber-500 outline-none"/>
                                                <button onClick={() => handleUpdateDate(student.id)} className="text-green-500 hover:text-green-400"><Check size={16}/></button>
                                                <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400"><X size={16}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-bold px-2 py-1 rounded-md ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'N/A'}
                                                </span>
                                                <button onClick={() => { setEditingId(student.id); setEditDate(expiryDate ? expiryDate.split('T')[0] : ''); }} className="text-gray-500 hover:text-amber-500 transition"><Edit2 size={14}/></button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleDelete(student.id)} className="text-gray-500 hover:text-red-500 transition p-2 bg-white/5 rounded-lg hover:bg-red-500/10"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {filteredStudents.length === 0 && <div className="p-8 text-center text-gray-500">No students found.</div>}
                </div>
            </div>
        </div>
    );
}
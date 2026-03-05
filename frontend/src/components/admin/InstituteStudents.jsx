import React, { useState, useEffect } from 'react';
import { Upload, Users, DollarSign, Search, Trash2, Edit2, Check, X } from 'lucide-react';
import { api } from '../../lib/api'; // ඔයාගේ axios api instance එක

export default function InstituteStudents() {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [csvFile, setCsvFile] = useState(null);
    const [unitPrice, setUnitPrice] = useState(5000);
    const [durationMonths, setDurationMonths] = useState(6);
    const [parsedStudents, setParsedStudents] = useState([]);
    
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

    // Handle CSV File Selection & Parsing
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setCsvFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const lines = text.split('\n');
                const data = [];
                // Assuming CSV Format: Name, Email, WhatsApp
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const cols = lines[i].split(',');
                    if (cols.length >= 3) {
                        data.push({
                            name: cols[0].trim(),
                            email: cols[1].trim(),
                            whatsapp: cols[2].trim()
                        });
                    }
                }
                setParsedStudents(data);
            };
            reader.readAsText(file);
        }
    };

    // Submit Bulk Data
    const handleBulkUpload = async () => {
        if (parsedStudents.length === 0) return alert("Please upload a valid CSV file");
        try {
            await api.post('/institute/bulk-add', {
                students: parsedStudents,
                unitPrice: unitPrice,
                durationMonths: durationMonths
            });
            alert("Students added successfully!");
            setCsvFile(null);
            setParsedStudents([]);
            fetchStudents(); // Refresh list
        } catch (error) {
            alert("Error uploading students.");
            console.error(error);
        }
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

    // Metrics Calculations
    const activeStudents = students.filter(s => new Date(s.expiry_date) > new Date());
    const totalRevenue = students.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Search Filter
    const filteredStudents = students.filter(s => 
        s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

            {/* CSV Bulk Upload Section */}
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Upload size={20} className="text-amber-500"/> Bulk Import Students (CSV)</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Upload CSV (Name, Email, WhatsApp)</label>
                        <input type="file" accept=".csv" onChange={handleFileChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 text-gray-300"/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Unit Price (Per Student)</label>
                        <input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Duration (Months)</label>
                        <input type="number" value={durationMonths} onChange={e => setDurationMonths(e.target.value)} className="w-full bg-[#222] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none" />
                    </div>
                    <button onClick={handleBulkUpload} disabled={parsedStudents.length === 0} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                        Upload {parsedStudents.length > 0 ? `(${parsedStudents.length})` : ''}
                    </button>
                </div>
                {parsedStudents.length > 0 && (
                    <p className="text-sm text-green-400 mt-4">Estimated Revenue: Rs. {(parsedStudents.length * unitPrice).toLocaleString()}</p>
                )}
            </div>

            {/* Students List Section */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold">Manage Students</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                        <input 
                            type="text" placeholder="Search by name, email, or number..." 
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[#222] border border-white/10 rounded-xl text-sm focus:border-amber-500 outline-none w-[300px]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#1a1a1a] text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4">Student Info</th>
                                <th className="p-4">WhatsApp Number</th>
                                <th className="p-4">Paid Amount</th>
                                <th className="p-4">Expiry Date</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.map(student => {
                                const isExpired = new Date(student.expiry_date) < new Date();
                                return (
                                <tr key={student.id} className="hover:bg-white/[0.02] transition">
                                    <td className="p-4">
                                        <p className="font-bold text-sm text-white">{student.student_name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{student.user_email}</p>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300">{student.whatsapp_number}</td>
                                    <td className="p-4 text-sm font-medium text-green-400">Rs. {student.amount}</td>
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
                                                    {new Date(student.expiry_date).toLocaleDateString()}
                                                </span>
                                                <button onClick={() => { setEditingId(student.id); setEditDate(student.expiry_date.split('T')[0]); }} className="text-gray-500 hover:text-amber-500 transition"><Edit2 size={14}/></button>
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
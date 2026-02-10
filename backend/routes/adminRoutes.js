const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // 🔥 MISSING IMPORT ADDED



// --- 3. GET DASHBOARD STATS ---
router.get('/stats', async (req, res) => {
    try {
        // 1. Get Total Students
        const { count: studentCount, error: err1 } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 2. Get Revenue & Pending Approvals
        const { data: payments, error: err2 } = await supabase
            .from('payments')
            .select('amount, status');

        if (err1 || err2) throw (err1 || err2);

        const totalRevenue = payments
            .filter(p => p.status === 'approved')
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        const pendingCount = payments.filter(p => p.status === 'pending').length;

        // Dummy Data for Chart (Danata mehema yawamu)
        const chartData = [
            { name: 'Jan', student: 400, api: 240 },
            { name: 'Feb', student: 300, api: 139 },
            { name: 'Mar', student: 200, api: 980 },
        ];

        const userDistribution = [
            { name: 'Free', value: studentCount || 0 },
            { name: 'Scholar', value: 0 },
            { name: 'Genius', value: 0 },
        ];

        res.json({
            studentCount: studentCount || 0,
            totalRevenue,
            pendingCount,
            chartData,
            userDistribution
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 1. ADMIN MANAGEMENT
// ==========================================

// Get All Admins
router.get('/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Admin (With Password Hashing)
router.post('/create-admin', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        // Check if admin already exists
        const { data: existingUser } = await supabase
            .from('admins')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: "Admin with this email already exists" });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert into Supabase
        const { data, error } = await supabase
            .from('admins')
            .insert([{ full_name: name, email, password_hash, role }]);

        if (error) throw error;
        res.json({ message: "Admin Created Successfully!", data });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔥 ADMIN LOGIN ROUTE
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user exists
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        // 2. Check Password
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        // 3. Generate Token
        const token = jwt.sign({ id: admin.id, role: admin.role }, 'YOUR_SECRET_KEY', { expiresIn: '1d' });

        res.json({ 
            message: "Login Successful", 
            token, 
            user: { id: admin.id, name: admin.full_name, email: admin.email, role: admin.role } 
        });

    } catch (err) {
        console.error("Login Error:", err); // Log the actual error to console
        res.status(500).json({ error: "Server Error" });
    }
});

// ==========================================
// 2. KNOWLEDGE BASE (RAG DATA)
// ==========================================

// Get Summary (Fetches ALL pages using Loop)
router.get('/knowledge/summary', async (req, res) => {
    try {
        let allData = [];
        let from = 0;
        const chunkSize = 1000;
        let moreData = true;

        while (moreData) {
            const { data, error } = await supabase
                .from('documents')
                .select('metadata')
                .range(from, from + chunkSize - 1);

            if (error) throw error;

            if (data.length > 0) {
                allData = [...allData, ...data];
                from += chunkSize;
                if (data.length < chunkSize) moreData = false;
            } else {
                moreData = false;
            }
        }

        const summary = {};

        allData.forEach(doc => {
            const m = doc.metadata;
            if (!m) return;

            const key = `${m.grade}-${m.subject}-${m.medium}-${m.type || m.category}`;

            if (!summary[key]) {
                summary[key] = {
                    grade: m.grade,
                    subject: m.subject,
                    medium: m.medium,
                    type: m.type || m.category,
                    file_name: m.source || m.file_name,
                    total_pages: 0,
                    pages_list: []
                };
            }
            
            summary[key].total_pages += 1;
            if(m.page && !summary[key].pages_list.includes(m.page)) {
                summary[key].pages_list.push(m.page);
            }
        });

        Object.values(summary).forEach(item => {
            item.pages_list.sort((a, b) => a - b);
        });

        res.json(Object.values(summary));

    } catch (error) {
        console.error("Knowledge Summary Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
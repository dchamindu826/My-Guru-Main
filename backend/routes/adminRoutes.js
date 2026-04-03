const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); // Supabase Import එක
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const moment = require('moment'); // npm install moment කරගන්න අමතක කරන්න එපා
const cron = require('node-cron');

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
        console.error("Login Error:", err); 
        res.status(500).json({ error: "Server Error" });
    }
});

// ==========================================
// 2. GET DASHBOARD STATS
// ==========================================

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

        // Dummy Data for Chart
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
// 3. GET TOKEN STATS (SUPABASE)
// ==========================================

router.get('/token-stats', async (req, res) => {
    try {
        const { filter } = req.query; // 'Daily', 'Weekly' or 'Monthly'
        
        let startDate;
        if (filter === 'Weekly') {
            startDate = moment().subtract(7, 'days').toISOString();
        } else if (filter === 'Daily') {
            startDate = moment().subtract(1, 'days').toISOString();
        } else {
            // Default - Monthly
            startDate = moment().subtract(30, 'days').toISOString();
        }

        // Supabase එකෙන් Date Range එකට අදාළ Data ටික ගන්නවා
        const { data: tokenData, error } = await supabase
            .from('token_usage')
            .select('*')
            .gte('created_at', startDate);

        if (error) throw error;

        // ගණනය කිරීම් (Total Tokens & Total Cost)
        const summary = tokenData.reduce((acc, curr) => {
            acc.totalTokens += (curr.total_tokens || 0);
            acc.totalCost += (curr.estimated_cost || 0);
            return acc;
        }, { totalTokens: 0, totalCost: 0 });

        res.json({
            success: true,
            summary: summary
        });

    } catch (error) {
        console.error("Token Stats API Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ==========================================
// 4. KNOWLEDGE BASE (RAG DATA)
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

// ==========================================
// BACKUP LOGIC FUNCTION (Manual & Auto දෙකටම)
// ==========================================
const performDatabaseBackup = async () => {
    try {
        console.log("⏳ Starting Database Backup...");

        // 1. ඔයාගේ Screenshot එකේ තිබ්බ වැදගත්ම Tables වලින් Data ගන්නවා
        const { data: admins } = await supabase.from('admins').select('id, full_name, email, role, created_at'); 
        const { data: profiles } = await supabase.from('profiles').select('*');
        const { data: payments } = await supabase.from('payments').select('*');
        const { data: plans } = await supabase.from('plans').select('*');
        const { data: documents } = await supabase.from('documents').select('*');
        const { data: token_usage } = await supabase.from('token_usage').select('*');
        const { data: user_credits } = await supabase.from('user_credits').select('*');
        // (Chat logs වගේ ලොකු tables දානවා නම් මෙතනට පේළි එකතු කරන්න)

        // ඩේටා ටික එක JSON එකකට දාගන්නවා
        const backupData = {
            timestamp: moment().toISOString(),
            data: {
                admins: admins || [],
                profiles: profiles || [],
                payments: payments || [],
                plans: plans || [],
                documents: documents || [],
                token_usage: token_usage || [],
                user_credits: user_credits || []
            }
        };

        const jsonString = JSON.stringify(backupData);
        const fileName = `backup_${moment().format('YYYYMMDD_HHmmss')}.json`;

        // 2. Supabase Storage 'backups' bucket එකට අප්ලෝඩ් කරනවා
        const { error: uploadError } = await supabase.storage
            .from('backups')
            .upload(fileName, jsonString, {
                contentType: 'application/json',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 3. පරණ Backups මකා දැමීම (අලුත්ම 2ක් විතරක් ඉතුරු කිරීම)
        const { data: files, error: listError } = await supabase.storage.from('backups').list();
        if (listError) throw listError;

        if (files && files.length > 2) {
            files.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const filesToDelete = files.slice(0, files.length - 2).map(f => f.name);
            
            if (filesToDelete.length > 0) {
                await supabase.storage.from('backups').remove(filesToDelete);
            }
        }

        console.log(`✅ Backup Successful! File: ${fileName}`);
        return { success: true, fileName };

    } catch (error) {
        console.error("❌ Backup Creation Error:", error);
        return { success: false, error: error.message };
    }
};

// ==========================================
// CRON JOB SETUP (VPS එකේ Auto දුවන්න)
// ==========================================
// හැම පැය 12කට සැරයක්ම මේක රන් වෙනවා ("0 */12 * * *")
// ඔයාට පැය 24කට සැරයක් (රෑ 12ට) ඕන නම් "0 0 * * *" කියලා වෙනස් කරන්න.
cron.schedule('0 */12 * * *', async () => {
    console.log("⏰ Running Scheduled Auto-Backup...");
    await performDatabaseBackup();
});


// ==========================================
// API ROUTES (Frontend එකෙන් කතා කරන්න)
// ==========================================

// 1. Manual Backup Route (Button Click එකට)
router.post('/create-backup', async (req, res) => {
    const result = await performDatabaseBackup();
    if (result.success) {
        res.status(200).json({ success: true, message: "Backup created successfully! Old backups cleaned.", fileName: result.fileName });
    } else {
        res.status(500).json({ success: false, error: "Backup failed" });
    }
});

// 2. Get Latest Backup Download Link
router.get('/latest-backup', async (req, res) => {
    try {
        const { data: files, error } = await supabase.storage.from('backups').list();
        if (error) throw error;

        if (!files || files.length === 0) {
            return res.status(404).json({ success: false, error: "No backups found" });
        }

        files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latestFile = files[0].name;

        // Download කරන්න පුළුවන් Signed URL එකක් හදනවා (පැය 1ක් වලංගුයි)
        const { data: urlData, error: urlError } = await supabase.storage
            .from('backups')
            .createSignedUrl(latestFile, 3600);

        if (urlError) throw urlError;

        res.json({ success: true, downloadUrl: urlData.signedUrl, fileName: latestFile });
    } catch (error) {
        console.error("Fetch Latest Backup Error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch backup link" });
    }
});

module.exports = router;
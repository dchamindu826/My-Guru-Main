const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const moment = require('moment'); 
const cron = require('node-cron');

// ==========================================
// SECURITY MIDDLEWARE (Token එක හරිද බලන එක)
// ==========================================
const verifyToken = (req, res, next) => {
    // Frontend එකෙන් එවන token එක ගන්නවා
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ error: "Access Denied. No Token Provided." });
    }

    try {
        // Token එක verify කරනවා (process.env.JWT_SECRET එක පාවිච්චි කරලා)
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next(); // Token එක හරි නම් ඊළඟට යන්න දෙනවා
    } catch (err) {
        res.status(401).json({ error: "Invalid or Expired Token" });
    }
};

// ==========================================
// 1. ADMIN MANAGEMENT
// ==========================================

// 🔥 ADMIN LOGIN ROUTE (මෙතනට token ඕන නෑ, මොකද token එක හදන්නේ මෙතනින්)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid Email or Password" });
        }

        // 🛑 FIX: Hardcode කරපු key එක අයින් කරලා .env එකෙන් ගන්න හැදුවා
        const token = jwt.sign(
            { id: admin.id, role: admin.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

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

// Get All Admins (Protected)
router.get('/users', verifyToken, async (req, res) => {
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

// Create Admin (Protected - හැකර්ට මේකට එන්න බෑ දැන්)
router.post('/create-admin', verifyToken, async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const { data: existingUser } = await supabase
            .from('admins')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: "Admin with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('admins')
            .insert([{ full_name: name, email, password_hash, role }]);

        if (error) throw error;
        res.json({ message: "Admin Created Successfully!", data });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. GET DASHBOARD STATS (Protected)
// ==========================================

router.get('/stats', verifyToken, async (req, res) => {
    // ... (ඔයාගේ පරණ code එකමයි, verifyToken විතරක් දැම්මා) ...
    try {
        const { count: studentCount, error: err1 } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { data: payments, error: err2 } = await supabase.from('payments').select('amount, status');

        if (err1 || err2) throw (err1 || err2);

        const totalRevenue = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.amount || 0), 0);
        const pendingCount = payments.filter(p => p.status === 'pending').length;

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

        res.json({ studentCount: studentCount || 0, totalRevenue, pendingCount, chartData, userDistribution });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 3. GET TOKEN STATS (Protected)
// ==========================================

router.get('/token-stats', verifyToken, async (req, res) => {
    try {
        const { filter } = req.query; 
        
        let startDate;
        if (filter === 'Weekly') startDate = moment().subtract(7, 'days').toISOString();
        else if (filter === 'Daily') startDate = moment().subtract(1, 'days').toISOString();
        else startDate = moment().subtract(30, 'days').toISOString();

        const { data: tokenData, error } = await supabase
            .from('token_usage')
            .select('*')
            .gte('created_at', startDate);

        if (error) throw error;

        const summary = tokenData.reduce((acc, curr) => {
            acc.totalTokens += (curr.total_tokens || 0);
            acc.totalCost += (curr.estimated_cost || 0);
            return acc;
        }, { totalTokens: 0, totalCost: 0 });

        res.json({ success: true, summary: summary });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ==========================================
// 4. KNOWLEDGE BASE (Protected)
// ==========================================

router.get('/knowledge/summary', verifyToken, async (req, res) => {
    // ... (ඔයාගේ පරණ code එකමයි) ...
    try {
        let allData = [];
        let from = 0;
        const chunkSize = 1000;
        let moreData = true;

        while (moreData) {
            const { data, error } = await supabase.from('documents').select('metadata').range(from, from + chunkSize - 1);
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
                summary[key] = { grade: m.grade, subject: m.subject, medium: m.medium, type: m.type || m.category, file_name: m.source || m.file_name, total_pages: 0, pages_list: [] };
            }
            summary[key].total_pages += 1;
            if(m.page && !summary[key].pages_list.includes(m.page)) summary[key].pages_list.push(m.page);
        });

        Object.values(summary).forEach(item => item.pages_list.sort((a, b) => a - b));
        res.json(Object.values(summary));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// BACKUP LOGIC FUNCTION 
// ==========================================
const performDatabaseBackup = async () => {
    // ... (ඔයාගේ පරණ code එකමයි) ...
    try {
        const { data: admins } = await supabase.from('admins').select('id, full_name, email, role, created_at'); 
        const { data: profiles } = await supabase.from('profiles').select('*');
        const { data: payments } = await supabase.from('payments').select('*');
        const { data: plans } = await supabase.from('plans').select('*');
        const { data: documents } = await supabase.from('documents').select('*');
        const { data: token_usage } = await supabase.from('token_usage').select('*');
        const { data: user_credits } = await supabase.from('user_credits').select('*');

        const backupData = { timestamp: moment().toISOString(), data: { admins: admins || [], profiles: profiles || [], payments: payments || [], plans: plans || [], documents: documents || [], token_usage: token_usage || [], user_credits: user_credits || [] } };
        const jsonString = JSON.stringify(backupData);
        const fileName = `backup_${moment().format('YYYYMMDD_HHmmss')}.json`;

        const { error: uploadError } = await supabase.storage.from('backups').upload(fileName, jsonString, { contentType: 'application/json', upsert: true });
        if (uploadError) throw uploadError;

        const { data: files, error: listError } = await supabase.storage.from('backups').list();
        if (listError) throw listError;

        if (files && files.length > 2) {
            files.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const filesToDelete = files.slice(0, files.length - 2).map(f => f.name);
            if (filesToDelete.length > 0) await supabase.storage.from('backups').remove(filesToDelete);
        }
        return { success: true, fileName };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

cron.schedule('0 */12 * * *', async () => {
    console.log("⏰ Running Scheduled Auto-Backup...");
    await performDatabaseBackup();
});

// ==========================================
// API ROUTES 
// ==========================================

// Manual Backup Route (Protected)
router.post('/create-backup', verifyToken, async (req, res) => {
    const result = await performDatabaseBackup();
    if (result.success) res.status(200).json({ success: true, message: "Backup created successfully! Old backups cleaned.", fileName: result.fileName });
    else res.status(500).json({ success: false, error: "Backup failed" });
});

// Get Latest Backup Download Link (Protected)
router.get('/latest-backup', verifyToken, async (req, res) => {
    try {
        const { data: files, error } = await supabase.storage.from('backups').list();
        if (error) throw error;
        if (!files || files.length === 0) return res.status(404).json({ success: false, error: "No backups found" });

        files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latestFile = files[0].name;

        const { data: urlData, error: urlError } = await supabase.storage.from('backups').createSignedUrl(latestFile, 3600);
        if (urlError) throw urlError;

        res.json({ success: true, downloadUrl: urlData.signedUrl, fileName: latestFile });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch backup link" });
    }
});

// BULK UPLOAD (Protected)
router.post('/bulk-assign-plans', verifyToken, async (req, res) => {
    const { users } = req.body; 
    if (!users || !Array.isArray(users) || users.length === 0) return res.status(400).json({ success: false, message: "No user data provided" });

    try {
        const formattedData = users.map(u => ({
            name: u.name, email: u.email, whatsapp: u.whatsapp, plan_type: u.planType, start_date: u.startDate, end_date: u.endDate, price: u.price, status: 'active' 
        }));

        const { data, error } = await supabase.from('user_subscriptions').insert(formattedData);
        if (error) throw error;

        res.status(200).json({ success: true, message: `${formattedData.length} Users successfully assigned to plans!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete Admin (Protected)
router.delete('/delete-admin/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('admins')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: "Admin deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
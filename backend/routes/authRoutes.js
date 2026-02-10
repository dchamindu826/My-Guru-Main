const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs'); // Need to install: npm install bcryptjs jsonwebtoken
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// 1. ADMIN LOGIN
router.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Fetch Admin
        const { data: admin, error } = await supabase
            .from('admins') // Ensure you have this table
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) return res.status(401).json({ error: "Admin not found" });

        // Verify Password
        const validPass = await bcrypt.compare(password, admin.password_hash);
        if (!validPass) return res.status(401).json({ error: "Invalid Credentials" });

        // Generate Token
        const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ message: "Login Successful", token, user: { name: admin.full_name, email: admin.email, role: admin.role } });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. CREATE ADMIN (Protected - Should validate token ideally)
router.post('/create-admin', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('admins')
            .insert([{ full_name: name, email, password_hash: hash, role }]);

        if (error) throw error;
        res.json({ message: "Admin Created Successfully!" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
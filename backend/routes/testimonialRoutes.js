const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. GET ALL (Public)
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 2. ADD NEW (Admin)
router.post('/', async (req, res) => {
    const { student_name, role, message, rating } = req.body;
    
    const { data, error } = await supabase
        .from('testimonials')
        .insert([{ student_name, role, message, rating }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

// 3. DELETE (Admin)
router.delete('/:id', async (req, res) => {
    const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Deleted successfully" });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. GET ALL PLANS
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 2. CREATE PLAN (Admin)
router.post('/', async (req, res) => {
    const { name, price, period, features, is_popular } = req.body;
    
    // features array එක කෙලින්ම යවන්න පුළුවන් (Table එකේ jsonb නිසා)
    const { data, error } = await supabase
        .from('plans')
        .insert([{ name, price, period, features, is_popular }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// 3. DELETE PLAN
router.delete('/:id', async (req, res) => {
    const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Plan Deleted" });
});

module.exports = router;
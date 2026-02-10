const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Submit Feedback
router.post('/', async (req, res) => {
    const { user_email, message, rating, type } = req.body;
    try {
        const { data, error } = await supabase
            .from('user_feedbacks')
            .insert([{ user_email, message, rating, type }]);

        if (error) throw error;
        res.status(201).json({ message: "Feedback Sent!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Feedbacks (Admin)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('user_feedbacks')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Feedback
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('user_feedbacks').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
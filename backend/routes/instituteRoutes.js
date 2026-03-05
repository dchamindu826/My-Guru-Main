const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. Bulk Add Students (CSV Data)
router.post('/bulk-add', async (req, res) => {
    try {
        const { students, unitPrice, durationMonths } = req.body;

        // Calculate Expiry Date
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + parseInt(durationMonths));

        const recordsToInsert = students.map(student => ({
            student_name: student.name,
            user_email: student.email,
            whatsapp_number: student.whatsapp,
            amount: parseFloat(unitPrice),
            package_name: 'Institute_Unlimited',
            status: 'approved',
            expiry_date: expiryDate.toISOString(),
            created_at: new Date().toISOString()
        }));

        const { data, error } = await supabase.from('payments').insert(recordsToInsert).select();
        
        if (error) throw error;
        res.status(200).json({ success: true, message: `Successfully added ${students.length} students!`, data });
    } catch (error) {
        console.error("Bulk Add Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Get All Institute Students
router.get('/students', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('package_name', 'Institute_Unlimited')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update Expiry Date
router.put('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { expiry_date } = req.body;

        const { data, error } = await supabase
            .from('payments')
            .update({ expiry_date: new Date(expiry_date).toISOString() })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.status(200).json({ success: true, message: "Expiry Date Updated!", data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Delete Student
router.delete('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('payments').delete().eq('id', id);
        
        if (error) throw error;
        res.status(200).json({ success: true, message: "Student Deleted!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
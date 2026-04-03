const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// 1. Bulk Add Students (Excel Data & Manual Entry)
router.post('/bulk-add', async (req, res) => {
    try {
        const { students } = req.body;

        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ error: "No student data provided" });
        }

        // Frontend එකෙන් එන Data ටික (Name, Email, WhatsApp, PlanType, StartDate, EndDate, Price) 
        // ඔයාගේ 'payments' table එකේ තියෙන columns වලට මැච් කරනවා
        const recordsToInsert = students.map(student => ({
            student_name: student.name,
            user_email: student.email,
            whatsapp_number: String(student.whatsapp), // String එකක් විදිහට යවමු ආරක්ෂාවට
            package_name: student.planType || 'Institute_Unlimited', 
            amount: parseFloat(student.price) || 0,
            status: 'approved',
            expiry_date: new Date(student.endDate).toISOString(), 
            // start_date එකක් payments ටේබල් එකේ නැති නිසා created_at එකට දානවා
            created_at: student.startDate ? new Date(student.startDate).toISOString() : new Date().toISOString()
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
            //.eq('package_name', 'Institute_Unlimited') // මේක අයින් කළා, නැත්නම් අලුත් Plan (Monthly/Full) පේන්නේ නැති වෙයි
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
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// WEBHOOK: RECEIVE SMS FROM PHONE
router.post('/', async (req, res) => {
    try {
        const { message, sender } = req.body; // App එක අනුව field names වෙනස් වෙන්න පුළුවන්
        console.log("📩 New Bank SMS:", message);

        // 1. Regex to extract Amount (Eg: Rs. 5,000.00 credited)
        const amountMatch = message.match(/Rs\.?\s*([\d,]+(\.\d{2})?)/i);
        const refMatch = message.match(/Ref:?\s*(\d+)/i); // Extract Ref Number

        let amount = 0;
        let ref_number = null;

        if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        }
        if (refMatch) {
            ref_number = refMatch[1];
        }

        // 2. Save to Database
        const { error } = await supabase.from('bank_transactions').insert([{
            bank_name: sender,
            sms_content: message,
            amount: amount,
            ref_number: ref_number,
            transaction_time: new Date()
        }]);

        if (error) throw error;

        res.status(200).send("SMS Processed");

    } catch (err) {
        console.error("SMS Error:", err);
        res.status(500).send("Error");
    }
});

module.exports = router;
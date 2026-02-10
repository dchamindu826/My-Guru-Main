const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { extractSlipData } = require('../utils/aiVerifier'); // Updated AI Function

// ==========================================
// 1. CREATE PAYMENT & INTELLIGENT VERIFICATION
// ==========================================
router.post('/', async (req, res) => {
    const { user_id, user_email, package_name, amount, slip_url, whatsapp_number } = req.body;

    console.log("📥 Receiving Payment Request for:", user_email);

    try {
        // --- STEP A: Save to Database as 'pending' FIRST ---
        // This ensures the user gets a quick response without waiting for AI.
        const { data: payment, error } = await supabase
            .from('payments')
            .insert([{ 
                user_id: user_id, 
                package_name, 
                amount, 
                slip_url, 
                whatsapp_number,
                status: 'pending' 
            }])
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            return res.status(500).json({ error: error.message });
        }

        // Return success to frontend immediately
        res.status(201).json(payment);

        // --- STEP B: RUN INTELLIGENT MATCHING ENGINE (Background Process) ---
        // This runs asynchronously after the response is sent.
        (async () => {
            try {
                console.log(`🤖 AI Analyzing Slip for Payment ID: ${payment.id}...`);
                
                // 1. Extract Data from Slip using Gemini
                const slipData = await extractSlipData(slip_url);

                if (slipData.is_blurry) {
                    console.log("⚠️ Slip is blurry or unreadable. Leaving as Pending for Admin.");
                    return;
                }

                console.log("📄 Extracted Slip Data:", slipData);

                // 2. Find Matching Bank Transaction (Within last 24 hours)
                // Logic: Look for UNUSED records with the EXACT AMOUNT.
                const { data: bankRecords } = await supabase
                    .from('bank_transactions')
                    .select('*')
                    .eq('amount', slipData.extracted_amount || amount) // Use AI amount, fallback to User amount
                    .eq('is_matched', false) // Don't double-spend
                    .gte('transaction_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

                let matchFound = false;

                if (bankRecords && bankRecords.length > 0) {
                    console.log(`🔍 Found ${bankRecords.length} potential bank records with amount ${amount}. Checking Proofs...`);

                    for (let record of bankRecords) {
                        let score = 0;

                        // --- PROOF 1: AMOUNT MATCH ---
                        // We queried by amount, so this is guaranteed.
                        score++; 

                        // --- PROOF 2: REFERENCE NUMBER MATCH ---
                        // Does the SMS contain the Ref No found on the slip?
                        if (slipData.ref_number && record.sms_content.includes(slipData.ref_number)) {
                            console.log(`✅ Proof: Ref Number matched (${slipData.ref_number})`);
                            score++;
                        }

                        // --- PROOF 3: TIME CONTEXT ---
                        // If the SMS was received reasonably close to the Upload time (e.g., within 2 hours)
                        // This helps if Ref number isn't clear.
                        const timeDiff = Math.abs(new Date(record.transaction_time) - new Date(payment.created_at));
                        const hoursDiff = timeDiff / 36e5;
                        
                        if (hoursDiff < 2) {
                             console.log(`✅ Proof: Time context valid (${hoursDiff.toFixed(2)} hrs diff)`);
                             score += 0.5; // Give half point for time
                        }

                        // --- FINAL DECISION ---
                        // If Score >= 2 (e.g. Amount + Ref) OR (Amount + Time + Clean Scan)
                        if (score >= 2) {
                            console.log(`🎉 STRONG MATCH FOUND! Auto-Approving Payment ID: ${payment.id}`);
                            
                            // 1. Approve Payment
                            await supabase
                                .from('payments')
                                .update({ status: 'approved' })
                                .eq('id', payment.id);
                            
                            // 2. Mark Bank Transaction as Used (Prevent Reuse)
                            await supabase
                                .from('bank_transactions')
                                .update({ is_matched: true })
                                .eq('id', record.id);
                            
                            matchFound = true;
                            break; // Stop looking
                        }
                    }
                }

                if (!matchFound) {
                    console.log("⏳ No strong match found yet. Waiting for SMS or Manual Review.");
                }

            } catch (bgError) {
                console.error("Background Verification Error:", bgError);
            }
        })();

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. GET USER HISTORY (Profile Page)
// ==========================================
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ==========================================
// 3. GET ALL PAYMENTS (Admin Panel)
// ==========================================
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// ==========================================
// 4. UPDATE STATUS (Manual Admin Action)
// ==========================================
router.put('/:id', async (req, res) => {
    const { status } = req.body;
    const { data, error } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', req.params.id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

module.exports = router;
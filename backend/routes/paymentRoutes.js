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
        // 🔥 STEP 0: ENSURE USER PROFILE EXISTS (Fix for WhatsApp Bot Issue)
        // Check if profile exists, if not, create one automatically
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user_id)
            .single();

        if (!existingProfile) {
            console.log("➕ Creating missing user profile for:", user_email);
            
            // Set plan type based on the package
            let planType = 'free'; // Default
            if (package_name && package_name.toLowerCase().includes('genius')) planType = 'genius';
            else if (package_name && package_name.toLowerCase().includes('scholar')) planType = 'scholar';
            
            let dailyLimit = planType === 'genius' ? 150 : (planType === 'scholar' ? 100 : 10);

            await supabase.from('profiles').insert([{
                id: user_id,
                email: user_email,
                full_name: user_email.split('@')[0], // Extract name from email as fallback
                whatsapp_number: whatsapp_number, // We know frontend sends it as 947... now
                plan_type: planType,
                daily_credits_limit: dailyLimit
            }]);
        } else if (!existingProfile.whatsapp_number) {
            // If profile exists but lacks whatsapp number, update it
             console.log("🔄 Updating WhatsApp number for existing profile:", user_email);
             await supabase.from('profiles').update({ whatsapp_number: whatsapp_number }).eq('id', user_id);
        }

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
                            
                            // 2. Update Profile Plan (Bonus: Ensure Profile reflects correct active plan)
                            let newPlanType = package_name.toLowerCase().includes('genius') ? 'genius' : 'scholar';
                            let newDailyLimit = newPlanType === 'genius' ? 150 : 100;
                            await supabase.from('profiles').update({
                                plan_type: newPlanType,
                                daily_credits_limit: newDailyLimit
                            }).eq('id', user_id);
                            
                            // 3. Mark Bank Transaction as Used (Prevent Reuse)
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
    const { status, user_id, package_name } = req.body;
    
    try {
        const { data, error } = await supabase
            .from('payments')
            .update({ status })
            .eq('id', req.params.id)
            .select();
            
        // If Admin manually approved, update profile
        if(status === 'approved' && user_id && package_name) {
             let newPlanType = package_name.toLowerCase().includes('genius') ? 'genius' : 'scholar';
             let newDailyLimit = newPlanType === 'genius' ? 150 : 100;
             await supabase.from('profiles').update({
                 plan_type: newPlanType,
                 daily_credits_limit: newDailyLimit
             }).eq('id', user_id);
        }

        if (error) return res.status(500).json({ error: error.message });
        res.json(data[0]);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
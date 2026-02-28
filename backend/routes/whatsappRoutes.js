const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const axios = require('axios');

// Environment Variables
const WA_TOKEN = process.env.WA_TOKEN;
const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || "myguru_secret_token_123";
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;

// Helper: Download Media from WhatsApp and Convert to Base64
async function getMediaBase64(mediaId) {
    try {
        const urlRes = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
            headers: { 'Authorization': `Bearer ${WA_TOKEN}` }
        });
        const mediaUrl = urlRes.data.url;

        const fileRes = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            headers: { 'Authorization': `Bearer ${WA_TOKEN}` }
        });

        const base64Str = Buffer.from(fileRes.data, 'binary').toString('base64');
        return base64Str;
    } catch (error) {
        console.error("Media Download Error:", error.message);
        return null;
    }
}

// Helper: Send Text Message
async function sendWhatsAppMessage(to, text) {
    try {
        console.log(`[WhatsApp] Sending to: ${to} | Using ID: ${PHONE_NUMBER_ID}`);
        
        const response = await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WA_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: { preview_url: false, body: text }
            }
        });
        
        console.log(`[WhatsApp] ✅ API Accepted: ${response.data.messages[0].id}`);
        
    } catch (error) {
        console.error("❌ API ERROR:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
}

// Helper: Send Interactive Buttons
async function sendMediumSelectionButtons(to) {
    try {
        const response = await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WA_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: { text: "ඔයාට My Guru ගෙන් ප්‍රශ්න අහන්න ඕන Medium එක මොකක්ද? 👇" },
                    action: {
                        buttons: [
                            { type: "reply", reply: { id: "MED_SINHALA", title: "Sinhala" } },
                            { type: "reply", reply: { id: "MED_ENGLISH", title: "English" } },
                            { type: "reply", reply: { id: "MED_TAMIL", title: "Tamil" } }
                        ]
                    }
                }
            }
        });
        console.log(`[WhatsApp] ✅ Buttons Accepted: ${response.data.messages[0].id}`);
    } catch (error) {
        console.error("❌ BUTTON ERROR:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
}

// Webhook Verification
router.get('/webhook', (req, res) => {
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Main Webhook
router.post('/webhook', async (req, res) => {
    try {
        let body = req.body;
        
        // Log status updates (delivered, read, sent)
        if (body.entry && body.entry[0].changes[0].value.statuses) {
            let statusObj = body.entry[0].changes[0].value.statuses[0];
            console.log(`📩 Status Update: [${statusObj.id}] is now [${statusObj.status}] to [${statusObj.recipient_id}]`);
            return res.sendStatus(200);
        }

        if (body.object === 'whatsapp_business_account') {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
                
                let msgObj = body.entry[0].changes[0].value.messages[0];
                let phone_number = msgObj.from;
                let msg_type = msgObj.type;
                
                res.sendStatus(200); 

                const { data: userProfile } = await supabase.from('profiles').select('*').eq('whatsapp_number', phone_number).single();

                if (!userProfile) {
                    await sendWhatsAppMessage(phone_number, "ආයුබෝවන්! My Guru වෙත සාදරයෙන් පිළිගනිමු. 🎓\nhttps://myguru.lumi-automation.com");
                    return;
                }

                const { data: activePlan } = await supabase.from('payments')
                    .select('*').eq('user_id', userProfile.id).eq('status', 'approved')
                    .order('created_at', { ascending: false }).limit(1).single();

                if (!activePlan || activePlan.package_name === 'Free') {
                    await sendWhatsAppMessage(phone_number, "🛑 Premium සේවාව ලබා ගැනීමට Upgrade කරන්න.\nhttps://myguru.lumi-automation.com/plans");
                    return;
                }

                let isUnlimited = activePlan.package_name.toLowerCase().includes('genius');
                let maxCredits = isUnlimited ? 150 : 100;
                let { data: userCredit } = await supabase.from('user_credits').select('*').eq('user_id', userProfile.id).single();
                let today = new Date().toISOString().split('T')[0];

                if (!userCredit) {
                    const newCredit = { user_id: userProfile.id, total_used: 0, daily_used: 0, last_reset_date: today };
                    await supabase.from('user_credits').insert([newCredit]);
                    userCredit = newCredit;
                } else if (userCredit.last_reset_date !== today) {
                    await supabase.from('user_credits').update({ daily_used: 0, last_reset_date: today }).eq('user_id', userProfile.id);
                    userCredit.daily_used = 0;
                }

                if ((!isUnlimited && userCredit.total_used >= maxCredits) || (isUnlimited && userCredit.daily_used >= maxCredits)) {
                    await sendWhatsAppMessage(phone_number, "🛑 සීමාව ඉක්මවා ඇත.");
                    return;
                }

                let { data: session } = await supabase.from('whatsapp_sessions').select('*').eq('phone', phone_number).single();
                if (!session) {
                    const newSession = { phone: phone_number, state: 'CHOOSING_MEDIUM', medium: null, subject: null };
                    await supabase.from('whatsapp_sessions').insert([newSession]);
                    session = newSession;
                }

                let msg_text = "";
                if (msg_type === 'text') msg_text = msgObj.text.body;
                else if (msg_type === 'interactive') msg_text = msgObj.interactive.button_reply.title;

                if (msg_text.toLowerCase() === '#menu') {
                    await supabase.from('whatsapp_sessions').update({ state: 'CHOOSING_MEDIUM', subject: null }).eq('phone', phone_number);
                    await sendMediumSelectionButtons(phone_number);
                    return;
                }

                if (session.state === 'CHOOSING_MEDIUM') {
                    if (['Sinhala', 'English', 'Tamil'].includes(msg_text)) {
                        await supabase.from('whatsapp_sessions').update({ state: 'CHOOSING_SUBJECT', medium: msg_text }).eq('phone', phone_number);
                        await sendWhatsAppMessage(phone_number, `✅ ${msg_text} තෝරාගත්තා! දැන් විෂය අංකය එවන්න.`);
                    } else await sendMediumSelectionButtons(phone_number);
                    return;
                }

                if (session.state === 'CHOOSING_SUBJECT') {
                    const subjectsMap = { '1': 'Science', '2': 'Mathematics' }; // simplified for test
                    let chosenSubject = subjectsMap[msg_text.trim()];
                    if (chosenSubject) {
                        await supabase.from('whatsapp_sessions').update({ state: 'CHATTING', subject: chosenSubject }).eq('phone', phone_number);
                        await sendWhatsAppMessage(phone_number, `🎉 ${chosenSubject} තෝරාගත්තා! ප්‍රශ්නය අහන්න.`);
                    } else await sendWhatsAppMessage(phone_number, "⚠️ අංකය වැරදියි.");
                    return;
                }

                if (session.state === 'CHATTING') {
                    let payload = { question: msg_text, subject: session.subject, medium: session.medium };
                    try {
                        const aiRes = await axios.post("http://127.0.0.1:5002/chat", payload);
                        if(aiRes.data?.answer) {
                            await sendWhatsAppMessage(phone_number, aiRes.data.answer);
                            await supabase.from('user_credits').update({ total_used: userCredit.total_used + 1, daily_used: userCredit.daily_used + 1 }).eq('user_id', userProfile.id);
                        }
                    } catch (e) { console.error("AI Error:", e.message); }
                }
            }
        }
    } catch (err) { res.sendStatus(200); }
});

module.exports = router;
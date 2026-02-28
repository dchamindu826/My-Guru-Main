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
        // මෙතනින් තමයි ඇත්තම ලෙඩේ අහුවෙන්නේ
        if (error.response) {
            console.error("❌ API ERROR DATA:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("❌ AXIOS ERROR:", error.message);
        }
    }
}

// Helper: Send Interactive Buttons (For Medium Selection)
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
                    body: {
                        text: "ඔයාට My Guru ගෙන් ප්‍රශ්න අහන්න ඕන Medium එක මොකක්ද? 👇"
                    },
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
        console.log(`[WhatsApp] ✅ Buttons Sent: ${response.data.messages[0].id}`);
    } catch (error) {
        console.error("❌ BUTTON ERROR:", JSON.stringify(error.response?.data || error.message, null, 2));
    }
}

// Webhook Verification
router.get('/webhook', (req, res) => {
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    if (mode && token) {
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            console.log("✅ WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Main Webhook for receiving messages
router.post('/webhook', async (req, res) => {
    try {
        let body = req.body;
        
        // ලොග්ස් වැඩිකරගන්න මේක දැම්මා
        console.log("📩 Full Webhook Payload:", JSON.stringify(body, null, 2));
        
        // Status updates අල්ලගන්න (Delivered ද නැද්ද බලන්න)
        if (body.entry && body.entry[0].changes[0].value.statuses) {
            let statusObj = body.entry[0].changes[0].value.statuses[0];
            console.log(`📊 Status Update: ID ${statusObj.id} is now ${statusObj.status}`);
            return res.sendStatus(200);
        }

        if (body.object === 'whatsapp_business_account') {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
                
                let msgObj = body.entry[0].changes[0].value.messages[0];
                let phone_number = msgObj.from;
                let msg_type = msgObj.type;
                
                res.sendStatus(200); 

                // 1. Get User Profile
                const { data: userProfile } = await supabase.from('profiles').select('*').eq('whatsapp_number', phone_number).single();

                if (!userProfile) {
                    await sendWhatsAppMessage(phone_number, "ආයුබෝවන්! My Guru වෙත සාදරයෙන් පිළිගනිමු. 🎓\nකරුණාකර ලියාපදිංචි වන්න.");
                    return;
                }

                // 2. Plan Check
                const { data: activePlan } = await supabase.from('payments')
                    .select('*').eq('user_id', userProfile.id).eq('status', 'approved')
                    .order('created_at', { ascending: false }).limit(1).single();

                if (!activePlan || activePlan.package_name === 'Free') {
                    await sendWhatsAppMessage(phone_number, "🛑 කරුණාකර Upgrade කරන්න.");
                    return;
                }

                // 3. Session Management
                let { data: session } = await supabase.from('whatsapp_sessions').select('*').eq('phone', phone_number).single();
                if (!session) {
                    const newSession = { phone: phone_number, state: 'CHOOSING_MEDIUM', medium: null, subject: null };
                    await supabase.from('whatsapp_sessions').insert([newSession]);
                    session = newSession;
                }

                let msg_text = "";
                if (msg_type === 'text') msg_text = msgObj.text.body;
                else if (msg_type === 'interactive') msg_text = msgObj.interactive.button_reply.title;

                // Menu Command
                if (msg_text.toLowerCase() === '#menu') {
                    await supabase.from('whatsapp_sessions').update({ state: 'CHOOSING_MEDIUM', subject: null }).eq('phone', phone_number);
                    await sendMediumSelectionButtons(phone_number);
                    return;
                }

                // State Machine Logic
                if (session.state === 'CHOOSING_MEDIUM') {
                    if (['Sinhala', 'English', 'Tamil'].includes(msg_text)) {
                        await supabase.from('whatsapp_sessions').update({ state: 'CHOOSING_SUBJECT', medium: msg_text }).eq('phone', phone_number);
                        await sendWhatsAppMessage(phone_number, `✅ ${msg_text} තෝරාගත්තා! දැන් විෂය අංකය (1-14) එවන්න.`);
                    } else {
                        await sendMediumSelectionButtons(phone_number);
                    }
                    return;
                }

                if (session.state === 'CHOOSING_SUBJECT') {
                    const subjectsMap = { '1': 'Science', '2': 'Mathematics', '3': 'History', '4': 'Buddhism', '5': 'Sinhala' }; 
                    let chosenSubject = subjectsMap[msg_text.trim()];
                    if (chosenSubject) {
                        await supabase.from('whatsapp_sessions').update({ state: 'CHATTING', subject: chosenSubject }).eq('phone', phone_number);
                        await sendWhatsAppMessage(phone_number, `🎉 ${chosenSubject} තෝරාගත්තා! දැන් ප්‍රශ්නය එවන්න.`);
                    } else {
                        await sendWhatsAppMessage(phone_number, "⚠️ අංකය වැරදියි (1-14).");
                    }
                    return;
                }

                if (session.state === 'CHATTING') {
                    // Gemini Call
                    let payload = { question: msg_text, subject: session.subject, medium: session.medium };
                    try {
                        const aiRes = await axios.post("http://127.0.0.1:5002/chat", payload);
                        if(aiRes.data && aiRes.data.answer) {
                            await sendWhatsAppMessage(phone_number, aiRes.data.answer);
                        }
                    } catch (error) {
                        console.error("AI Brain Error:", error.message);
                    }
                }
            }
        }
    } catch (err) {
        console.error("General Webhook Error:", err);
        res.sendStatus(200); 
    }
});

module.exports = router;
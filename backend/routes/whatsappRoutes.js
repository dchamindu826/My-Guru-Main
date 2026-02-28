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
        // 1. Get Media URL
        const urlRes = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
            headers: { 'Authorization': `Bearer ${WA_TOKEN}` }
        });
        const mediaUrl = urlRes.data.url;

        // 2. Download Media File
        const fileRes = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            headers: { 'Authorization': `Bearer ${WA_TOKEN}` }
        });

        // 3. Convert to Base64
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
        await axios({
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
    } catch (error) {
        console.error("WhatsApp Text Error:", error.response?.data || error.message);
    }
}

// Helper: Send Interactive Buttons (For Medium Selection)
async function sendMediumSelectionButtons(to) {
    try {
        await axios({
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
    } catch (error) {
        console.error("WhatsApp Button Error:", error.response?.data || error.message);
    }
}

// Webhook Verification (For Meta setup)
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
        
        if (body.object === 'whatsapp_business_account') {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
                
                let msgObj = body.entry[0].changes[0].value.messages[0];
                let phone_number = msgObj.from;
                let msg_type = msgObj.type;
                
                // Immediately respond to WhatsApp to prevent retries
                res.sendStatus(200); 

                // 1. Get User Profile based on Whatsapp Number
                const { data: userProfile } = await supabase.from('profiles').select('*').eq('whatsapp_number', phone_number).single();

                if (!userProfile) {
                    await sendWhatsAppMessage(phone_number, "ආයුබෝවන්! My Guru වෙත සාදරයෙන් පිළිගනිමු. 🎓\nකරුණාකර අපගේ වෙබ් අඩවියෙන් ලියාපදිංචි වී Premium Plan එකක් ලබා ගන්න.\n👉 https://myguru.lumi-automation.com");
                    return;
                }

                // 2. Check User Plan & Credits (Shared with Web)
                const { data: activePlan } = await supabase.from('payments')
                    .select('*')
                    .eq('user_id', userProfile.id)
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!activePlan || activePlan.package_name === 'Free') {
                    await sendWhatsAppMessage(phone_number, "🛑 සමාවෙන්න, WhatsApp AI සේවාව ලබා ගත හැක්කේ Premium සිසුන්ට පමණි. කරුණාකර Upgrade කරන්න.\n👉 https://myguru.lumi-automation.com/plans");
                    return;
                }

                // --- Credit Logic ---
                let isUnlimited = activePlan.package_name.toLowerCase().includes('genius');
                let maxCredits = isUnlimited ? 150 : 100; // FUP for unlimited is 150/day. Scholar is 100/package.

                let { data: userCredit } = await supabase.from('user_credits').select('*').eq('user_id', userProfile.id).single();
                let today = new Date().toISOString().split('T')[0];

                if (!userCredit) {
                    // Create credit record if missing
                    const newCredit = { user_id: userProfile.id, total_used: 0, daily_used: 0, last_reset_date: today };
                    await supabase.from('user_credits').insert([newCredit]);
                    userCredit = newCredit;
                } else if (userCredit.last_reset_date !== today) {
                    // Reset daily limit
                    await supabase.from('user_credits').update({ daily_used: 0, last_reset_date: today }).eq('user_id', userProfile.id);
                    userCredit.daily_used = 0;
                }

                if (!isUnlimited && userCredit.total_used >= maxCredits) {
                    await sendWhatsAppMessage(phone_number, "🛑 ඔයාගේ පැකේජයේ ප්‍රශ්න ප්‍රමාණය අවසන් වී ඇත. කරුණාකර නැවත Upgrade කරන්න.");
                    return;
                }
                if (isUnlimited && userCredit.daily_used >= maxCredits) {
                    await sendWhatsAppMessage(phone_number, "🛑 Fair Usage Policy: ඔයාගේ අද දවසේ ප්‍රශ්න ප්‍රමාණය (150) අවසන්. හෙට නැවත උත්සාහ කරන්න.");
                    return;
                }


                // 3. Get or Create Session
                let { data: session } = await supabase.from('whatsapp_sessions').select('*').eq('phone', phone_number).single();
                
                if (!session) {
                    const newSession = { phone: phone_number, state: 'CHOOSING_MEDIUM', medium: null, subject: null };
                    await supabase.from('whatsapp_sessions').insert([newSession]);
                    session = newSession;
                }

                // 4. Handle Text Messages & Commands
                let msg_text = "";
                if (msg_type === 'text') {
                    msg_text = msgObj.text.body;
                } else if (msg_type === 'interactive' && msgObj.interactive.type === 'button_reply') {
                    // When user clicks a button
                    let btnId = msgObj.interactive.button_reply.id;
                    if (btnId === 'MED_SINHALA') msg_text = "Sinhala";
                    else if (btnId === 'MED_ENGLISH') msg_text = "English";
                    else if (btnId === 'MED_TAMIL') msg_text = "Tamil";
                }

                // #menu Command
                if (msg_text.toLowerCase() === '#menu') {
                    await supabase.from('whatsapp_sessions').update({ state: 'CHOOSING_MEDIUM', subject: null }).eq('phone', phone_number);
                    await sendMediumSelectionButtons(phone_number);
                    return;
                }

                // 5. STATE MACHINE
                
                // STATE 1: CHOOSING MEDIUM
                if (session.state === 'CHOOSING_MEDIUM') {
                    if (['Sinhala', 'English', 'Tamil'].includes(msg_text)) {
                        await supabase.from('whatsapp_sessions').update({ state: 'CHOOSING_SUBJECT', medium: msg_text }).eq('phone', phone_number);
                        
                        let subjectListMsg = `✅ *${msg_text}* Medium තෝරාගත්තා!\n\nදැන් විෂය (Subject) තෝරන්න (අංකය පමණක් එවන්න):\n\n1️⃣ Science\n2️⃣ Mathematics\n3️⃣ History\n4️⃣ Buddhism\n5️⃣ Sinhala\n6️⃣ English\n7️⃣ ICT\n8️⃣ Commerce\n9️⃣ Health\n🔟 Geography\n1️⃣1️⃣ Civic\n1️⃣2️⃣ Media\n1️⃣3️⃣ Tamil\n1️⃣4️⃣ Agriculture`;
                        await sendWhatsAppMessage(phone_number, subjectListMsg);
                    } else {
                        // If they sent text instead of clicking buttons, send buttons again
                        await sendMediumSelectionButtons(phone_number);
                    }
                    return;
                }

                // STATE 2: CHOOSING SUBJECT
                if (session.state === 'CHOOSING_SUBJECT') {
                    const subjectsMap = {
                        '1': 'Science', '2': 'Mathematics', '3': 'History', '4': 'Buddhism', '5': 'Sinhala',
                        '6': 'English', '7': 'ICT', '8': 'Commerce', '9': 'Health', '10': 'Geography',
                        '11': 'Civic', '12': 'Media', '13': 'Tamil', '14': 'Agriculture'
                    };
                    
                    let chosenSubject = subjectsMap[msg_text.trim()];

                    if (chosenSubject) {
                        await supabase.from('whatsapp_sessions').update({ state: 'CHATTING', subject: chosenSubject }).eq('phone', phone_number);
                        
                        let welcomeMsg = `🎉 *${chosenSubject}* තෝරාගත්තා!\n\nආයුබෝවන් ${userProfile.full_name || 'පුතේ'}! 👋\nමම My Guru.\nඔයාට තියෙන ${chosenSubject} ප්‍රශ්න මගෙන් අහන්න.\n\n(Photo එකක් හෝ Voice note එකක් වුනත් එවන්න පුළුවන් 📸🎤)\n\n_මෙනුව වෙනස් කිරීමට ඕනෑම වෙලාවක #menu ලෙස යවන්න._`;
                        await sendWhatsAppMessage(phone_number, welcomeMsg);
                    } else {
                        await sendWhatsAppMessage(phone_number, "⚠️ කරුණාකර නිවැරදි විෂය අංකය (1-14) තෝරන්න.");
                    }
                    return;
                }

                // STATE 3: CHATTING (Talking to Gemini)
                if (session.state === 'CHATTING') {
                    
                    let payload = {
                        question: msg_type === 'text' ? msg_text : "Please analyze this media",
                        subject: session.subject,
                        medium: session.medium
                    };

                    // Handle Images
                    if (msg_type === 'image') {
                        let base64Img = await getMediaBase64(msgObj.image.id);
                        if(base64Img) payload.image_data = base64Img;
                        payload.question = msgObj.image.caption || "මේ රූපයේ තියෙන ප්‍රශ්නෙට උත්තර දෙන්න.";
                    }
                    
                    // Handle Voice Notes (Audio)
                    if (msg_type === 'audio') {
                        let base64Audio = await getMediaBase64(msgObj.audio.id);
                        if(base64Audio) payload.audio_data = base64Audio;
                        payload.question = "Listen to this audio and answer the question.";
                    }

                    if(!payload.image_data && !payload.audio_data && !msg_text) {
                        return; // Ignore unsupported message types (like stickers, location etc)
                    }

                    try {
                        // Call Python Brain (Make sure this URL is correct for your VPS)
                        const aiRes = await axios.post("http://127.0.0.1:5002/chat", payload);
                        
                        if(aiRes.data && aiRes.data.answer) {
                            await sendWhatsAppMessage(phone_number, aiRes.data.answer);

                            // Update Credits after successful response
                            await supabase.from('user_credits')
                                .update({ 
                                    total_used: userCredit.total_used + 1,
                                    daily_used: userCredit.daily_used + 1
                                })
                                .eq('user_id', userProfile.id);
                        } else {
                            throw new Error("Empty AI Response");
                        }

                    } catch (error) {
                        console.error("Brain API Error:", error.message);
                        await sendWhatsAppMessage(phone_number, "⚠️ AI සර්වර් එක කාර්යබහුලයි. කරුණාකර මද වෙලාවකින් නැවත අහන්න.");
                    }
                }
            }
        } else {
            // Return a '404 Not Found' if event is not from a WhatsApp API
            res.sendStatus(404);
        }
    } catch (err) {
        console.error("Webhook Catch Error:", err);
        // Don't send 500 back to WhatsApp or they will keep retrying and spamming
        res.sendStatus(200); 
    }
});

module.exports = router;
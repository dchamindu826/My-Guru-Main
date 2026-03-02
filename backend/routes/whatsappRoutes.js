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
                        text: "🎓 Welcome to My Guru! | My Guru වෙත සාදරයෙන් පිළිගනිමු!\n\nඔයාට My Guru ගෙන් ප්‍රශ්න අහන්න ඕන Medium එක මොකක්ද? 👇\nPlease select your preferred language medium 👇"
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
        
        console.log("📩 Full Webhook Payload:", JSON.stringify(body, null, 2));
        
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

                // 1. Get User Profile based on Whatsapp Number (Old Logic - This works for you!)
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
                    // Reset daily limit in user_credits
                    await supabase.from('user_credits').update({ daily_used: 0, last_reset_date: today }).eq('user_id', userProfile.id);
                    userCredit.daily_used = 0;
                    
                    // Also reset daily limit in profiles (For Web UI)
                    await supabase.from('profiles').update({ credits_used: 0, last_reset_date: today }).eq('id', userProfile.id);
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
                if (msg_text.toLowerCase() === '#menu' || msg_text.toLowerCase() === 'menu' || msg_text.toLowerCase() === 'hi' || msg_text.toLowerCase() === 'hello') {
                    await supabase.from('whatsapp_sessions').update({ state: 'CHOOSING_MEDIUM', subject: null }).eq('phone', phone_number);
                    await sendMediumSelectionButtons(phone_number);
                    return;
                }

                // 5. STATE MACHINE
                
                // STATE 1: CHOOSING MEDIUM
                if (session.state === 'CHOOSING_MEDIUM') {
                    if (['Sinhala', 'English', 'Tamil'].includes(msg_text)) {
                        await supabase.from('whatsapp_sessions').update({ state: 'CHOOSING_SUBJECT', medium: msg_text }).eq('phone', phone_number);
                        
                        let subjectListMsg = "";
                        
                        // 🔥 NO ICONS, JUST NUMBERS + TRANSLATIONS
                        if (msg_text === 'Sinhala') {
                            subjectListMsg = `✅ සිංහල මාධ්‍යය තෝරාගත්තා!\n\nදැන් විද්‍යාව, ගණිතය වැනි අදාළ විෂය තෝරන්න (අංකය පමණක් එවන්න):\n\n1. විද්‍යාව (Science)\n2. ගණිතය (Mathematics)\n3. ඉතිහාසය (History)\n4. බුද්ධ ධර්මය (Buddhism)\n5. සිංහල (Sinhala)\n6. ඉංග්‍රීසි (English)\n7. තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)\n8. වාණිජ හා ගිණුම්කරණය (Commerce)\n9. සෞඛ්‍යය හා ශාරීරික අධ්‍යාපනය (Health)\n10. භූගෝල විද්‍යාව (Geography)\n11. පුරවැසි අධ්‍යාපනය (Civic)\n12. මාධ්‍ය අධ්‍යයනය (Media)\n13. දෙමළ (Tamil)\n14. කෘෂිකර්මය (Agriculture)`;
                        } else if (msg_text === 'English') {
                            subjectListMsg = `✅ English Medium Selected!\n\nPlease select the subject by replying with its number:\n\n1. Science\n2. Mathematics\n3. History\n4. Buddhism\n5. Sinhala\n6. English\n7. ICT\n8. Commerce\n9. Health\n10. Geography\n11. Civic\n12. Media\n13. Tamil\n14. Agriculture`;
                        } else if (msg_text === 'Tamil') {
                            subjectListMsg = `✅ தமிழ் ஊடகம் தேர்ந்தெடுக்கப்பட்டது!\n\nதயவுசெய்து பாடத்தின் எண்ணை மட்டும் அனுப்பவும்:\n\n1. விஞ்ஞானம் (Science)\n2. கணிதம் (Mathematics)\n3. வரலாறு (History)\n4. பௌத்த தர்மம் (Buddhism)\n5. சிங்களம் (Sinhala)\n6. ஆங்கிலம் (English)\n7. தகவல் தொழில்நுட்பம் (ICT)\n8. வர்த்தகம் (Commerce)\n9. சுகாதாரம் (Health)\n10. புவியியல் (Geography)\n11. குடியியல் (Civic)\n12. ஊடகம் (Media)\n13. தமிழ் (Tamil)\n14. விவசாயம் (Agriculture)`;
                        }

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
                        
                        let welcomeMsg = "";
                        let medium = session.medium;
                        
                        // 🔥 TRANSLATED WELCOME MESSAGE
                        if (medium === 'Sinhala') {
                            welcomeMsg = `🎉 ${chosenSubject} තෝරාගත්තා!\n\nආයුබෝවන් ${userProfile.full_name || 'පුතේ'}! 👋\nමම My Guru, ලංකාවේ පළවෙනි AI ගුරුවරයා.\nඔයාට තියෙන ${chosenSubject} ප්‍රශ්න මගෙන් අහන්න.\n\n(Photo එකක් හෝ Voice note එකක් වුනත් එවන්න පුළුවන් 📸🎤)\n\n_මෙනුව වෙනස් කිරීමට ඕනෑම වෙලාවක #menu ලෙස යවන්න._`;
                        } else if (medium === 'English') {
                            welcomeMsg = `🎉 ${chosenSubject} Selected!\n\nHello ${userProfile.full_name || 'there'}! 👋\nI am My Guru, Sri Lanka's First AI Teacher.\nWhat are your questions regarding ${chosenSubject}?\n\n(You can send a Photo or a Voice note too 📸🎤)\n\n_To change the menu at any time, reply with #menu._`;
                        } else if (medium === 'Tamil') {
                            welcomeMsg = `🎉 ${chosenSubject} தேர்ந்தெடுக்கப்பட்டது!\n\nவணக்கம் ${userProfile.full_name || ''}! 👋\nநான் My Guru, இலங்கையின் முதல் AI ஆசிரியர்.\n${chosenSubject} பற்றிய உங்கள் கேள்விகளை என்னிடம் கேளுங்கள்.\n\n(நீங்கள் ஒரு புகைப்படம் அல்லது குரல் குறிப்பையும் அனுப்பலாம் 📸🎤)\n\n_மெனுவை மாற்ற எந்த நேரத்திலும் #menu என அனுப்பவும்._`;
                        } else {
                            welcomeMsg = `🎉 ${chosenSubject} Selected!\nAsk your questions now.`;
                        }

                        await sendWhatsAppMessage(phone_number, welcomeMsg);
                    } else {
                        let errorMsg = "⚠️ කරුණාකර නිවැරදි විෂය අංකය (1-14) තෝරන්න.\n⚠️ Please reply with a valid subject number (1-14).";
                        await sendWhatsAppMessage(phone_number, errorMsg);
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

                            // 🔥 UPDATE CREDITS IN BOTH TABLES (So Web UI updates too!)
                            
                            // 1. Update user_credits table
                            await supabase.from('user_credits')
                                .update({ 
                                    total_used: userCredit.total_used + 1,
                                    daily_used: userCredit.daily_used + 1
                                })
                                .eq('user_id', userProfile.id);
                                
                            // 2. Update profiles table (This is what the React Frontend reads!)
                            let currentWebCredits = userProfile.credits_used || 0;
                            await supabase.from('profiles')
                                .update({
                                    credits_used: currentWebCredits + 1
                                })
                                .eq('id', userProfile.id);
                                
                        } else {
                            throw new Error("Empty AI Response");
                        }

                    } catch (error) {
                        console.error("Brain API Error:", error.message);
                        let errMsg = session.medium === 'Sinhala' 
                                     ? "⚠️ AI සර්වර් එක කාර්යබහුලයි. කරුණාකර මද වෙලාවකින් නැවත අහන්න." 
                                     : "⚠️ The AI server is busy. Please try again in a moment.";
                        await sendWhatsAppMessage(phone_number, errMsg);
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
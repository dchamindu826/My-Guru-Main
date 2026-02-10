const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractSlipData(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Extract specific details from this bank slip.
      Return ONLY a JSON object with these fields:
      {
        "extracted_amount": number (e.g. 500.00),
        "ref_number": "string" (Transaction ID/Ref No if visible, else null),
        "date_time": "string" (Format YYYY-MM-DD HH:mm if visible, else null),
        "is_blurry": boolean (true if text is unreadable),
        "bank_name": "string" (Sender bank name if visible)
      }
    `;

    const result = await model.generateContent([prompt, { inlineData: { data: buffer.toString("base64"), mimeType: "image/jpeg" } }]);
    const text = result.response.text();
    return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());

  } catch (error) {
    console.error("AI Error:", error);
    return { is_blurry: true }; // Fail safe
  }
}

module.exports = { extractSlipData };
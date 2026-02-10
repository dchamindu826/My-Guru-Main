const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user_id: { type: String, required: true },     // Firebase ID
    user_email: { type: String, required: true },
    user_name: { type: String },
    package_name: { type: String, required: true },
    amount: { type: Number, required: true },
    slip_url: { type: String, required: true },    // Supabase Image Link
    whatsapp_number: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
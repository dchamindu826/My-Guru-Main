const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: { type: String, required: true },       // Starter / Scholar
    price: { type: String, required: true },      // Rs. 499
    period: { type: String, required: true },     // Per Month
    features: [{ type: String }],                 // Array of strings ["Daily 100 Qs", "All Subjects"]
    isPopular: { type: Boolean, default: false }, // Best Value Badge
    color: { type: String, default: 'gray' }      // UI Color (amber/blue/gray)
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
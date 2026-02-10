const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// 1. Existing Routes
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 2. NEW ROUTES (Mewa nisa thama 404 awe)
app.use('/api/testimonials', require('./routes/testimonialRoutes')); // Site Testimonials
app.use('/api/feedbacks', require('./routes/feedbackRoutes'));       // Student Issues/Widget
app.use('/api/ingest', require('./routes/ingestRoutes'));

// 3. Bank SMS Route (For Auto-Verification)
// app.use('/api/bank-sms', require('./routes/bankRoutes')); // Uncomment if you setup SMS App

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
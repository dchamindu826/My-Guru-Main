// backend/models/TokenUsage.js
const mongoose = require('mongoose');

const tokenUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // User කෙනෙක් ලොග් වෙලා නැත්නම් null තියන්න පුළුවන්
  },
  actionType: {
    type: String,
    required: true,
    default: 'chat' // chat, document_qa, summarize වගේ දේවල්
  },
  inputTokens: {
    type: Number,
    required: true,
    default: 0
  },
  outputTokens: {
    type: Number,
    required: true,
    default: 0
  },
  totalTokens: {
    type: Number,
    required: true,
    default: 0
  },
  estimatedCost: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('TokenUsage', tokenUsageSchema);
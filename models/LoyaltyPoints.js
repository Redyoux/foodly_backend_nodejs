const mongoose = require('mongoose');

const pointsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    points: { type: Number, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Orders' }, // Optional field
    reason: { 
        type: String, 
        enum: ['earn', 'redeem'],  // Use simple strings to match Flutter app
        required: true 
    },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyPoints', pointsSchema);


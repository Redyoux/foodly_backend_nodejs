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
    date: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }, // Expiration date
}, { timestamps: true });

// Automatically set the expiration date (7 days from creation)
pointsSchema.pre('save', function (next) {
    if (!this.expiresAt) {
        // Calculate the expiration date as 7 days after the point was created
        this.expiresAt = new Date(this.date.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
    next();
});

module.exports = mongoose.model('LoyaltyPoints', pointsSchema);

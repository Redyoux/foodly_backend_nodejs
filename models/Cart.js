const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
    additives: { type: Array },
    instructions: { type: String, default: '' },
    totalPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    promotion: { type: Boolean, default: false },
    promotionPrice: { type: Number, default: 0.0 }
}, { timestamps: true }); // Enables `createdAt` and `updatedAt` fields

module.exports = mongoose.model('Cart', cartSchema);

const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    amount: { type: Number, required: true },
    accountNumber: { type: String, required: true, default: 'none'},
    accountName: {type: String, required: true, default: 'none'},
    accountBank: {type: String, required: true, default: 'none'},
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    method: { type: String, default: 'bank_transfer', enum: ['bank_transfer', 'paypal', 'stripe'], required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Orders' }] ,// Add this line
    unpaidAmount:{type: Number, required:true, default:0.0},
    platformCostRestaurant:{type:Number, required:true, default:0.0}
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payout', PayoutSchema);

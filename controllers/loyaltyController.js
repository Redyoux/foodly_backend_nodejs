const Points = require('../models/LoyaltyPoints');
const Order = require('../models/Orders'); // Assuming you have an Order model

const mongoose = require('mongoose');

// Add points (earn or redeem)
module.exports = {
    
    addPoints: async (req, res) => {
        const { userId, points, orderId, reason } = req.body;

        try {
            console.log(`[INFO] Incoming request to add points. UserId: ${userId}, Points: ${points}, Reason: ${reason}, OrderId: ${orderId || 'None'}`);

            // Optional: Check if order exists (if `orderId` is passed)
            if (orderId) {
                console.log(`[INFO] Checking if order exists for OrderId: ${orderId}`);
                const order = await Order.findById(orderId);
                
                if (!order) {
                    console.log(`[WARN] Order not found for OrderId: ${orderId}`);
                    return res.status(404).json({ error: 'Order not found' });
                }

                console.log(`[INFO] Order found: ${orderId}`);
            }

            // Create new points transaction
            console.log(`[INFO] Creating points transaction for UserId: ${userId}`);
            const pointsTransaction = new Points({
                userId,
                points,
                orderId, // Optional: May not always exist
                reason,
            });

            // Save the points record
            console.log(`[INFO] Saving points transaction for UserId: ${userId}`);
            const savedTransaction = await pointsTransaction.save();

            console.log(`[SUCCESS] Points transaction saved successfully for UserId: ${userId}. Transaction ID: ${savedTransaction._id}`);

            res.status(201).json({
                message: 'Points transaction saved successfully',
                data: savedTransaction
            });
        } catch (error) {
            console.error(`[ERROR] Failed to save points transaction for UserId: ${userId}. Error: ${error.message}`);

            res.status(500).json({ error: 'Failed to save points transaction' });
        }
    },
};

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
    
    getPoints: async (req, res) => {
        console.log(req.params);  // Check if this logs the userId correctly

        const { userId } = req.params;
        console.log("User id ",userId);
    
        try {
            console.log(`[INFO] Fetching points transactions for UserId: ${userId}`);
    
            // Find all points transactions for the specified user
            const pointsTransactions = await Points.find({ userId });
    
            if (!pointsTransactions || pointsTransactions.length === 0) {
                console.log(`[INFO] No points transactions found for UserId: ${userId}`);
                return res.status(404).json({ message: 'No points transactions found for this user' });
            }
    
            // Transform the response to match the front-end model
            const transformedTransactions = pointsTransactions.map(transaction => ({
                userId: transaction.userId,  // Ensure this is a string if needed
                points: transaction.points,  // Or another field representing "points"
                orderId: transaction._id.toString(),  // Assuming this is the order ID
                reason: transaction.confirmation ? 'earn' : 'redeem'  // Example logic for reason
            }));
    
            console.log(`[SUCCESS] Points transactions fetched successfully for UserId: ${userId}`);
            res.status(200).json({
                message: 'Points transactions retrieved successfully',
                data: transformedTransactions  // Return transformed data
            });
        } catch (error) {
            console.error(`[ERROR] Failed to retrieve points transactions for UserId: ${userId}. Error: ${error.message}`);
            res.status(500).json({ error: 'Failed to retrieve points transactions' });
        }
    }
    
};

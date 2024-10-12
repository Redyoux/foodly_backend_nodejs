const Points = require('../models/LoyaltyPoints');
const Order = require('../models/Orders'); // Assuming you have an Order model
const Users = require("../models/User");

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
    
                if (reason === "redeem") {
                    await Order.updateOne(
                        { _id: orderId },
                        { $set: { redeemed: true } }
                    );
                }
    
                console.log(`[INFO] Order found: ${orderId}`);
            }
    
            // Calculate the expiration date (7 days from now)
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7);
    
            console.log(`[INFO] Creating points transaction for UserId: ${userId}`);
            let redeemPoints = reason === "redeem" ? 0 : points;
    
            // If redeem, calculate the needed points and update records
            if (reason === "redeem") {
                let redeemablePoints = parseFloat(points) * 6; // Convert to redeemable points
    
                // Fetch points records for the user that are not expired and not yet redeemed
                const availablePoints = await Points.find({
                    userId,
                    reason: "earn",
                    expiresAt: { $gte: new Date() }
                }).sort({ createdAt: 1 }); // Sort by the earliest points first
    
                console.log("My available points are ", availablePoints);
                let accumulatedPoints = 0;
                for (let i = 0; i < availablePoints.length; i++) {
                    const pointRecord = availablePoints[i];
                    accumulatedPoints += pointRecord.points;
    
                    // If accumulated points reach or exceed the redeemable points
                    if (accumulatedPoints >= redeemablePoints) {
                        // Calculate the points to deduct from the current record
                        const pointsToDeduct = redeemablePoints - (accumulatedPoints - pointRecord.points);
                        const remainingPoints = pointRecord.points - pointsToDeduct;
    
                        if (remainingPoints > 0) {
                            // If there are remaining points, update the current record with the deducted points
                            await Points.updateOne(
                                { _id: pointRecord._id },
                                { $set: { points: remainingPoints } }
                            );
                            console.log(`[INFO] Points record ${pointRecord._id} updated with remaining points: ${remainingPoints}`);
    
                            // Create a new record for the redeemed points from this record
                            const redeemedRecord = new Points({
                                userId,
                                points: pointsToDeduct,
                                orderId,
                                reason: "redeem",
                                expiresAt: pointRecord.expiresAt
                            });
                            await redeemedRecord.save();
                            console.log(`[INFO] New points record created for redeemed points: ${pointsToDeduct}`);
                        } else {
                            // Mark the entire record as redeemed if no points are left
                            await Points.updateOne(
                                { _id: pointRecord._id },
                                { $set: { reason: "redeem", points: 0 } }
                            );
                            console.log(`[INFO] Points record ${pointRecord._id} fully redeemed.`);
                        }
                        break;
                    } else {
                        // Mark the current record as fully redeemed
                        await Points.updateOne(
                            { _id: pointRecord._id },
                            { $set: { reason: "redeem", points: 0 } }
                        );
                        console.log(`[INFO] Points record ${pointRecord._id} fully redeemed.`);
                    }
                }
    
                if (accumulatedPoints < redeemablePoints) {
                    console.log(`[WARN] Insufficient redeemable points for UserId: ${userId}. Required: ${redeemablePoints}, Available: ${accumulatedPoints}`);
                    return res.status(400).json({ error: 'Insufficient redeemable points' });
                }
            } else {
                // Non-redeem reason: Create a new points transaction
                const pointsTransaction = new Points({
                    userId,
                    points: redeemPoints,
                    orderId,
                    reason,
                    expiresAt: expirationDate
                });
    
                console.log(`[INFO] Saving points transaction for UserId: ${userId}`);
                const savedTransaction = await pointsTransaction.save();
                console.log(`[SUCCESS] Points transaction saved successfully for UserId: ${userId}. Transaction ID: ${savedTransaction._id}`);
            }
    
            // Update the totalPoints in the users collection
            console.log(`[INFO] Updating totalPoints for UserId: ${userId}`);
            const user = await Users.findById(userId);
            if (!user) {
                console.log(`[ERROR] User not found for UserId: ${userId}`);
                return res.status(404).json({ error: 'User not found' });
            }
    
            // Add/subtract the new points to the user's existing totalPoints
            let updatedTotalPoints = 0;
            if (reason === "redeem") {
                let totalRedeemedPoints = parseFloat(points);
                console.log("Total redeemable points: ", totalRedeemedPoints);
                console.log("Current redeemable points available: ", user.totalPoints);
                updatedTotalPoints = ((user.totalPoints) - (totalRedeemedPoints * 6)).toFixed(2);
            } else {
                updatedTotalPoints = ((user.totalPoints || 0) + points).toFixed(2);
            }
            if (updatedTotalPoints < 0) {
                updatedTotalPoints = 0;
            }
    
            await Users.updateOne(
                { _id: userId },
                { $set: { totalPoints: updatedTotalPoints } }
            );
            console.log(`[SUCCESS] Updated totalPoints for UserId: ${userId}. New totalPoints: ${updatedTotalPoints}`);
    
            res.status(201).json({
                message: 'Points transaction and totalPoints updated successfully',
                data: redeemPoints
            });
    
        } catch (error) {
            console.error(`[ERROR] Failed to save points transaction or update totalPoints for UserId: ${userId}. Error: ${error.message}`);
            res.status(500).json({ error: 'Failed to save points transaction or update totalPoints' });
        }
    },    
    
    
    getPoints: async (req, res) => {
        console.log(req.params);  // Check if this logs the userId correctly
    
        const { userId } = req.params;
        console.log("User id ", userId);
    
        try {
            console.log(`[INFO] Fetching points transactions for UserId: ${userId}`);
    
            // Find all points transactions for the specified user
            const pointsTransactions = await Points.find({ userId });
    
            if (!pointsTransactions || pointsTransactions.length === 0) {
                console.log(`[INFO] No points transactions found for UserId: ${userId}`);
                return res.status(404).json({ message: 'No points transactions found for this user' });
            }
    
            // Calculate total points by summing up the points from all transactions
            const totalPoints = pointsTransactions.reduce((sum, transaction) => sum + transaction.points, 0);
    
            // Update the totalPoints in the users collection
            await Users.updateOne(
                { _id: userId },  // Find the user by their userId
                { $set: { totalPoints: totalPoints } }  // Update the totalPoints field
            );
    
            // Transform the response to match the front-end model
            const transformedTransactions = pointsTransactions.map(transaction => ({
                userId: transaction.userId.toString(),  // Ensure this is a string
                points: transaction.points,             // The points in the transaction
                orderId: transaction.orderId ? transaction.orderId.toString() : 'N/A', // Convert orderId to string or show 'N/A' if not present
                reason: transaction.reason,             // Use the 'reason' field directly
                expiresAt: transaction.expiresAt,       // Include expiration date
            }));
    
            console.log(`[SUCCESS] Points transactions and total points updated successfully for UserId: ${userId}`);
            res.status(200).json({
                message: 'Points transactions retrieved successfully',
                totalPoints,  // Include the total points in the response
                data: transformedTransactions  // Return transformed data
            });
        } catch (error) {
            console.error(`[ERROR] Failed to retrieve and update points transactions for UserId: ${userId}. Error: ${error.message}`);
            res.status(500).json({ error: 'Failed to retrieve and update points transactions' });
        }
    },
     

    getTotalPoints: async (req, res) => {
        console.log(req.params);  // Log to verify if userId is received
    
        const { userId } = req.params;
        console.log("User id ", userId);
    
        try {
            console.log(`[INFO] Fetching total points for UserId: ${userId}`);
    
            // Find the user by their ID and return only the totalPoints field
            const user = await Users.findById(userId, 'totalPoints');
    
            if (!user) {
                console.log(`[INFO] No user found for UserId: ${userId}`);
                return res.status(404).json({ message: 'User not found' });
            }
    
            // Get the total points from the user document
            const totalPoints = user.totalPoints || 0; // If no points are found, default to 0
    
            console.log(`[SUCCESS] Total points fetched successfully for UserId: ${userId}`);
            res.status(200).json({
                message: 'Total points retrieved successfully',
                totalPoints:parseFloat(totalPoints) // Return total points
            });
        } catch (error) {
            console.error(`[ERROR] Failed to retrieve total points for UserId: ${userId}. Error: ${error.message}`);
            res.status(500).json({ error: 'Failed to retrieve total points' });
        }
    },

    updatePoints: async (req, res) => {
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
    
            // Calculate the expiration date (7 days from now)
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7);  // Set expiration date to 7 days in the future
    
            // Create new points transaction with expiration date
            console.log(`[INFO] Creating points transaction for UserId: ${userId}`);
            const pointsTransaction = new Points({
                userId,
                points,
                orderId, // Optional: May not always exist
                reason,
                expiresAt: expirationDate  // Set the expiration date
            });
    
            // Save the points record
            console.log(`[INFO] Saving points transaction for UserId: ${userId}`);
            const savedTransaction = await pointsTransaction.save();
            console.log(`[SUCCESS] Points transaction saved successfully for UserId: ${userId}. Transaction ID: ${savedTransaction._id}`);
    
            // Update the totalPoints in the users collection
            console.log(`[INFO] Updating totalPoints for UserId: ${userId}`);
            const user = await Users.findById(userId);
            if (!user) {
                console.log(`[ERROR] User not found for UserId: ${userId}`);
                return res.status(404).json({ error: 'User not found' });
            }
    
            // Add the new points to the user's existing totalPoints
            const updatedTotalPoints = (user.totalPoints || 0) + points;
            await Users.updateOne(
                { _id: userId },  // Find the user by their userId
                { $set: { totalPoints: updatedTotalPoints } }  // Update totalPoints
            );
            console.log(`[SUCCESS] Updated totalPoints for UserId: ${userId}. New totalPoints: ${updatedTotalPoints}`);
    
            res.status(201).json({
                message: 'Points transaction and totalPoints updated successfully',
                data: savedTransaction
            });
        } catch (error) {
            console.error(`[ERROR] Failed to save points transaction or update totalPoints for UserId: ${userId}. Error: ${error.message}`);
    
            res.status(500).json({ error: 'Failed to save points transaction or update totalPoints' });
        }
    },
    
};

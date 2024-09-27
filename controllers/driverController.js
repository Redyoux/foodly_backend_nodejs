const Driver = require('../models/Driver');
const User = require('../models/User');
const Order = require("../models/Orders");
const mongoose = require('mongoose');


module.exports = {
    registerDriver: async (req, res) => {
        const userId = req.user.id;
        const newDriver = new Driver({
            driver: userId, 
            vehicleType: req.body.vehicleType,
            phone: req.body.phone,
            vehicleNumber: req.body.vehicleNumber,
            currentLocation: {
                latitude: req.body.latitude,
                longitude: req.body.longitude
            },
        });

        
    
        try {
            await newDriver.save();
            await User.findByIdAndUpdate(
                userId,
                { userType: "Driver" },
                { new: true, runValidators: true });
            res.status(201).json({ status: true, message: 'Driver successfully added',});
        } catch (error) {
            res.status(500).json({ status: false, message: error.message, });
        }
    },    

    getDriverDetails: async (req, res) => {
        const driverId = req.user.id;
    
        try {
            const driver = await Driver.find({driver: driverId})
            if (driver) {
                res.status(200).json(driver[0]);
            } else {
                res.status(404).json({ status: false, message: 'Driver not found' });
            }
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    updateDriverDetails: async (req, res) => {
        const driverId  = req.params.id;
    
        try {
            const updatedDriver = await Driver.findByIdAndUpdate(driverId, req.body, { new: true });
            if (updatedDriver) {
                res.status(200).json({ status: true, message: 'Driver details updated successfully' });
            } else {
                res.status(404).json({ status: false, message: 'Driver not found' });
            }
        } catch (error) {
            res.status(500).json(error);
        }
    },

    deleteDriver: async (req, res) => {
        const driverId = req.params.id;
    
        try {
            await Driver.findByIdAndDelete(driverId);
            res.status(200).json({ status: true, message: 'Driver deleted successfully' });
        } catch (error) {
            res.status(500).json(error);
        }
    },

    setDriverAvailability: async (req, res) => {
        const driverId  = req.params.id;
    
        try {
            const driver = await Driver.findById(driverId);
            if (!driver) {
                res.status(404).json({ status: false, message: 'Driver not found' });
                return;
            }
    
            // Toggle the availability
            driver.isAvailable = !driver.isAvailable;
            await driver.save();
    
            res.status(200).json({ status: true, message: `Driver is now ${driver.isAvailable ? 'available' : 'unavailable'}`, data: driver });
        } catch (error) {
            res.status(500).json(error);
        }
    },

     getDriversEarning: async (req, res) => {
        const driverId = req.params.id.trim();
        console.log("Driver ID:", driverId);
    
        try {
            // Validate driver ID
            const driver = await Driver.findById(driverId);
            console.log("Driver:", driver);
    
            if (!driver) {
                return res.status(404).json({ status: false, message: 'Driver not found' });
            }
    
            // Aggregate monthly earnings
            const monthlyEarnings = await Order.aggregate([
                { $match: { driverId: new mongoose.Types.ObjectId(driverId), orderStatus: 'Delivered' } },
                {
                    $group: {
                        _id: { year: { $year: "$orderDate" }, month: { $month: "$orderDate" } },
                        totalEarnings: { $sum: '$deliveryFee' }
                    }
                },
                { $project: { _id: 0, year: "$_id.year", month: "$_id.month", totalEarnings: 1 } },
            ]);
    
            // Aggregate weekly earnings
            const weeklyEarnings = await Order.aggregate([
                { $match: { driverId: new mongoose.Types.ObjectId(driverId), orderStatus: 'Delivered' } },
                {
                    $group: {
                        _id: { year: { $year: "$orderDate" }, week: { $week: "$orderDate" } },
                        totalEarnings: { $sum: '$deliveryFee' }
                    }
                },
                { $project: { _id: 0, year: "$_id.year", week: "$_id.week", totalEarnings: 1 } },
            ]);
    
            // Aggregate daily earnings
            const dailyEarnings = await Order.aggregate([
                { $match: { driverId: new mongoose.Types.ObjectId(driverId), orderStatus: 'Delivered' } },
                {
                    $group: {
                        _id: { year: { $year: "$orderDate" }, month: { $month: "$orderDate" }, day: { $dayOfMonth: "$orderDate" } },
                        totalEarnings: { $sum: '$deliveryFee' }
                    }
                },
                { $project: { _id: 0, year: "$_id.year", month: "$_id.month", day: "$_id.day", totalEarnings: 1 } },
            ]);
    
            return res.status(200).json({ status: true, monthlyEarnings, weeklyEarnings, dailyEarnings });
        } catch (error) {
            console.error("Error:", error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
    
}
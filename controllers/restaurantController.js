const Orders = require("../models/Orders");
const Payout = require("../models/Payout");
const Foods = require("../models/Food");
const Restaurant =require("../models/Restaurant")
const User =require("../models/User");
const payoutRequestEmail = require("../utils/payout_request_email");
const admin = require("firebase-admin");


module.exports ={
    addRestaurant: async (req, res) => {
        const owner = req.user.id;
        const { title, time, imageUrl, code, logoUrl, coords } = req.body;
    
        // Check if required fields are not empty
        if (!title || !time || !imageUrl ||  !code || !logoUrl || !coords || !coords.latitude || !coords.longitude || !coords.address || !coords.title) {
            return res.status(400).json({ status: false, message: 'Missing required fields' });
        }
    
        // Check if the restaurant code already exists
        const existingRestaurant = await Restaurant.findOne({ owner: owner });
        if (existingRestaurant) {
            return res.status(400).json({ status: false, message: 'Restaurant with this code already exists', data: existingRestaurant });
        }
    
        const newRestaurant = new Restaurant(req.body);
    
        try {
            await newRestaurant.save();
            await User.findByIdAndUpdate(
                owner,
                { userType: "Vendor" },
                { new: true, runValidators: true });
            

            res.status(201).json({ status: true, message: 'Restaurant successfully created' });
        } catch (error) {
            res.status(500).json({status: false, message: error.message });
        }
    },


    getRestaurantByOwner: async (req, res) => {
        const id = req.user.id;
        try {
            const restaurant = await Restaurant.findOne({owner: id}) // populate the restaurant field if needed


            if (!restaurant) {
                return res.status(404).json({ status: false, message: 'restaurant item not found' });
            }

            res.status(200).json(restaurant);

        } catch (error) {
            res.status(500).json({status: false, message: error.message });
        }
    },
    

     getRandomRestaurants: async (req, res) => {
        try {
            let randomRestaurants = [];
    
            // Check if code is provided in the params
            if (req.params.code) {
                randomRestaurants = await Restaurant.aggregate([
                    { $match: { code: req.params.code, serviceAvailability: true } },
                    { $sample: { size: 5 } },
                    { $project: {  __v: 0 } }
                ]);
            }
            
            // If no code provided in params or no restaurants match the provided code
            if (!randomRestaurants.length) {
                randomRestaurants = await Restaurant.aggregate([
                    { $sample: { size: 5 } },
                    { $project: {  __v: 0 } }
                ]);
            }
    
            // Respond with the results
            if (randomRestaurants.length) {
                res.status(200).json(randomRestaurants);
            } else {
                res.status(404).json({status: false, message: 'No restaurants found' });
            }
        } catch (error) {
            res.status(500).json({status: false, message: error.message });
        }
    },

    

    getAllRandomRestaurants: async (req, res) => {
        try {
            let randomRestaurants = [];
    
            // Check if code is provided in the params
            if (req.params.code) {
                randomRestaurants = await Restaurant.aggregate([
                    { $match: { code: req.params.code, serviceAvailability: true } },
                    { $project: {  __v: 0 } }
                ]);
            }
            
            // If no code provided in params or no restaurants match the provided code
            if (!randomRestaurants.length) {
                randomRestaurants = await Restaurant.aggregate([
                    { $project: {  __v: 0 } }
                ]);
            }
    
            // Respond with the results
            if (randomRestaurants.length) {
                res.status(200).json(randomRestaurants);
            } else {
                res.status(404).json({status: false, message: 'No restaurants found' });
            }
        } catch (error) {
            res.status(500).json({status: false, message: error.message });
        }
    },

     serviceAvailability: async (req, res) => {
        const restaurantId = req.params.id; 
    
        try {
            // Find the restaurant by its ID
            const restaurant = await Restaurant.findById(restaurantId);
    
            if (!restaurant) {
                return res.status(404).json({ message: 'Restaurant not found' });
            }
    
            // Toggle the isAvailable field
            restaurant.isAvailable = !restaurant.isAvailable;
    
            // Save the changes
            await restaurant.save();
    
            res.status(200).json({ message: 'Availability toggled successfully', isAvailable: restaurant.isAvailable });
        } catch (error) {
            res.status(500).json({status: false, message: error.message});
        }
    },

    deleteRestaurant: async (req, res) => {
        const id  = req.params;
    
        if (!id) {
            return res.status(400).json({ status: false, message: 'Restaurant ID is required for deletion.' });
        }
    
        try {
            await Restaurant.findByIdAndRemove(id);
    
            res.status(200).json({ status: true, message: 'Restaurant successfully deleted' });
        } catch (error) {
            console.error("Error deleting Restaurant:", error);
            res.status(500).json({ status: false, message: 'An error occurred while deleting the restaurant.' });
        }
    },
    
    getRestaurant: async (req, res) => {
        const id = req.params.id;

        try {
            const restaurant = await Restaurant.findById(id) // populate the restaurant field if needed

            if (!restaurant) {
                return res.status(404).json({ status: false, message: 'restaurant item not found' });
            }

            

            res.status(200).json(restaurant);
        } catch (error) {
            res.status(500).json(error);
        }
    },

    getStats: async (req, res) => {
        const restaurantId = req.params.id;

        // Ensure that restaurantId is provided
        if (!restaurantId) {
          return res.status(400).json({
            message: 'Restaurant ID is required.'
          });
        }
      
        try {
          // Step 1: Fetch orders that belong to the restaurant and meet the criteria
          const orders = await Orders.find({
            restaurantId: restaurantId,
            paymentStatus: 'Completed',
            orderStatus: 'Delivered',
            confirmation: true,
            revenueCalculated: false
          });

          console.log("checking orders ",orders.length);
          const ordersTotal = await Orders.countDocuments({ restaurantId: restaurantId, orderStatus: "Delivered" });
          const deliveryRevenue = await Orders.countDocuments({ restaurantId: restaurantId, orderStatus: "Delivered" });
          const cancelledOrders = await Orders.countDocuments({ restaurantId: restaurantId, orderStatus: "Cancelled" });
          const data = await Restaurant.findById(restaurantId, {coords: 0});
          //-1 means the latest one
          const latestPayout = await Payout.find({restaurant: restaurantId}).sort({ createdAt: -1 });
          let processingOrders = await Orders.countDocuments({
            restaurantId: restaurantId,
            orderStatus: {
              $in: ["Placed", "Preparing", "Manual", "Ready", "Out_for_Delivery", "Delivered"]
            },
            confirmation: false,  // Only include orders that are not confirmed
          });
          let grossRevenue = 0;
          const restaurantToken = await User.findById(data.owner, { fcm: 1 });
          // Step 4: Respond with the calculated gross revenue
          let revenueTotal = grossRevenue;

          // If no orders are found, return a message
          if (orders.length === 0) {
            const latestPayout = await Payout.find({restaurant: restaurantId}).sort({ createdAt: -1 });
            if(latestPayout.length!=0){
                if(latestPayout[0].unpaidAmount!=0){
                    
                }
            }else{

                return res.status(200).json({
                    data,
                    revenueTotal,
                    deliveryRevenue,
                    cancelledOrders,
                    processingOrders,
                    latestPayout,
                    totalOrders: orders.length,
                    ordersTotal,
                    restaurantToken
                  });
            }
           
          }
          console.log("going ahead with the data");
          // Initialize grossRevenue to 0
        
      
          // Step 2: Calculate gross revenue by summing the orderTotal of each order
          orders.forEach(order => {
            grossRevenue += order.orderTotal;  // Ignoring the delivery fee
          });
    

      
    

            if(latestPayout.length!=0){
                let revenueTotal = latestPayout[0].unpaidAmount;
               // if(revenueTotal!=0){
                    grossRevenue=0;
                    orders.forEach(order => {
                        grossRevenue += order.orderTotal;  // Ignoring the delivery fee
                      });
                      revenueTotal=revenueTotal+grossRevenue;
               // }
                return res.status(200).json({
                    data,
                    revenueTotal,
                    deliveryRevenue,
                    cancelledOrders,
                    processingOrders,
                    latestPayout,
                    totalOrders: orders.length,
                    ordersTotal,
                    restaurantToken
                  });
            }else{
                return res.status(200).json({
                    data,
                    revenueTotal,
                    deliveryRevenue,
                    cancelledOrders,
                    processingOrders,
                    latestPayout,
                    totalOrders: orders.length,
                    ordersTotal,
                    restaurantToken
                  });
            }

          

        
        } catch (error) {
          console.error('Error calculating gross revenue:', error);
          return res.status(500).json({
            message: 'Internal server error',
            error
          });
        }

    },

    createPayout: async (req, res) => {
       const restaurantId = req.params.id;
        try {
            const restaurant = await Restaurant.findById(restaurantId);
            const user = await User.findById(restaurant.owner, { email: 1, username: 1 });
            if (!user) {
                return res.status(404).json({ status: false, message: "User not found" });
            }
            const pendingPayout = await Payout.findOne({ restaurant: restaurantId, status: 'pending' });
            if (pendingPayout) {
                return res.status(400).json({ status: false, message: "There is already a pending payout request." });
            }

            const orders = await Orders.find({
                restaurantId: restaurantId,
                paymentStatus: 'Completed',
                orderStatus: 'Delivered',
                confirmation: true,
                revenueCalculated: false
              });
                   // Fetch previous unpaid amount from the last payout
            const lastPayout = await Payout.findOne({ restaurant: restaurantId }).sort({ createdAt: -1 });
            let previousUnpaidAmount = lastPayout ? lastPayout.unpaidAmount : 0;
            // Initialize grossRevenue to 0
            let grossRevenue = 0;
            const orderIds = [];

            // Calculate gross revenue and collect order IDs
            //so that we can update them
            orders.forEach(order => {
              grossRevenue += order.orderTotal;  // Ignoring the delivery fee
              orderIds.push(order._id); // Collect order ID
            });

            //save the unpaid amount to the database
            let unPaidamount = previousUnpaidAmount+ grossRevenue -req.body.amount;
            console.log("printing unPaidamount ", unPaidamount);
            console.log("printing previousUnpaidAmount ", previousUnpaidAmount);
            console.log("printing grossRevenue ", grossRevenue);
            console.log("printing body ", req.body.amount);
            if(req.body.amount > (previousUnpaidAmount+ grossRevenue)) {

               return res.status(201).json({ status: true, message: "You can not request more than your Withdrawable!!" });
            }
            /*
                total 100,
                wanted 50,
                profit 5,
                withdraw = 50-5=45,
                save = 100-50
            */
            let platformCostRestaurant = parseFloat(req.body.amount*0.1).toFixed(2);
            const cashout = new Payout({
                amount: req.body.amount,
                restaurant: req.body.restaurant,
                accountNumber: req.body.accountNumber,
                accountName: req.body.accountName,
                accountBank: req.body.accountBank,
                paymentMethod: req.body.paymentMethod,
                orders: orderIds,
                unpaidAmount:parseFloat(unPaidamount).toFixed(2),
                platformCostRestaurant:platformCostRestaurant,
            });

            await cashout.save();

             // Update orders to mark revenueCalculated as true
                await Orders.updateMany(
                    { _id: { $in: orderIds } },
                    { $set: { revenueCalculated: true } }
                );
           
            payoutRequestEmail(user.email, user.username,req.body.amount)
            res.status(201).json({ status: true, message: "Cashout request sent successfully" });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },

    getRestarantFinance: async (req, res) => {
        const id = req.params.id;

        try {
            const restaurant = await Restaurant.findById(id) // populate the restaurant field if needed

            if (!restaurant) {
                return res.status(404).json({ status: false, message: 'restaurant item not found' });
            }

            res.status(200).json(restaurant);
        } catch (error) {
            res.status(500).json(error);
        } 
    },

    sendMessages: async (req, res) => {
        const body = req.body;
        const userId = body.data.to_uid;
        console.log(userId);
        const user = await User.findById(userId, { fcm: 1 })
        console.log(user);
        if (user.fcm || user.fcm !== null || user.fcm !== '') {
            console.log(user.fcm);
            const message = {
                notification: {
                    title: body.notification.title,
                    body: body.notification.body
                },
                data: body.data,
                token: user.fcm
            }
        
            try {
                await admin.messaging().send(message);
                console.log('Push notification sent successfully');
            } catch (error) {
                console.log('Error:', "Error sending push notification:");
            }
          //  sendPushNotification(user.fcm, "🎊 From restaurant 🎉", data, `Thank you for ordering from us! Your enquires would be met.`)
        }
        
        try {
            
            res.status(200).json({"msg":"success"});
            console.log("success");
        } catch (error) {
            res.status(500).json(error);
        }
    },

    editFood: async (req, res) => {
        const requiredFields = {
            title: req.body.title,
            foodTags: req.body.foodTags,
            category: req.body.category,
            foodType: req.body.foodType,
            code: req.body.code,
            isAvailable: req.body.isAvailable,
            restaurant: req.body.restaurant,
            description: req.body.description,
            time: req.body.time,
            price: req.body.price,
            additives: req.body.additives,
            imageUrl: req.body.imageUrl
        };
    
        // Check for missing fields
        const missingFields = Object.keys(requiredFields).filter(field => !requiredFields[field]);
    
        // If any field is missing, return the missing fields
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                status: false, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        let { title, foodTags, category, foodType, code, isAvailable, restaurant, description, time, price, additives, imageUrl, promotion, promotionPrice } = req.body;
        
        console.log(" items ", title, foodTags, category, foodType, code, isAvailable, restaurant, description, time, price, additives, imageUrl, promotion, promotionPrice );
        //return;
        try {
            // Find the food item by its ID
            const foodItem = await Foods.findById(req.params.id);
            if (!foodItem) {
                return res.status(404).json({ status: false, message: 'Food item not found' });
            }

            if(promotion==false){
                promotionPrice=0.0;
            }
    
            // Update food item properties
            foodItem.title = title;
            foodItem.foodTags = foodTags;
            foodItem.category = category;
            foodItem.foodType = foodType;
            foodItem.code = code;
            foodItem.isAvailable = isAvailable;
            foodItem.restaurant = restaurant;
            foodItem.description = description;
            foodItem.time = time;
            foodItem.price = price;
            foodItem.additives = additives;
            foodItem.imageUrl = imageUrl;
            foodItem.promotion = promotion;
            foodItem.promotionPrice = promotionPrice;
            foodItem.verified=false;
    
            // Save the updated food item
            await foodItem.save();
    
            res.status(200).json({ status: true, message: 'Food item successfully updated', data: foodItem });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },
    
    
}
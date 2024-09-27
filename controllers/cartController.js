const Cart = require('../models/Cart');
const Food = require('../models/Food');

module.exports = {

    addProductToCart: async (req, res) => {
        const userId = req.user.id;
        const {  productId, totalPrice, quantity } = req.body;
        console.log(req.body);
        let count;
        try {
            const existingProduct = await Cart.findOne({ userId, productId });
             count = await Cart.countDocuments({ userId });

            if (existingProduct) {
                existingProduct.quantity += 1;
                existingProduct.totalPrice += totalPrice;
                await existingProduct.save();
            } else {
                const newCartEntry = new Cart({
                    userId: userId,
                    productId: req.body.productId,
                    additives: req.body.additives,
                    instructions: req.body.instructions,
                    totalPrice: req.body.totalPrice,
                    quantity: req.body.quantity
                });
                await newCartEntry.save();
                 count = await Cart.countDocuments({ userId });
                 console.log("my count ", count);
            }

            res.status(201).json({ status: true, count: count });
        } catch (error) {
            res.status(500).json(error);
        }
    },

    removeProductFromCart: async (req, res) => {
        const itemId = req.params.id;
        const userId = req.user.id;

        try {
            await Cart.findOneAndDelete({_id:itemId});
            count = await Cart.countDocuments({ userId });
            res.status(200).json({ status: true, count: count });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },


    removeProductsFromCart: async (req, res) => {
        const itemIds = req.body.itemIds;  // Expecting an array of item IDs from Flutter
        const userId = req.user.id;
    
        try {
            // Delete all items in the given list of IDs
            await Cart.deleteMany({ _id: { $in: itemIds }, userId: userId });
    
            // Get updated count of items in the cart
            const count = await Cart.countDocuments({ userId });
    
            res.status(200).json({ status: true, count: count });
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },


    fetchUserCart: async (req, res) => {
        const id = req.user.id;
        try {
            const userCart = await Cart.find({ userId: id })
                .populate({
                    path: 'productId',
                    select: "imageUrl title restaurant rating ratingCount",
                    populate: {
                        path: 'restaurant',
                        select: "time coords imageUrl" // Add the fields you want to select from the restaurant
                    }
                });
    
            const count = await Cart.countDocuments({ userId: id });
    
            // Map through the userCart to calculate unit price as a number
            const updatedCart = userCart.map(item => {
                const unitPrice = Number((item.totalPrice / item.quantity).toFixed(2)); // Convert to a number after fixing to 2 decimals
                
                return {
                    ...item.toObject(), // Convert the mongoose document to a plain object
                    unitPrice: unitPrice, // Ensure unitPrice is a number
                };
            });
    
            console.log(updatedCart);
            res.status(200).json(updatedCart);
        } catch (error) {
            res.status(500).json({ status: false, message: error.message });
        }
    },         

    clearUserCart: async (req, res) => {
        const userId = req.user.id;


        try {
            await Cart.deleteMany({ userId });
            res.status(200).json({ status: true, message: 'User cart cleared successfully' });
        } catch (error) {
            res.status(500).json(error);
        }
    },

    getCartCount: async (req, res) => {
        const userId = req.user.id;
    
        try {
            const count = await Cart.countDocuments({ userId: userId });
            res.status(200).json({ status: true, cartCount: count });
        } catch (error) {
            res.status(500).json(error);
        }
    },

    decrementProductQuantity: async (req, res) => {
        const userId = req.user.id;
        const productId = req.body.productId;
    
        try {
            const cartItem = await Cart.findOne({ userId, productId });
            
            if (cartItem) {
                // Calculate the price of a single product
                const productPrice = cartItem.totalPrice / cartItem.quantity;
    
                // If quantity is more than 1, decrement and adjust price
                if (cartItem.quantity > 1) {
                    cartItem.quantity -= 1;
                    cartItem.totalPrice -= productPrice; 
                    await cartItem.save();
                    res.status(200).json({ status: true, message: 'Product quantity decreased successfully' });
                } 
                // If quantity is 1, remove the item from the cart
                else {
                    await Cart.findOneAndDelete({ userId, productId });
                    res.status(200).json({ status: true, message: 'Product removed from cart' });
                }
            } else {
                res.status(404).json({ status: false, message: 'Product not found in cart' });
            }
        } catch (error) {
            res.status(500).json(error);
        }
    },


};
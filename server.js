const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');  // <-- Import CORS
const cron = require('node-cron'); // Import node-cron

const compression = require('compression');
const { fireBaseConnection } = require('./utils/fbConnect');
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const restRoute = require("./routes/restaurant");
const catRoute = require("./routes/category");
const foodRoute = require("./routes/food");
const cartRoute = require("./routes/cart");
const addressRoute = require("./routes/address");
const driverRoute = require("./routes/driver");
const messagingRoute = require("./routes/messaging");
const orderRoute = require("./routes/order");
const ratingRoute = require("./routes/rating");
const uploadRoute =require("./routes/uploads");
const loyaltyPoints = require("./routes/loyaltypoint");



dotenv.config()

fireBaseConnection();



const mongoose = require('mongoose');
const LoyaltyPoints = require('./models/LoyaltyPoints');
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("connected to the db")).catch((err) => { console.log(err) });




app.use(compression({
    level: 6,
    threshold: 0
}))
const corsOptions = {
  origin: '*', // Allow all origins, or specify your front-end domain like 'https://your-frontend.com'
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
};

// Enable CORS with the specified options
app.use(cors(corsOptions));  // <-- Enable CORS

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", authRoute);
app.use("/api/users", userRoute);
app.use("/api/restaurant", restRoute);
app.use("/api/category", catRoute);
app.use("/api/foods", foodRoute);
app.use("/api/cart", cartRoute);
app.use("/api/address", addressRoute);
app.use("/api/driver", driverRoute);
app.use("/api/orders", orderRoute);
app.use("/api/rating", ratingRoute);
app.use("/api/messaging", messagingRoute);
app.use("/api/uploads", uploadRoute);
app.use("/api/points", loyaltyPoints);


const ip =  "localhost";

const port = process.env.PORT || 3000; 

app.listen(port, ip, () => {
  console.log(`Product server listening on ${ip}:${port}`);
});

const Cart = require('./models/Cart'); // Import your Cart model


const removePendingCart = async () => {
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
      const result = await Cart.deleteMany({ createdAt: { $lte: cutoffDate } });
      console.log(`Removed ${result.deletedCount} pending items from cart.`);
  } catch (error) {
      console.error('Error removing pending cart items:', error);
  }
};

// Schedule the cron job to run every 24 hours
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled task to remove pending cart items...');
  removePendingCart();
});
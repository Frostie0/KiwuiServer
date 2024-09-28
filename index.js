//import dependancies
import express from 'express';
import morgan from "morgan";
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import WebSocketServer from './config/webSocket.js';


//dot env config
dotenv.config();

//database connection
connectDB();

//webSocket connection
WebSocketServer();




// Rest object 
const app = express();

//middlewares
app.use(morgan("dev"));
app.use(express.json({ limit: '20mb' }));
app.use(cors());
app.use(cookieParser());


//port
const PORT = process.env.PORT;

//listen
app.listen(PORT, () => {
  console.log(`Server is running on port ${process.env.PORT} on ${process.env.MODE_ENV}`);
});



//import routes
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import OTPRoutes from './routes/OTPRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import missionRoutes from './routes/missionRoutes.js';
import clientRoutes from './routes/clientRoutes.js';


//route user
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/seller",sellerRoutes);
app.use("/api/v1/driver",driverRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/OTP", OTPRoutes);
app.use("/api/v1/address", addressRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/alert", alertRoutes);
app.use("/api/v1/message",messageRoutes);
app.use("/api/v1/admin",adminRoutes);
app.use("/api/v1/promo",promoRoutes);
app.use("/api/v1/mission",missionRoutes);
app.use("/api/v1/client",clientRoutes);

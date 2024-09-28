import mongoose from "mongoose";
import dotenv from "dotenv";


const connectDB = async () => {

    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log(`Mongodb Connected ${mongoose.connection.host}`);

    }catch(error){

        console.log(`MongoDb Error ${error}`);
    }
};

export default connectDB;
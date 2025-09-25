import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

const connectDB= async()=>{
    try {
        let connectionInstance =await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Database connected, Host:${connectionInstance.connection.host}`)
        
    } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1)
    }
}
export default connectDB


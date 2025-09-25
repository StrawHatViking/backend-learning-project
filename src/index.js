import express from "express"
import dotenv from "dotenv"
import connectDB from "./db/database.connect.js";

dotenv.config()

const PORT = process.env.PORT || 3000;
const app = express();

connectDB()

app.get('/',(req,res)=>{
    res.send("hey")
});

app.listen(PORT, ()=>{
    console.log(`App Listening at Port: ${PORT}`)
})





































































/*
;(async () => {
        try {
            let connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
            console.log(`MongoDb connect at ${connectionInstance.connection.host}`)

            app.listen(PORT, () => {
                console.log(`App listening at Port: ${process.env.PORT}`)
            })

        } catch (error) {
            console.log("Error:", error)
            process.exit(1)
        }
    })()
        */
       
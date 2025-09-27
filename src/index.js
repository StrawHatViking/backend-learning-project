import dotenv from "dotenv";
import connectDB from "./db/database.connect.js";
import express from 'express'
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(express.json()); // For JSON APIs

(async () => {
  try {
    await connectDB(); // Await DB connection
    const server = app.listen(PORT, () => {
      console.log(`App Listening at Port: ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("Server Error:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Startup Error:", error);
    process.exit(1);
  }
})();

app.get("/", (req, res) => {
  res.send("hey");
});




























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

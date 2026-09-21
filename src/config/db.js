const mongoose = require('mongoose');
const dotenv = require("dotenv")
dotenv.config();
const URI = process.env.MONGO_URI;

async function ConnectDB() {
    try{
        await mongoose.connect(URI)
        console.log("Mongo db connected successfully")

    }
    catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

module.exports = {
    ConnectDB
}


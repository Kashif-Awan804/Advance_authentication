require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { ConnectDB } = require("./src/config/db");
const userRouter = require("./src/routes/userRoutes");

const app = express();


// ========================
// Middleware
// ========================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// ========================
// Routes
// ========================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running"
    });
});

app.use("/auth", userRouter);


// ========================
// 404 Handler
// ========================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});


// ========================
// Start Server
// ========================

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {

        await ConnectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {

        console.error(
            "Failed to start server:",
            error.message
        );

        process.exit(1);
    }
}

startServer();
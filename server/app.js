const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require('dotenv').config();

const indexRouter = require("./routes/IndexRouter");

// Import db from config to avoid circular dependencies
const { db } = require("./config/db");
console.log("Db has been connected!");

const allowedOrigins = ["http://localhost:5173", "https://canopy-ai.vercel.app"];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
}));

app.use(express.json());

app.use("/api", indexRouter);


app.listen(3000, () => {
    console.log("Server running on port 3000");
})



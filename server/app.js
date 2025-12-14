const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require('dotenv').config();

const {drizzle} = require("drizzle-orm/node-postgres");
const db = drizzle(process.env.DATABASE_URL);
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


app.listen(3000, () => {
    console.log("Server running on port 3000");
})



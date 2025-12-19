const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require('dotenv').config();

const indexRouter = require("./routes/IndexRouter");

// Import db from config to avoid circular dependencies
const { db } = require("./config/db");
console.log("Db has been connected!");

// Run pending migrations on startup
console.log("Checking for pending database migrations");
const { runPendingMigrations } = require("./utils/runMigration");
runPendingMigrations().then(() => {
    console.log("Database migrations check completed");
}).catch(err => {
    console.error("Error running migrations:", err);
    console.error("Migration error details:", err.message);
    // Don't exit - allow server to start even if migration fails
    // This allows the server to run if columns already exist
});

// Get frontend URL based on MODE environment variable
const MODE = process.env.MODE || 'development';
const frontendURL = MODE === 'production' 
    ? process.env.FRONTEND_URL_PROD 
    : process.env.FRONTEND_URL_DEF;

// Build allowed origins array
const allowedOrigins = [];
if (frontendURL) {
    allowedOrigins.push(frontendURL);
}
// Keep existing hardcoded origins as fallback for backward compatibility
allowedOrigins.push(
    "http://localhost:5173", 
    "https://canopy-ai.vercel.app",
    "https://canopy-chi.vercel.app" // Production frontend URL
);

console.log(`CORS configured for MODE: ${MODE}, Frontend URL: ${frontendURL}`);
console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true, // Allow cookies/credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase JSON body size limit to handle base64 images (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use("/api", indexRouter);


app.listen(3000, () => {
    console.log("Server running on port 3000");
})



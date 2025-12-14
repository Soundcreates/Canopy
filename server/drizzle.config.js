import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    dialect: "postgresql",
    schema: "./models/index.js",
    out: "./migrations",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    }
});
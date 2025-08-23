import express, { Express, Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import logger from "./util/winstonLogger";
import vlrRouter from "./routes/VLR";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import * as cron from "node-cron";
import { populateLiveMatches, settleLiveMatches } from "./controller/VLR";

// Load from environment variables

config();

const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(cors()); // Allow CORS for all origins
app.use(express.json());
app.use(
  cors({
    origin: "*", // Allow all origins (use specific domain in production)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware to log all incoming requests
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(
    `Incoming request | Method: ${req.method} | URL: ${req.url} | IP: ${req.ip}`
  );
  next();
});

// Add API routes
app.use("/api/vlr", vlrRouter);
// Error-handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    `Error encountered | Message: ${err.message} | Stack: ${err.stack}`
  );
  res.status(500).json({ message: "An error occurred on the server." });
});
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for server-side

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Schedule cron jobs
// populateLiveMatches every 30 seconds
cron.schedule("*/30 * * * * *", async () => {
  try {
    logger.info("Running populateLiveMatches cron job");
    await populateLiveMatches();
    logger.info("populateLiveMatches cron job completed successfully");
  } catch (error) {
    logger.error(`Error in populateLiveMatches cron job: ${error}`);
  }
});

// settleLiveMatches every 2 minutes
cron.schedule("*/2 * * * *", async () => {
  try {
    logger.info("Running settleLiveMatches cron job");
    await settleLiveMatches();
    logger.info("settleLiveMatches cron job completed successfully");
  } catch (error) {
    logger.error(`Error in settleLiveMatches cron job: ${error}`);
  }
});

logger.info("Cron jobs scheduled successfully");

// Start server and log the event
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

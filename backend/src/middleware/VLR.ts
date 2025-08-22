import { NextFunction, Request, Response } from "express";
import logger from "../util/winstonLogger";

export const validateFetchScheduledMatches = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.header("x-api-key");

  if (!apiKey) {
    logger.warn(`Validation failed: Missing x-api-key header | IP: ${req.ip}`);
    return res.status(401).json({ message: "x-api-key header is missing." });
  }

  const validApiKeys = process.env.X_API_KEYS?.split(",") || [];
  if (!validApiKeys.includes(apiKey)) {
    logger.warn(
      `Validation failed: Invalid API key | IP: ${req.ip} | Provided API Key: ${apiKey}`
    );
    return res.status(401).json({ message: "Invalid API key." });
  }

  next();
};

export const validateExctractMatcheStatistics = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.header("x-api-key");
  const matchUrl = req.body.matchUrl;
  if (!apiKey) {
    logger.warn(`Validation failed: Missing x-api-key header | IP: ${req.ip}`);
    return res.status(401).json({ message: "x-api-key header is missing." });
  }

  const validApiKeys = process.env.X_API_KEYS?.split(",") || [];
  if (!validApiKeys.includes(apiKey)) {
    logger.warn(
      `Validation failed: Invalid API key | IP: ${req.ip} | Provided API Key: ${apiKey}`
    );
    return res.status(401).json({ message: "Invalid API key." });
  }

  if (!matchUrl) {
    logger.warn(
      `Validation failed: Missing matchUrl in request body | IP: ${req.ip}`
    );
    return res.status(400).json({ message: "matchUrl is required." });
  }

  next();
};

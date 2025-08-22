import { createLogger, format, transports } from "winston";

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// Create logger
const logger = createLogger({
  level: "info", // Default level
  format: logFormat,
  transports: [
    // Error log file
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: logFormat,
    }),
    // Info log file
    new transports.File({
      filename: "logs/info.log",
      level: "info",
      format: logFormat,
    }),
    // Warning log file
    new transports.File({
      filename: "logs/warn.log",
      level: "warn",
      format: logFormat,
    }),
    // Combined log file
    new transports.File({
      filename: "logs/combined.log",
      format: logFormat,
    }),
    // Console output (optional)
    new transports.Console({
      format: format.combine(
        format.colorize(), // Add color to console logs
        logFormat
      ),
    }),
  ],
});

export default logger;

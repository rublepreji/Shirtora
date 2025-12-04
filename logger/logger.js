import winston from "winston";
import "winston-daily-rotate-file";

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`
  )
);

// Daily rotate transport
const transport = new winston.transports.DailyRotateFile({
  filename: "logs/%DATE%-app.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d", // keep logs for 14 days
});

// Logger object
const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    transport,
    new winston.transports.Console(), // also show logs in console
  ],
});

export {logger};

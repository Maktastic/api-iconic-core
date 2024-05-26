import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = format;

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

// Determine log level based on environment
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Configure log files dynamically
const logsDirectory = process.env.LOGS_DIRECTORY || 'logs';
const errorLogFile = path.join(logsDirectory, 'error.log');
const combinedLogFile = path.join(logsDirectory, 'combined.log');

// Create logger instance
const Logbook = createLogger({
    level: logLevel,
    format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),  // Capture stack trace in logs
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: errorLogFile, level: 'error' }),
        new transports.File({ filename: combinedLogFile })
    ]
});
// Export logger and error handling function
export default Logbook;

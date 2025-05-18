import * as winston from 'winston';
import { WinstonModuleOptions } from 'nest-winston';
import * as Transport from 'winston-transport';

const DailyRotateFile = require('winston-daily-rotate-file');

// Define color scheme for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.ms(),
  winston.format.printf((info) => {
    const { timestamp, level, message, context = '', ms, ...meta } = info;

    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      const { service, environment, ...usefulMeta } = meta;
      if (Object.keys(usefulMeta).length > 0) {
        metaStr = JSON.stringify(usefulMeta, null, 0)
          .replace(/[{}"]/g, '') // Remove parentheses and double quotes
          .replace(/,/g, ', '); // Add space after comma
      }
    }

    // Format: [Timestamp] LEVEL [Context] Message MetaData +ProcessingTime
    return `[${timestamp}] ${level.padEnd(7)} ${
      context ? `[${context}] ` : ''
    }${message}${metaStr ? ` | ${metaStr}` : ''} ${ms ? `+${ms}` : ''}`;
  }),
);

export const getWinstonLoggerConfig = (): WinstonModuleOptions => {
  const logLevel =
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

  const transports: Transport[] = [
    new winston.transports.Console({
      level: logLevel,
      format: winston.format.combine(
        process.env.NODE_ENV !== 'production'
          ? winston.format.colorize({ all: true })
          : winston.format.uncolorize(),
        consoleFormat,
      ),
    }),
  ];

  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  // Configure file rotation transport if not in test environment
  if (process.env.NODE_ENV !== 'test') {
    // Configure error log rotation
    const errorRotateTransport = new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m', // Rotate when file reaches 20MB
      maxFiles: '14d', // Keep logs for 14 days
      level: 'error',
      format: fileFormat,
    });

    // Configure combined log rotation for all levels
    const combinedRotateTransport = new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: logLevel,
      format: fileFormat,
    });

    // Log when new error log file is created
    errorRotateTransport.on('new', (filename) => {
      console.log(`New error log file created: ${filename}`);
    });

    // Log when new combined log file is created
    combinedRotateTransport.on('new', (filename) => {
      console.log(`New combined log file created: ${filename}`);
    });

    transports.push(errorRotateTransport, combinedRotateTransport);
  }

  return {
    transports,
    defaultMeta: {
      service: process.env.SERVICE_NAME || 'nest-application',
      environment: process.env.NODE_ENV || 'development',
    },
    handleExceptions: true,
    exitOnError: false,
  };
};

export const createContextLogger = (context: string) => {
  const loggerConfig = getWinstonLoggerConfig();
  return winston.createLogger({
    ...loggerConfig,
    defaultMeta: {
      ...loggerConfig.defaultMeta,
      context,
    },
  });
};

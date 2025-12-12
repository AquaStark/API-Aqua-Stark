/**
 * @fileoverview Logger Utility
 * 
 * Centralized logging utility that wraps Fastify's logger when available,
 * with fallback to console logging. Provides structured logging with
 * consistent formatting and environment-based log levels.
 */

import { FastifyInstance } from 'fastify';
import { NODE_ENV } from '../config';

// Singleton instance to hold Fastify logger
let fastifyLogger: FastifyInstance['log'] | null = null;

/**
 * Initializes the logger with a Fastify instance.
 * This should be called as soon as the Fastify app is created.
 * 
 * @param app - The Fastify instance to use for logging
 */
export function initializeLogger(app: FastifyInstance): void {
  fastifyLogger = app.log;
  logInfo('Logger initialized with Fastify logger');
}

/**
 * Formats a log message for console output when Fastify logger is not available.
 * 
 * @param level - Log level (INFO, ERROR, WARN, DEBUG)
 * @param message - The message to log
 * @returns Formatted string with timestamp and level
 */
function formatConsoleLog(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Logs an informational message.
 * 
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
export function logInfo(message: string, ...args: unknown[]): void {
  if (fastifyLogger) {
    fastifyLogger.info(args.length > 0 ? { args } : {}, message);
  } else {
    console.log(formatConsoleLog('INFO', message), ...args);
  }
}

/**
 * Logs an error message.
 * 
 * @param message - The error message to log
 * @param args - Additional arguments (e.g., error object)
 */
export function logError(message: string, ...args: unknown[]): void {
  if (fastifyLogger) {
    fastifyLogger.error(args.length > 0 ? { args } : {}, message);
  } else {
    console.error(formatConsoleLog('ERROR', message), ...args);
  }
}

/**
 * Logs a warning message.
 * 
 * @param message - The warning message to log
 * @param args - Additional arguments
 */
export function logWarn(message: string, ...args: unknown[]): void {
  if (fastifyLogger) {
    fastifyLogger.warn(args.length > 0 ? { args } : {}, message);
  } else {
    console.warn(formatConsoleLog('WARN', message), ...args);
  }
}

/**
 * Logs a debug message.
 * Only logs if NODE_ENV is not 'production'.
 * 
 * @param message - The debug message to log
 * @param args - Additional arguments
 */
export function logDebug(message: string, ...args: unknown[]): void {
  // Skip debug logs in production
  if (NODE_ENV === 'production') {
    return;
  }

  if (fastifyLogger) {
    fastifyLogger.debug(args.length > 0 ? { args } : {}, message);
  } else {
    // Use console.log for debug messages in console fallback
    console.log(formatConsoleLog('DEBUG', message), ...args);
  }
}

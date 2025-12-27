/**
 * @fileoverview Graceful Shutdown Utility
 * 
 * Handles graceful shutdown of the Fastify server on SIGTERM and SIGINT signals.
 * Ensures in-flight requests complete before closing the server.
 */

import { FastifyInstance } from 'fastify';
import { logInfo, logError, logWarn } from './logger';
import { SHUTDOWN_TIMEOUT } from '../config';

// Track if shutdown is in progress to prevent multiple shutdown attempts
let isShuttingDown = false;

/**
 * Performs graceful shutdown of the Fastify server.
 * Stops accepting new connections and waits for in-flight requests to complete.
 * 
 * @param app - The Fastify instance to shutdown
 * @param signal - The signal that triggered the shutdown
 */
async function gracefulShutdown(app: FastifyInstance, signal: string): Promise<void> {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    logWarn('Shutdown already in progress, ignoring signal');
    return;
  }

  isShuttingDown = true;
  logInfo(`Received ${signal}, shutting down gracefully...`);

  try {
    // Create a promise that resolves after the timeout
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        logWarn(`Shutdown timeout (${SHUTDOWN_TIMEOUT}ms) reached, forcing shutdown`);
        resolve();
      }, SHUTDOWN_TIMEOUT);
    });

    // Create a promise that resolves when the server closes
    const closePromise = app.close().then(() => {
      logInfo('Server closed successfully');
    });

    // Wait for either the server to close or the timeout
    // If timeout is reached first, the close() will be interrupted
    await Promise.race([closePromise, timeoutPromise]);
    
    logInfo('Shutdown completed');
    process.exit(0);
  } catch (error) {
    logError('Error during graceful shutdown', error);
    process.exit(1);
  }
}

/**
 * Sets up graceful shutdown handlers for SIGTERM and SIGINT signals.
 * Should be called after the server starts successfully.
 * 
 * @param app - The Fastify instance to setup shutdown for
 */
export function setupGracefulShutdown(app: FastifyInstance): void {
  // Handler for SIGTERM (sent by process managers like PM2, systemd, Docker)
  process.on('SIGTERM', () => {
    gracefulShutdown(app, 'SIGTERM').catch((error) => {
      logError('Error in SIGTERM handler', error);
      process.exit(1);
    });
  });

  // Handler for SIGINT (sent by Ctrl+C)
  process.on('SIGINT', () => {
    gracefulShutdown(app, 'SIGINT').catch((error) => {
      logError('Error in SIGINT handler', error);
      process.exit(1);
    });
  });

  logInfo('Graceful shutdown handlers registered');
}

